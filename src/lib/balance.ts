import type { SettleEvent } from "../features/settle/types";

/**
 * Per-participant balance in cents. Positive = others owe them, negative = they owe.
 * Σ values === 0 by construction (payer +total; splitWith members −share each, shares sum to total).
 */
export function computeBalances(event: SettleEvent): Map<string, number> {
  const balances = new Map<string, number>();
  for (const p of event.participants) balances.set(p.id, 0);
  for (const e of event.expenses ?? []) {
    const total = e.amountCents + e.taxCents + e.tipCents;
    const n = e.splitWith.length;
    if (n === 0) continue;
    const base = Math.floor(total / n);
    const remainder = total - base * n;
    balances.set(e.payerId, (balances.get(e.payerId) ?? 0) + total);
    e.splitWith.forEach((id, i) => {
      const share = base + (i < remainder ? 1 : 0);
      balances.set(id, (balances.get(id) ?? 0) - share);
    });
  }
  return balances;
}

/** Total cents (subtotal + tax + tip) across every expense on the event. */
export function expenseTotalCents(event: SettleEvent): number {
  return (event.expenses ?? []).reduce(
    (acc, e) => acc + e.amountCents + e.taxCents + e.tipCents,
    0
  );
}
