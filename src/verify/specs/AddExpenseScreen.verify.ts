import { createElement } from "react";
import { z } from "zod";
import { registerUnit } from "../core/registry";
import {
  AddExpenseScreen,
  type AddExpenseScreenProps,
} from "../../features/expense/AddExpenseScreen";
import {
  addExpense,
  computeBalances,
  expenseTotalCents,
  ExpenseError,
  makeExpenseId,
  readEvent,
  writeEvent,
} from "../../lib/eventStore";
import type { Expense, SettleEvent } from "../../features/settle/types";

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
    participants: z.array(ParticipantSchema).min(2),
    debts: z.array(DebtSchema),
    expenses: z.array(ExpenseSchema).optional(),
  }),
  onSaved: z.function().optional(),
});

const PARTICIPANTS = [
  { id: "alex", name: "Alex" },
  { id: "sam", name: "Sam" },
  { id: "jordan", name: "Jordan" },
];

function seed(id: string): SettleEvent {
  const event: SettleEvent = {
    id,
    title: "Saturday Night Out",
    currency: "USD",
    participants: PARTICIPANTS,
    debts: [],
    expenses: [],
  };
  writeEvent(event);
  return event;
}

function eventFor(id: string): SettleEvent {
  return {
    id,
    title: "Saturday Night Out",
    currency: "USD",
    participants: PARTICIPANTS,
    debts: [],
    expenses: [],
  };
}

function attachError(root: HTMLElement, code: string, message: string): void {
  const errEl = document.createElement("p");
  errEl.setAttribute("data-verify-error", code);
  errEl.textContent = message;
  root.querySelector('[data-verify-unit="AddExpenseScreen"]')?.prepend(errEl);
}

