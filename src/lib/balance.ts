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

export interface DebtPair {
  fromId: string;
  toId: string;
  amountCents: number;
}

/**
 * Greedy bipartite settlement: pair largest debtor with largest creditor until cleared.
 * Σ(pair.amountCents) === Σ(|negative balances|) === Σ(positive balances).
 * All balances zero → [].
 */
export function computeDebts(balances: Map<string, number>): DebtPair[] {
  const debtors: Array<[string, number]> = [];
  const creditors: Array<[string, number]> = [];
  for (const [id, v] of balances) {
    if (v < 0) debtors.push([id, -v]);
    else if (v > 0) creditors.push([id, v]);
  }
  debtors.sort((a, b) => b[1] - a[1]);
  creditors.sort((a, b) => b[1] - a[1]);
  const pairs: DebtPair[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i][1], creditors[j][1]);
    pairs.push({ fromId: debtors[i][0], toId: creditors[j][0], amountCents: pay });
    debtors[i][1] -= pay;
    creditors[j][1] -= pay;
    if (debtors[i][1] === 0) i++;
    if (creditors[j][1] === 0) j++;
  }
  return pairs;
}
