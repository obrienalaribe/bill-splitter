import { useMemo, useState } from "react";
import { verifyAttrs } from "../../verify/core/contract";
import {
  ExpenseError,
  addExpense,
  makeExpenseId,
  writeEvent,
} from "../../lib/eventStore";
import type { Expense, SettleEvent } from "../settle/types";

export interface AddExpenseScreenProps {
  event: SettleEvent;
  /** Test/fixture hook. Called after a successful save, replaces navigation. */
  onSaved?: (event: SettleEvent, expense: Expense) => void;
}

function parseDollarsToCents(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function AddExpenseScreen({ event, onSaved }: AddExpenseScreenProps) {
  const [description, setDescription] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [taxRaw, setTaxRaw] = useState("");
  const [tipRaw, setTipRaw] = useState("");
  const [payerId, setPayerId] = useState(event.participants[0]?.id ?? "");
  const [splitWith, setSplitWith] = useState<string[]>(
    event.participants.map((p) => p.id)
  );
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [savedMs, setSavedMs] = useState<number | null>(null);
  const [savedExpenseId, setSavedExpenseId] = useState<string | null>(null);

  const amountCents = useMemo(() => parseDollarsToCents(amountRaw), [amountRaw]);
  const taxCents = useMemo(() => parseDollarsToCents(taxRaw), [taxRaw]);
  const tipCents = useMemo(() => parseDollarsToCents(tipRaw), [tipRaw]);
  const descTrimLen = description.trim().length;
  const payerInSplit = splitWith.includes(payerId);
  const hasTax = taxRaw.trim().length > 0 && taxCents > 0;
  const hasTip = tipRaw.trim().length > 0 && tipCents > 0;
  const valid =
    descTrimLen > 0 &&
    amountCents > 0 &&
    taxCents >= 0 &&
    tipCents >= 0 &&
    payerId !== "" &&
    splitWith.length > 0 &&
    payerInSplit;

  const toggleSplit = (id: string) => {
    setSplitWith((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = () => {
    setError(null);
    setErrorCode(null);
    if (!valid) return;
    const t0 = performance.now();
    const expense: Expense = {
      id: makeExpenseId(),
      amountCents,
      description: description.trim(),
      payerId,
      splitWith: [...splitWith],
      taxCents,
      tipCents,
      createdAt: new Date().toISOString(),
    };
    try {
      const updated = addExpense(event, expense);
      writeEvent(updated);
      const ms = Math.round(performance.now() - t0);
      setSavedMs(ms);
      setSavedExpenseId(expense.id);
      if (onSaved) onSaved(updated, expense);
      else window.location.assign(`/e/${event.id}`);
    } catch (e) {
      if (e instanceof ExpenseError) {
        setError(e.message);
        setErrorCode(e.code);
        return;
      }
      throw e;
    }
  };

  return (
    <section
      className="create-event"
      {...verifyAttrs({
        unit: "AddExpenseScreen",
        "event-id": event.id,
        valid,
        "amount-cents": amountCents,
        "tax-cents": taxCents,
        "tip-cents": tipCents,
        "split-count": splitWith.length,
        "payer-id": payerId,
        "has-tax": hasTax,
        "has-tip": hasTip,
        "description-len": descTrimLen,
        "save-ms": savedMs ?? "",
        "saved-expense-id": savedExpenseId ?? "",
      })}
    >
      <div className="receipt-perf" aria-hidden="true" />

      <header className="settle-header">
        <h1>ADD EXPENSE</h1>
        <p className="settle-sub">{event.title.toUpperCase()}</p>
      </header>

      <hr className="receipt-div" />

      {error && (
        <p className="claim-error" data-verify-error={errorCode ?? "save"}>
          {error}
        </p>
      )}

      <label className="create-field">
        <span>Description</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dinner at Le Bistro"
          data-verify-field="description"
        />
      </label>

      <label className="create-field">
        <span>Amount</span>
        <input
          type="text"
          inputMode="decimal"
          value={amountRaw}
          onChange={(e) => setAmountRaw(e.target.value)}
          placeholder="42.50"
          data-verify-field="amount"
        />
      </label>

      <label className="create-field">
        <span>Paid by</span>
        <select
          value={payerId}
          onChange={(e) => setPayerId(e.target.value)}
          data-verify-field="payer"
        >
          {event.participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="create-field" data-verify-field="split">
        <legend>Split with</legend>
        {event.participants.map((p) => {
          const checked = splitWith.includes(p.id);
          return (
            <label
              key={p.id}
              className="split-chip"
              data-verify-split-id={p.id}
              data-verify-split-checked={checked ? "true" : "false"}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleSplit(p.id)}
                data-verify-action="toggle-split"
              />
              {p.name}
            </label>
          );
        })}
        {!payerInSplit && (
          <em data-verify-error="payer-not-in-split">
            payer must be included in split
          </em>
        )}
      </fieldset>

      <label className="create-field">
        <span>Tax (optional)</span>
        <input
          type="text"
          inputMode="decimal"
          value={taxRaw}
          onChange={(e) => setTaxRaw(e.target.value)}
          placeholder="0.00"
          data-verify-field="tax"
        />
      </label>

      <label className="create-field">
        <span>Tip (optional)</span>
        <input
          type="text"
          inputMode="decimal"
          value={tipRaw}
          onChange={(e) => setTipRaw(e.target.value)}
          placeholder="0.00"
          data-verify-field="tip"
        />
      </label>

      <button
        type="button"
        className="mark-paid"
        disabled={!valid}
        aria-label="Save expense"
        onClick={submit}
        data-verify-action="save-expense"
      >
        ✓ SAVE EXPENSE
      </button>

      <div className="receipt-perf" aria-hidden="true" />
    </section>
  );
}
