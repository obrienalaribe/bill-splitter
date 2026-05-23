import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { z } from "zod";
import { registerUnit } from "../core/registry";
import { EventHomeScreen, type EventHomeScreenProps } from "../../features/home/EventHomeScreen";
import { computeBalances, computeDebts, expenseTotalCents } from "../../lib/balance";
import type { Expense } from "../../features/settle/types";

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

const ExpenseSchema = z.object({
  id: z.string().min(1),
  amountCents: z.number().int().positive(),
  description: z.string().min(1),
  payerId: z.string().min(1),
  splitWith: z.array(z.string().min(1)).min(1),
  taxCents: z.number().int().nonnegative(),
  tipCents: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
});

const PropsSchema = z.object({
  event: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    currency: z.string().min(1),
    participants: z.array(ParticipantSchema).min(1),
    debts: z.array(DebtSchema),
    expenses: z.array(ExpenseSchema).optional(),
  }),
});

const PARTICIPANTS = [
  { id: "alex", name: "Alex" },
  { id: "sam", name: "Sam" },
  { id: "jordan", name: "Jordan" },
  { id: "riley", name: "Riley" },
];

function ts(i: number): string {
  return `2026-05-01T12:${String(i).padStart(2, "0")}:00.000Z`;
}

function makeExpense(
  i: number,
  payerId: string,
  splitWith: string[],
  amountCents: number,
  description: string
): Expense {
  return {
    id: `e${i}`,
    amountCents,
    description,
    payerId,
    splitWith,
    taxCents: 0,
    tipCents: 0,
    createdAt: ts(i),
  };
}

const TEN_EXPENSES: Expense[] = [
  makeExpense(1, "alex", ["alex", "sam", "jordan", "riley"], 4200, "Dinner"),
  makeExpense(2, "sam", ["alex", "sam", "jordan", "riley"], 1800, "Lunch"),
  makeExpense(3, "jordan", ["alex", "sam", "jordan", "riley"], 6000, "Hotel"),
  makeExpense(4, "riley", ["alex", "sam", "jordan", "riley"], 1200, "Coffee"),
  makeExpense(5, "alex", ["alex", "sam", "jordan", "riley"], 8800, "Drinks"),
  makeExpense(6, "sam", ["alex", "sam", "jordan", "riley"], 2500, "Snacks"),
  makeExpense(7, "jordan", ["alex", "sam", "jordan", "riley"], 3300, "Taxi"),
  makeExpense(8, "riley", ["alex", "sam", "jordan", "riley"], 4400, "Tickets"),
  makeExpense(9, "alex", ["alex", "sam", "jordan", "riley"], 1500, "Tip"),
  makeExpense(10, "sam", ["alex", "sam", "jordan", "riley"], 950, "Water"),
];

