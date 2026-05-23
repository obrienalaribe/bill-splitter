import { useState } from "react";
import { verifyAttrs } from "../../verify/core/contract";
import type { Participant, SettleScreenProps } from "./types";

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };

function formatAmount(cents: number, currency: string): string {
  return `${CURRENCY_SYMBOL[currency] ?? ""}${(cents / 100).toFixed(2)}`;
}

function findParticipant(participants: Participant[], id: string): Participant | undefined {
  return participants.find((p) => p.id === id);
}

function payUrl(app: "venmo" | "paypal" | "cashapp", to: Participant, amountCents: number, note: string): string {
  const amount = (amountCents / 100).toFixed(2);
  const n = encodeURIComponent(note);
  if (app === "venmo" && to.venmo) return `https://venmo.com/u/${to.venmo}?txn=pay&amount=${amount}&note=${n}`;
  if (app === "paypal" && to.paypal) return `https://paypal.me/${to.paypal}/${amount}`;
  if (app === "cashapp" && to.cashapp) return `https://cash.app/$${to.cashapp}/${amount}`;
  return "#";
}

export function SettleScreen({ event, onMarkPaid }: SettleScreenProps) {
  const [paidOptimistic, setPaidOptimistic] = useState<Set<string>>(new Set());

  const debts = event.debts.map((d) =>
    paidOptimistic.has(d.id) ? { ...d, status: "paid" as const, paidAt: d.paidAt ?? "now" } : d
  );

  const openDebts = debts.filter((d) => d.status === "open");
  const settledCount = debts.length - openDebts.length;
  const outstandingCents = openDebts.reduce((acc, d) => acc + d.amountCents, 0);

  const handleMarkPaid = (debtId: string) => {
    setPaidOptimistic((prev) => new Set(prev).add(debtId));
    onMarkPaid?.(debtId);
  };

  return (
    <section
      className="settle-screen"
      {...verifyAttrs({
        unit: "SettleScreen",
        "event-id": event.id,
        currency: event.currency,
        "debt-pairs": debts.length,
        "outstanding-cents": outstandingCents,
        "settled-pairs": settledCount,
        "open-pairs": openDebts.length,
      })}
    >
      <div className="receipt-perf" aria-hidden="true" />

      <header className="settle-header">
        <h1>SETTLE UP</h1>
        <p className="settle-sub">
          {openDebts.length} payment{openDebts.length === 1 ? "" : "s"} to clear · {formatAmount(outstandingCents, event.currency)} outstanding
        </p>
      </header>

      <hr className="receipt-div" />

      {debts.length === 0 && (
        <p className="settle-empty" data-verify-empty="true">
          — NOTHING TO SETTLE —
        </p>
      )}

      {debts.map((debt) => {
        const from = findParticipant(event.participants, debt.fromId);
        const to = findParticipant(event.participants, debt.toId);
        if (!from || !to) return null;

        const isPaid = debt.status === "paid";
        const note = `${event.title} · split`;

        return (
          <article
            key={debt.id}
            className={`debt-card ${isPaid ? "is-paid" : ""}`}
            {...verifyAttrs({
              "debt-id": debt.id,
              "from-id": from.id,
              "to-id": to.id,
              "amount-cents": debt.amountCents,
              status: debt.status,
            })}
          >
            <div className="debt-line">
              <span className="debt-pair">
                <span data-verify-from-name>{from.name.toUpperCase()}</span>
                <span className="debt-arrow" aria-hidden="true"> → </span>
                <span data-verify-to-name>{to.name.toUpperCase()}</span>
              </span>
              <span className="debt-amt" data-verify-amount-display>
                {formatAmount(debt.amountCents, event.currency)}
              </span>
            </div>

            {isPaid ? (
              <p className="debt-paid-meta">
                <span className="paid-stamp">PAID</span>
                {debt.paidAt && <> · cleared at {debt.paidAt}</>}
              </p>
            ) : (
              <>
                <div className="pay-row">
                  {(["venmo", "paypal", "cashapp"] as const).map((app, i) => (
                    <a
                      key={app}
                      className={i === 0 ? "pay-btn pay-btn-primary" : "pay-btn"}
                      href={payUrl(app, to, debt.amountCents, note)}
                      aria-label={`Pay ${to.name} ${formatAmount(debt.amountCents, event.currency)} via ${app}`}
                      data-verify-pay-app={app}
                    >
                      {app === "cashapp" ? "CASH APP" : app.toUpperCase()}
                    </a>
                  ))}
                </div>
                <button
                  type="button"
                  className="mark-paid"
                  aria-label={`Mark debt from ${from.name} to ${to.name} as paid`}
                  onClick={() => handleMarkPaid(debt.id)}
                  data-verify-action="mark-paid"
                >
                  ✓ MARK AS PAID
                </button>
              </>
            )}
          </article>
        );
      })}

      <hr className="receipt-div" />
      <p className="settle-footnote">— TAB CLOSED WHEN ALL CLEARED —</p>
      <div className="receipt-perf" aria-hidden="true" />
    </section>
  );
}
