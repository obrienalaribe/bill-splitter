import { Link } from "react-router-dom";
import { verifyAttrs } from "../../verify/core/contract";
import { computeBalances, expenseTotalCents } from "../../lib/balance";
import type { Participant, SettleEvent } from "../settle/types";

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };

function formatAmount(cents: number, currency: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? "";
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${symbol}${(abs / 100).toFixed(2)}`;
}

function findParticipant(participants: Participant[], id: string): Participant | undefined {
  return participants.find((p) => p.id === id);
}

export interface EventHomeScreenProps {
  event: SettleEvent;
}

export function EventHomeScreen({ event }: EventHomeScreenProps) {
  const renderStart = performance.now();

  const expenses = (event.expenses ?? [])
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

  const balances = computeBalances(event);
  const totalCents = expenseTotalCents(event);
  const empty = expenses.length === 0;

  const paintMs = Math.round(performance.now() - renderStart);

  return (
    <section
      className="settle-screen event-home"
      {...verifyAttrs({
        unit: "EventHomeScreen",
        "event-id": event.id,
        currency: event.currency,
        "expense-count": expenses.length,
        "participant-count": event.participants.length,
        "total-cents": totalCents,
        "paint-ms": paintMs,
      })}
    >
      <div className="receipt-perf" aria-hidden="true" />

      <header className="settle-header">
        <h1>{event.title.toUpperCase()}</h1>
        <p className="settle-sub">
          {event.participants.length} participant{event.participants.length === 1 ? "" : "s"} ·{" "}
          {expenses.length} expense{expenses.length === 1 ? "" : "s"} ·{" "}
          {formatAmount(totalCents, event.currency)} total
        </p>
      </header>

      <hr className="receipt-div" />

      <section className="balance-pills" data-verify-section="balances">
        {event.participants.map((p) => {
          const bal = balances.get(p.id) ?? 0;
          const cls =
            bal > 0 ? "balance-pill is-positive" : bal < 0 ? "balance-pill is-negative" : "balance-pill is-zero";
          return (
            <div
              key={p.id}
              className={cls}
              {...verifyAttrs({
                "participant-id": p.id,
                "balance-cents": bal,
              })}
            >
              <span className="balance-name">{p.name.toUpperCase()}</span>
              <span className="balance-amt">{formatAmount(bal, event.currency)}</span>
            </div>
          );
        })}
      </section>

      <hr className="receipt-div" />

      {empty ? (
        <p className="settle-empty" data-verify-empty="true">
          — NO EXPENSES YET —
        </p>
      ) : (
        <section className="expense-list" data-verify-section="expenses">
          {expenses.map((e) => {
            const total = e.amountCents + e.taxCents + e.tipCents;
            const payer = findParticipant(event.participants, e.payerId);
            return (
              <article
                key={e.id}
                className="expense-row"
                {...verifyAttrs({
                  "expense-id": e.id,
                  "amount-cents": total,
                  "payer-id": e.payerId,
                })}
              >
                <div className="debt-line">
                  <span className="debt-pair" data-verify-description>
                    {e.description}
                  </span>
                  <span className="debt-amt" data-verify-amount-display>
                    {formatAmount(total, event.currency)}
                  </span>
                </div>
                {payer && (
                  <p className="expense-meta">
                    paid by <strong>{payer.name}</strong> · split {e.splitWith.length}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}

      <hr className="receipt-div" />

      <div className="home-actions">
        <Link
          to={`/e/${event.id}/add`}
          className="mark-paid"
          data-verify-action="add-expense"
        >
          + ADD EXPENSE
        </Link>
        <Link
          to={`/e/${event.id}/settle`}
          className="mark-paid"
          data-verify-action="go-settle"
        >
          SETTLE →
        </Link>
      </div>

      <div className="receipt-perf" aria-hidden="true" />
    </section>
  );
}
