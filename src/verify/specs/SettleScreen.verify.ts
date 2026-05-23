import { createElement } from "react";
import { z } from "zod";
import { registerUnit } from "../core/registry";
import type { SettleScreenProps } from "../../features/settle/types";
import { SettleScreen } from "../../features/settle/SettleScreen";

const noop = () => {};

const ParticipantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
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

const PropsSchema = z
  .object({
    event: z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      currency: z.string().min(1),
      participants: z.array(ParticipantSchema).min(1),
      debts: z.array(DebtSchema),
    }),
    onMarkPaid: z.function().optional(),
  })
  .refine(
    (d) => d.event.debts.every((debt) => debt.fromId !== debt.toId),
    { message: "no self-debt allowed: fromId must differ from toId" }
  )
  .refine(
    (d) => {
      const ids = new Set(d.event.participants.map((p) => p.id));
      return d.event.debts.every((debt) => ids.has(debt.fromId) && ids.has(debt.toId));
    },
    { message: "every debt's fromId and toId must reference a known participant" }
  );

const PARTICIPANTS = [
  { id: "alex", name: "Alex", venmo: "alex" },
  { id: "sam", name: "Sam", venmo: "sam" },
  { id: "jordan", name: "Jordan", venmo: "jordan" },
  { id: "riley", name: "Riley", venmo: "riley" },
];