registerUnit<EventHomeScreenProps>({
  id: "EventHomeScreen",
  title: "EventHomeScreen",
  description:
    "Event home: per-participant balance pills + chronological expense list + add-expense / settle CTAs.",
  kind: "feature",
  render: (props) =>
    createElement(
      MemoryRouter,
      { initialEntries: [`/e/${props.event.id}`] },
      createElement(EventHomeScreen, props)
    ),
  propsSchema: PropsSchema,
  fixtures: [
    {
      id: "ten-expenses",
      description:
        "10-expense / 4-participant event — drives the FAST first-paint and ACCURATE balance-sums-to-zero invariants.",
      props: {
        event: {
          id: "ten-exp-event",
          title: "Saturday Night Out",
          currency: "USD",
          participants: PARTICIPANTS,
          debts: [],
          expenses: TEN_EXPENSES,
        },
      },
    },
    {
      id: "single-expense",
      description: "One $40 dinner split 4 ways — payer +30, each other −10.",
      props: {
        event: {
          id: "single-exp-event",
          title: "Quick Dinner",
          currency: "USD",
          participants: PARTICIPANTS,
          debts: [],
          expenses: [
            makeExpense(1, "alex", ["alex", "sam", "jordan", "riley"], 4000, "Dinner"),
          ],
        },
      },
    },
    {
      id: "balances-cancel",
      probe: true,
      description:
        "Probe: every participant pays own share — all balances cancel to 0, computeDebts must return []. Probe fails the derives-nonempty-debts invariant gracefully (no crash, just empty pair set).",
      props: {
        event: {
          id: "balances-cancel-event",
          title: "Even Split",
          currency: "USD",
          participants: PARTICIPANTS,
          debts: [],
          expenses: [
            makeExpense(1, "alex", ["alex", "sam", "jordan", "riley"], 4000, "Alex pays"),
            makeExpense(2, "sam", ["alex", "sam", "jordan", "riley"], 4000, "Sam pays"),
            makeExpense(3, "jordan", ["alex", "sam", "jordan", "riley"], 4000, "Jordan pays"),
            makeExpense(4, "riley", ["alex", "sam", "jordan", "riley"], 4000, "Riley pays"),
          ],
        },
      },
    },
    {
      id: "empty-event",
      probe: true,
      description:
        "Probe: zero expenses MUST render the empty-state element (data-verify-empty=true), no crash, '+ Add expense' CTA still visible.",
      props: {
        event: {
          id: "empty-event",
          title: "Fresh Event",
          currency: "USD",
          participants: PARTICIPANTS,
          debts: [],
          expenses: [],
        },
      },
    },
  ],
  invariants: [
    {
      id: "balance-sums-to-zero",
      description:
        "Σ values of per-participant data-verify-balance-cents === 0 (computeBalances invariant surfaced as DOM contract).",
      check: ({ root }) => {
        const pills = Array.from(
          root.querySelectorAll<HTMLElement>("[data-verify-participant-id][data-verify-balance-cents]")
        );
        if (pills.length === 0) return "no balance pills rendered";
        const sum = pills.reduce(
          (acc, el) => acc + Number(el.getAttribute("data-verify-balance-cents") ?? "0"),
          0
        );
        return sum === 0 || `balances sum to ${sum}, expected 0`;
      },
    },
    {
      id: "balance-pill-equals-paid-minus-owed",
      description:
        "Each per-participant balance pill === (sum paid) − (sum owed) computed from props.event.expenses.",
      check: ({ root, props }) => {
        const expected = computeBalances(props.event);
        const pills = Array.from(
          root.querySelectorAll<HTMLElement>("[data-verify-participant-id][data-verify-balance-cents]")
        );
        for (const el of pills) {
          const id = el.getAttribute("data-verify-participant-id")!;
          const rendered = Number(el.getAttribute("data-verify-balance-cents"));
          const want = expected.get(id) ?? 0;
          if (rendered !== want) {
            return `balance for "${id}" rendered ${rendered}, expected ${want}`;
          }
        }
        return true;
      },
    },
    {
      id: "debt-pairs-derivation",
      description:
        "Sum of positive balances === abs(sum of negative balances) — the derivable bipartition for downstream debt-graph.",
      check: ({ root }) => {
        const pills = Array.from(
          root.querySelectorAll<HTMLElement>("[data-verify-participant-id][data-verify-balance-cents]")
        );
        let pos = 0;
        let neg = 0;
        for (const el of pills) {
          const v = Number(el.getAttribute("data-verify-balance-cents") ?? "0");
          if (v > 0) pos += v;
          else if (v < 0) neg += v;
        }
        return pos + neg === 0 || `positives=${pos}, negatives=${neg}, expected pos+neg=0`;
      },
    },
    {
      id: "expense-count-matches-rendered-rows",
      description:
        "data-verify-expense-count equals the number of [data-verify-expense-id] rows.",
      check: ({ root, contract }) => {
        const declared = Number(contract["expense-count"]);
        const rendered = root.querySelectorAll("[data-verify-expense-id]").length;
        return declared === rendered || `expense-count=${declared} but found ${rendered} rows`;
      },
    },
    {
      id: "total-cents-matches-expense-sum",
      description:
        "data-verify-total-cents equals expenseTotalCents(event).",
      check: ({ props, contract }) => {
        const declared = Number(contract["total-cents"]);
        const want = expenseTotalCents(props.event);
        return declared === want || `total-cents=${declared}, expected ${want}`;
      },
    },
    {
      id: "expenses-sorted-newest-first",
      description:
        "Rendered expense rows appear in descending createdAt order.",
      check: ({ root, props }) => {
        const rows = Array.from(
          root.querySelectorAll<HTMLElement>("[data-verify-expense-id]")
        );
        const ids = rows.map((r) => r.getAttribute("data-verify-expense-id"));
        const byId = new Map(
          (props.event.expenses ?? []).map((e) => [e.id, e.createdAt])
        );
        for (let i = 1; i < ids.length; i++) {
          const prev = byId.get(ids[i - 1]!) ?? "";
          const cur = byId.get(ids[i]!) ?? "";
          if (prev < cur) {
            return `rows out of order at ${i}: "${ids[i - 1]}"(${prev}) before "${ids[i]}"(${cur})`;
          }
        }
        return true;
      },
    },
    {
      id: "empty-state-when-no-expenses",
      description:
        "Zero expenses → [data-verify-empty='true'] present, zero expense rows, add-expense CTA still rendered.",
      onlyFixtures: ["empty-event"],
      check: ({ root }) => {
        const empty = root.querySelector('[data-verify-empty="true"]');
        if (!empty) return "missing [data-verify-empty='true']";
        const rows = root.querySelectorAll("[data-verify-expense-id]").length;
        if (rows !== 0) return `expected 0 expense rows, found ${rows}`;
        const cta = root.querySelector('[data-verify-action="add-expense"]');
        if (!cta) return "missing [data-verify-action='add-expense'] CTA";
        return true;
      },
    },
    {
      id: "settle-link-href",
      description:
        "[data-verify-link='settle'] exists and href === /e/:eventId/settle.",
      check: ({ root, props }) => {
        const link = root.querySelector<HTMLAnchorElement>('[data-verify-link="settle"]');
        if (!link) return "missing [data-verify-link='settle']";
        const want = `/e/${props.event.id}/settle`;
        const got = link.getAttribute("href") ?? "";
        return got === want || `settle link href="${got}", expected "${want}"`;
      },
    },
    {
      id: "debt-derivation-conserves-cents",
      description:
        "Σ(computeDebts(balances).amountCents) === Σ(|negative balances|) — derivation is cent-conserving.",
      check: ({ props }) => {
        const balances = computeBalances(props.event);
        const pairs = computeDebts(balances);
        let owed = 0;
        for (const v of balances.values()) if (v < 0) owed += -v;
        const moved = pairs.reduce((acc, p) => acc + p.amountCents, 0);
        return moved === owed || `pairs sum ${moved}, expected ${owed}`;
      },
    },
    {
      id: "derives-nonempty-debts",
      description:
        "Non-trivial event has ≥1 derivable debt pair. Probe 'balances-cancel' (all balances 0) MUST FAIL — derivation returns [] gracefully.",
      onlyFixtures: ["ten-expenses", "single-expense", "balances-cancel"],
      check: ({ props }) => {
        const pairs = computeDebts(computeBalances(props.event));
        return pairs.length > 0 || `computeDebts returned [] — no settlement required`;
      },
    },
    {
      id: "first-paint-under-100ms",
      description:
        "data-verify-paint-ms ≤ 100 on a 10-expense, 4-participant event.",
      onlyFixtures: ["ten-expenses"],
      check: ({ contract }) => {
        const ms = Number(contract["paint-ms"]);
        if (!Number.isFinite(ms)) return `paint-ms not numeric: "${contract["paint-ms"]}"`;
        return ms <= 100 || `first paint took ${ms}ms, expected ≤ 100`;
      },
    },
  ],
});
