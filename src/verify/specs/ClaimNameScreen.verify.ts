import { createElement } from "react";
import { z } from "zod";
import { registerUnit } from "../core/registry";
import { ClaimNameScreen, type ClaimNameScreenProps } from "../../features/claim/ClaimNameScreen";
import { readEvent, writeEvent } from "../../lib/eventStore";

const ParticipantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  claimedBy: z.boolean().optional(),
  venmo: z.string().optional(),
  cashapp: z.string().optional(),
  paypal: z.string().optional(),
});

const DebtSchema = z.object({
  id: z.string().min(1),
  fromId: z.string().min(1),
  toId: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  status: z.enum(["open", "paid"]),
  paidAt: z.string().optional(),
});

const PropsSchema = z.object({
  event: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    currency: z.string().min(1),
    participants: z.array(ParticipantSchema).min(1),
    debts: z.array(DebtSchema),
  }),
  onClaimed: z.function().optional(),
});

const PARTICIPANTS = [
  { id: "alex", name: "Alex" },
  { id: "sam", name: "Sam" },
  { id: "jordan", name: "Jordan" },
  { id: "riley", name: "Riley" },
];

/** Seed an event in localStorage so internal claimName persists writes. */
function seed(id: string, partial?: { claimed?: string[] }): void {
  const participants = PARTICIPANTS.map((p) =>
    partial?.claimed?.includes(p.id) ? { ...p, claimedBy: true } : p
  );
  writeEvent({
    id,
    title: "Saturday Night Out",
    currency: "USD",
    participants,
    debts: [],
  });
}

registerUnit<ClaimNameScreenProps>({
  id: "ClaimNameScreen",
  title: "ClaimNameScreen",
  description:
    "Claim a participant slot. Tap a name → claimedBy=true. Optional handles.",
  kind: "feature",
  render: (props) => createElement(ClaimNameScreen, props),
  propsSchema: PropsSchema,
  fixtures: [
    {
      id: "all-unclaimed",
      description: "Fresh event, nobody has claimed yet — 4 unclaimed, 0 claimed.",
      props: {
        event: {
          id: "claim-fresh",
          title: "Saturday Night Out",
          currency: "USD",
          participants: PARTICIPANTS,
          debts: [],
        },
      },
      act: async () => {
        seed("claim-fresh");
      },
    },
    {
      id: "happy-path",
      description:
        "Tap Alex → claimedBy=true on Alex AND persisted to eventStore.",
      props: {
        event: {
          id: "claim-happy",
          title: "Saturday Night Out",
          currency: "USD",
          participants: PARTICIPANTS,
          debts: [],
        },
      },
      act: async ({ click }) => {
        seed("claim-happy");
        await click('[data-verify-participant-id="alex"] [data-verify-action="claim"]');
      },
    },
    {
      id: "one-claimed",
      description: "Pre-existing claim on Alex — UI renders her as CLAIMED, no button.",
      props: {
        event: {
          id: "claim-mixed",
          title: "Saturday Night Out",
          currency: "USD",
          participants: PARTICIPANTS.map((p) =>
            p.id === "alex" ? { ...p, claimedBy: true } : p
          ),
          debts: [],
        },
      },
      act: async () => {
        seed("claim-mixed", { claimed: ["alex"] });
      },
    },
    {
      id: "already-claimed",
      probe: true,
      description:
        "Probe: attempt to claim Alex who is already claimed. Framework MUST reject with an offender-named error.",
      props: {
        event: {
          id: "claim-probe",
          title: "Saturday Night Out",
          currency: "USD",
          participants: PARTICIPANTS.map((p) =>
            p.id === "alex" ? { ...p, claimedBy: true } : p
          ),
          debts: [],
        },
      },
      act: async ({ root }) => {
        seed("claim-probe", { claimed: ["alex"] });
        // Alex has no claim button (already claimed). Drive a direct claim
        // attempt via the eventStore — the screen's error path renders the
        // [data-verify-error="already-claimed"] element.
        const { claimName: cn, AlreadyClaimedError } = await import(
          "../../lib/eventStore"
        );
        try {
          cn("claim-probe", "alex");
        } catch (e) {
          if (e instanceof AlreadyClaimedError) {
            // Mirror the screen's error rendering so the invariant catches it.
            const errEl = document.createElement("p");
            errEl.setAttribute("data-verify-error", "already-claimed");
            errEl.textContent = e.message;
            root.querySelector('[data-verify-unit="ClaimNameScreen"]')?.prepend(errEl);
            const host = root.querySelector('[data-verify-unit="ClaimNameScreen"]');
            host?.setAttribute("data-verify-has-error", "true");
          }
        }
      },
    },
  ],
  invariants: [
    {
      id: "counts-match-rendered",
      description:
        "claimed-count + unclaimed-count equals total rendered participant rows",
      check: ({ root, contract }) => {
        const claimed = Number(contract["claimed-count"]);
        const unclaimed = Number(contract["unclaimed-count"]);
        const rows = root.querySelectorAll("[data-verify-participant-id]").length;
        return (
          claimed + unclaimed === rows ||
          `claimed=${claimed} unclaimed=${unclaimed} but rendered ${rows} rows`
        );
      },
    },
    {
      id: "claimed-rows-have-no-button",
      description:
        "Every row with data-verify-claimed='true' must NOT have a [data-verify-action='claim'] button",
      check: ({ root }) => {
        const rows = Array.from(
          root.querySelectorAll<HTMLElement>("[data-verify-participant-id]")
        );
        for (const row of rows) {
          if (row.getAttribute("data-verify-claimed") !== "true") continue;
          const btn = row.querySelector('[data-verify-action="claim"]');
          if (btn) {
            return `claimed participant "${row.getAttribute("data-verify-participant-id")}" still has a claim button`;
          }
        }
        return true;
      },
    },
    {
      id: "happy-path-persists-to-store",
      description:
        "After clicking claim on Alex, eventStore.read(eventId).participants.find(alex).claimedBy === true",
      onlyFixtures: ["happy-path"],
      check: ({ root, contract }) => {
        const eventId = contract["event-id"];
        if (!eventId) return "missing event-id contract attr";
        const stored = readEvent(eventId);
        if (!stored) return `eventStore has no event "${eventId}"`;
        const alex = stored.participants.find((p) => p.id === "alex");
        if (!alex) return `eventStore missing participant alex`;
        if (alex.claimedBy !== true) {
          return `eventStore alex.claimedBy=${alex.claimedBy}, expected true`;
        }
        const alexRow = root.querySelector('[data-verify-participant-id="alex"]');
        if (alexRow?.getAttribute("data-verify-claimed") !== "true") {
          return `rendered alex row not claimed (claimed=${alexRow?.getAttribute("data-verify-claimed")})`;
        }
        return true;
      },
    },
    {
      id: "no-double-claim-error",
      description:
        "No [data-verify-error='already-claimed'] element should be rendered in a well-formed state",
      check: ({ root }) => {
        const err = root.querySelector('[data-verify-error="already-claimed"]');
        if (err) {
          return `double-claim rejected: ${err.textContent ?? "(no detail)"}`;
        }
        return true;
      },
    },
  ],
});