registerUnit<SettleScreenProps>({
  id: "SettleScreen",
  title: "SettleScreen",
  description:
    "The settle-up view: pairwise debts with payment deep-links + mark-as-paid. Receipt-styled per phase-2 DECISION.md.",
  kind: "feature",
  render: (props) => createElement(SettleScreen, props),
  propsSchema: PropsSchema,
  fixtures: [
    {
      id: "three-pairs",
      description:
        "Canonical scenario: Riley→Alex $75, Jordan→Alex $30 (both open), Jordan→Sam $5 (paid).",
      props: {
        event: {
          id: "sat-night-out",
          title: "Saturday Night Out",
          currency: "USD",
          participants: PARTICIPANTS,
          debts: [
            { id: "d1", fromId: "riley", toId: "alex", amountCents: 7500, status: "open" },
            { id: "d2", fromId: "jordan", toId: "alex", amountCents: 3000, status: "open" },
            { id: "d3", fromId: "jordan", toId: "sam", amountCents: 500, status: "paid", paidAt: "02:14" },
          ],
        },
        onMarkPaid: noop,
      },
    },
    {
      id: "single-debt",
      description: "A single open debt — the simplest case.",
      props: {
        event: {
          id: "small-dinner",
          title: "Lunch",
          currency: "USD",
          participants: PARTICIPANTS.slice(0, 2),
          debts: [
            { id: "d1", fromId: "sam", toId: "alex", amountCents: 1200, status: "open" },
          ],
        },
        onMarkPaid: noop,
      },
    },
    {
      id: "all-settled",
      description: "Every debt cleared — outstanding must be zero, no pay buttons rendered.",
      props: {
        event: {
          id: "closed-event",
          title: "Already Settled",
          currency: "USD",
          participants: PARTICIPANTS,
          debts: [
            { id: "d1", fromId: "riley", toId: "alex", amountCents: 7500, status: "paid", paidAt: "01:00" },
            { id: "d2", fromId: "jordan", toId: "alex", amountCents: 3000, status: "paid", paidAt: "01:05" },
          ],
        },
        onMarkPaid: noop,
      },
    },
    {
      id: "no-debts",
      description: "Empty debts array — must render the empty state, not crash.",
      props: {
        event: {
          id: "fresh-event",
          title: "Fresh Tab",
          currency: "USD",
          participants: PARTICIPANTS,
          debts: [],
        },
        onMarkPaid: noop,
      },
    },
    {
      id: "click-mark-paid",
      description:
        "Render three-pairs, click Mark-as-paid on debt d1, then verify outstanding decreased.",
      props: {
        event: {
          id: "sat-night-out",
          title: "Saturday Night Out",
          currency: "USD",
          participants: PARTICIPANTS,
          debts: [
            { id: "d1", fromId: "riley", toId: "alex", amountCents: 7500, status: "open" },
            { id: "d2", fromId: "jordan", toId: "alex", amountCents: 3000, status: "open" },
          ],
        },
        onMarkPaid: noop,
      },
      act: async ({ click }) => {
        await click('[data-verify-debt-id="d1"] [data-verify-action="mark-paid"]');
      },
    },
    {
      id: "self-debt",
      probe: true,
      description:
        "Probe: a debt where fromId === toId. The schema refine should FAIL this — proves the framework catches nonsense state.",
      props: {
        event: {
          id: "bad-event",
          title: "Bad Event",
          currency: "USD",
          participants: PARTICIPANTS,
          debts: [
            { id: "d1", fromId: "alex", toId: "alex", amountCents: 1000, status: "open" },
          ],
        },
        onMarkPaid: noop,
      },
    },
    {
      id: "unknown-participant-in-debt",
      probe: true,
      description:
        "Probe: debt references a participant id not in the participants list. Schema refine should FAIL.",
      props: {
        event: {
          id: "bad-event-2",
          title: "Bad Event 2",
          currency: "USD",
          participants: PARTICIPANTS.slice(0, 2),
          debts: [
            { id: "d1", fromId: "ghost", toId: "alex", amountCents: 1000, status: "open" },
          ],
        },
        onMarkPaid: noop,
      },
    },
    {
      id: "long-name",
      probe: true,
      description:
        "Probe: a 200-char participant name. Layout must not break and contract must still be readable.",
      props: {
        event: {
          id: "long-name-event",
          title: "Long Name Event",
          currency: "USD",
          participants: [
            { id: "a", name: "A".repeat(200) },
            { id: "b", name: "Bob" },
          ],
          debts: [
            { id: "d1", fromId: "a", toId: "b", amountCents: 100, status: "open" },
          ],
        },
        onMarkPaid: noop,
      },
    },
  ],
  invariants: [
    {
      id: "outstanding-equals-sum-of-open",
      description:
        "data-verify-outstanding-cents equals the sum of amount-cents across open debt rows",
      check: ({ root, contract }) => {
        const declared = Number(contract["outstanding-cents"]);
        const openRows = Array.from(
          root.querySelectorAll<HTMLElement>('[data-verify-debt-id][data-verify-status="open"]')
        );
        const sum = openRows.reduce(
          (acc, el) => acc + Number(el.getAttribute("data-verify-amount-cents") ?? "0"),
          0
        );
        return (
          declared === sum ||
          `outstanding-cents=${declared} but open debts sum to ${sum}`
        );
      },
    },
    {
      id: "debt-pairs-attr-matches-rendered-rows",
      description:
        "data-verify-debt-pairs equals the number of rendered debt rows",
      check: ({ root, contract }) => {
        const declared = Number(contract["debt-pairs"]);
        const rendered = root.querySelectorAll("[data-verify-debt-id]").length;
        return (
          declared === rendered ||
          `debt-pairs=${declared} but found ${rendered} rendered rows`
        );
      },
    },
    {
      id: "pay-buttons-only-on-open-debts",
      description:
        "An open debt has 3 pay buttons (venmo/paypal/cashapp); a paid debt has 0",
      check: ({ root }) => {
        const rows = Array.from(
          root.querySelectorAll<HTMLElement>("[data-verify-debt-id]")
        );
        for (const row of rows) {
          const status = row.getAttribute("data-verify-status");
          const payBtns = row.querySelectorAll("[data-verify-pay-app]").length;
          if (status === "open" && payBtns !== 3) {
            return `open debt ${row.getAttribute("data-verify-debt-id")} has ${payBtns} pay buttons, expected 3`;
          }
          if (status === "paid" && payBtns !== 0) {
            return `paid debt ${row.getAttribute("data-verify-debt-id")} still has ${payBtns} pay buttons`;
          }
        }
        return true;
      },
    },
    {
      id: "no-self-debt-rendered",
      description: "No debt row where from-id equals to-id",
      check: ({ root }) => {
        const rows = Array.from(
          root.querySelectorAll<HTMLElement>("[data-verify-debt-id]")
        );
        for (const row of rows) {
          const from = row.getAttribute("data-verify-from-id");
          const to = row.getAttribute("data-verify-to-id");
          if (from && from === to) return `self-debt rendered: ${from}->${to}`;
        }
        return true;
      },
    },
    {
      id: "empty-state-when-no-debts",
      description:
        "When there are zero debts, an empty-state element is shown and no debt rows exist",
      onlyFixtures: ["no-debts"],
      check: ({ root }) => {
        const empty = root.querySelector("[data-verify-empty]");
        const rows = root.querySelectorAll("[data-verify-debt-id]").length;
        if (!empty) return "missing [data-verify-empty] element";
        if (rows !== 0) return `expected 0 rows, found ${rows}`;
        return true;
      },
    },
    {
      id: "mark-paid-decrements-outstanding",
      description:
        "After clicking Mark-as-paid on debt d1, outstanding-cents must equal the remaining open sum",
      onlyFixtures: ["click-mark-paid"],
      check: ({ root, contract, props }) => {
        const declared = Number(contract["outstanding-cents"]);
        const remaining = props.event.debts
          .filter((d) => d.id !== "d1")
          .reduce((acc, d) => acc + d.amountCents, 0);
        const settledNow = Number(contract["settled-pairs"]);
        if (settledNow < 1) return `expected ≥1 settled-pairs after click, got ${settledNow}`;
        const d1Row = root.querySelector('[data-verify-debt-id="d1"]');
        if (!d1Row) return "d1 row missing after click";
        if (d1Row.getAttribute("data-verify-status") !== "paid") {
          return `d1 status=${d1Row.getAttribute("data-verify-status")} after click, expected "paid"`;
        }
        return (
          declared === remaining ||
          `outstanding-cents=${declared} after marking d1 paid, expected ${remaining}`
        );
      },
    },
  ],
});