registerUnit<AddExpenseScreenProps>({
  id: "AddExpenseScreen",
  title: "AddExpenseScreen",
  description:
    "Add an expense to an event: amount, description, payer, splitWith, tax/tip. Pure reducer addExpense persists to localStorage.",
  kind: "feature",
  render: (props) => createElement(AddExpenseScreen, props),
  propsSchema: PropsSchema,
  fixtures: [
    {
      id: "empty",
      description:
        "Pristine form, no input yet — save must be disabled (valid=false).",
      props: { event: eventFor("expense-empty") },
      act: async () => {
        seed("expense-empty");
      },
    },
    {
      id: "happy-path",
      description:
        "Fill description + $42.50 amount, default split (all 3) → save persists expense + computeBalances sums to 0.",
      props: { event: eventFor("expense-happy") },
      act: async ({ type, click }) => {
        seed("expense-happy");
        await type('[data-verify-field="description"]', "Dinner");
        await type('[data-verify-field="amount"]', "42.50");
        await type('[data-verify-field="tax"]', "3.00");
        await type('[data-verify-field="tip"]', "6.00");
        await click('[data-verify-action="save-expense"]');
      },
    },
    {
      id: "whitespace-description",
      probe: true,
      description:
        "Probe: addExpense with whitespace-only description MUST be rejected (ExpenseError code 'blank-description').",
      props: { event: eventFor("expense-blank") },
      act: async ({ root }) => {
        const ev = seed("expense-blank");
        const expense: Expense = {
          id: makeExpenseId(),
          amountCents: 1000,
          description: "   ",
          payerId: "alex",
          splitWith: ["alex", "sam"],
          taxCents: 0,
          tipCents: 0,
          createdAt: new Date().toISOString(),
        };
        try {
          addExpense(ev, expense);
          attachError(root, "not-rejected", "blank-description was NOT rejected");
        } catch (e) {
          if (e instanceof ExpenseError && e.code === "blank-description") {
            attachError(root, "blank-description", e.message);
          } else {
            attachError(root, "unexpected", String(e));
          }
        }
      },
    },
    {
      id: "zero-amount",
      probe: true,
      description:
        "Probe: addExpense with amountCents=0 MUST be rejected (ExpenseError code 'zero-amount').",
      props: { event: eventFor("expense-zero") },
      act: async ({ root }) => {
        const ev = seed("expense-zero");
        const expense: Expense = {
          id: makeExpenseId(),
          amountCents: 0,
          description: "Free lunch",
          payerId: "alex",
          splitWith: ["alex", "sam"],
          taxCents: 0,
          tipCents: 0,
          createdAt: new Date().toISOString(),
        };
        try {
          addExpense(ev, expense);
          attachError(root, "not-rejected", "zero-amount was NOT rejected");
        } catch (e) {
          if (e instanceof ExpenseError && e.code === "zero-amount") {
            attachError(root, "zero-amount", e.message);
          } else {
            attachError(root, "unexpected", String(e));
          }
        }
      },
    },
    {
      id: "payer-not-in-splitWith",
      probe: true,
      description:
        "Probe: addExpense where payerId is not in splitWith MUST be rejected (ExpenseError code 'payer-not-in-split').",
      props: { event: eventFor("expense-payer-out") },
      act: async ({ root }) => {
        const ev = seed("expense-payer-out");
        const expense: Expense = {
          id: makeExpenseId(),
          amountCents: 5000,
          description: "Dinner",
          payerId: "alex",
          splitWith: ["sam", "jordan"],
          taxCents: 0,
          tipCents: 0,
          createdAt: new Date().toISOString(),
        };
        try {
          addExpense(ev, expense);
          attachError(root, "not-rejected", "payer-not-in-split was NOT rejected");
        } catch (e) {
          if (e instanceof ExpenseError && e.code === "payer-not-in-split") {
            attachError(root, "payer-not-in-split", e.message);
          } else {
            attachError(root, "unexpected", String(e));
          }
        }
      },
    },
    {
      id: "negative-tax",
      probe: true,
      description:
        "Probe: addExpense with taxCents=-100 MUST be rejected (ExpenseError code 'negative-tax').",
      props: { event: eventFor("expense-neg-tax") },
      act: async ({ root }) => {
        const ev = seed("expense-neg-tax");
        const expense: Expense = {
          id: makeExpenseId(),
          amountCents: 5000,
          description: "Dinner",
          payerId: "alex",
          splitWith: ["alex", "sam"],
          taxCents: -100,
          tipCents: 0,
          createdAt: new Date().toISOString(),
        };
        try {
          addExpense(ev, expense);
          attachError(root, "not-rejected", "negative-tax was NOT rejected");
        } catch (e) {
          if (e instanceof ExpenseError && e.code === "negative-tax") {
            attachError(root, "negative-tax", e.message);
          } else {
            attachError(root, "unexpected", String(e));
          }
        }
      },
    },
  ],
  invariants: [
    {
      id: "save-disabled-when-invalid",
      description:
        "Save button is disabled exactly when data-verify-valid='false'.",
      check: ({ root, contract }) => {
        const btn = root.querySelector<HTMLButtonElement>(
          '[data-verify-action="save-expense"]'
        );
        if (!btn) return "no save button";
        const declaredValid = contract.valid === "true";
        const enabled = !btn.disabled;
        return (
          declaredValid === enabled ||
          `valid=${declaredValid} but button.disabled=${btn.disabled}`
        );
      },
    },
    {
      id: "split-count-matches-checked",
      description:
        "data-verify-split-count equals the number of split chips with data-verify-split-checked='true'.",
      check: ({ root, contract }) => {
        const declared = Number(contract["split-count"]);
        const checked = root.querySelectorAll(
          '[data-verify-split-id][data-verify-split-checked="true"]'
        ).length;
        return (
          declared === checked ||
          `split-count=${declared} but ${checked} chips checked`
        );
      },
    },
    {
      id: "happy-path-persists-and-balances-zero",
      description:
        "After saving, eventStore has 1 expense, total-cents matches subtotal+tax+tip, computeBalances sums to 0.",
      onlyFixtures: ["happy-path"],
      check: ({ contract }) => {
        const eventId = contract["event-id"];
        if (!eventId) return "missing event-id contract attr";
        const stored = readEvent(eventId);
        if (!stored) return `eventStore has no event "${eventId}"`;
        if (!stored.expenses || stored.expenses.length !== 1) {
          return `expected 1 expense in store, got ${stored.expenses?.length ?? 0}`;
        }
        const e = stored.expenses[0];
        const expectedTotal = 4250 + 300 + 600;
        if (e.amountCents !== 4250) return `amountCents=${e.amountCents}, expected 4250`;
        if (e.taxCents !== 300) return `taxCents=${e.taxCents}, expected 300`;
        if (e.tipCents !== 600) return `tipCents=${e.tipCents}, expected 600`;
        if (e.description !== "Dinner") return `description="${e.description}", expected "Dinner"`;
        const total = expenseTotalCents(stored);
        if (total !== expectedTotal) {
          return `expenseTotalCents=${total}, expected ${expectedTotal}`;
        }
        const balances = computeBalances(stored);
        let sum = 0;
        for (const v of balances.values()) sum += v;
        if (sum !== 0) return `balances sum to ${sum}, expected 0`;
        return true;
      },
    },
    {
      id: "happy-path-save-fast",
      description: "Save → persisted in ≤ 200ms (data-verify-save-ms).",
      onlyFixtures: ["happy-path"],
      check: ({ contract }) => {
        const ms = Number(contract["save-ms"]);
        if (!Number.isFinite(ms)) return `save-ms not numeric: "${contract["save-ms"]}"`;
        return ms <= 200 || `save took ${ms}ms, expected ≤ 200`;
      },
    },
    {
      id: "happy-path-emits-saved-id",
      description:
        "After save, data-verify-saved-expense-id is set (form acknowledged the persist).",
      onlyFixtures: ["happy-path"],
      check: ({ contract }) => {
        const id = contract["saved-expense-id"];
        return (id && id.length > 0) || `saved-expense-id="${id}", expected non-empty`;
      },
    },
    {
      id: "no-reducer-error-rendered",
      description:
        "In well-formed states no [data-verify-error] should be rendered. Probe fixtures intentionally render one to FAIL this.",
      check: ({ root }) => {
        const err = root.querySelector("[data-verify-error]");
        if (err) {
          const code = err.getAttribute("data-verify-error");
          return `reducer rejected: ${code} — ${err.textContent ?? "(no detail)"}`;
        }
        return true;
      },
    },
  ],
});
