export interface Participant {
  id: string;
  name: string;
  /** True once a device has claimed this participant slot. */
  claimedBy?: boolean;
  /** Optional Venmo / Cash App / PayPal handle for deep-links. */
  venmo?: string;
  cashapp?: string;
  paypal?: string;
}

export interface ParticipantHandles {
  venmo?: string;
  cashapp?: string;
  paypal?: string;
}

export type DebtStatus = "open" | "paid";

export interface Debt {
  id: string;
  fromId: string;
  toId: string;
  amountCents: number;
  status: DebtStatus;
  paidAt?: string;
}

export interface Expense {
  id: string;
  /** Subtotal in cents (excludes tax/tip). Must be > 0. */
  amountCents: number;
  description: string;
  payerId: string;
  /** Participant ids the expense is split among. Must include payerId. */
  splitWith: string[];
  taxCents: number;
  tipCents: number;
  createdAt: string;
}

export interface SettleEvent {
  id: string;
  title: string;
  currency: string;
  participants: Participant[];
  debts: Debt[];
  /** Expenses logged on this event. Optional for back-compat with existing fixtures. */
  expenses?: Expense[];
}

export interface SettleScreenProps {
  event: SettleEvent;
  onMarkPaid?: (debtId: string) => void;
}
