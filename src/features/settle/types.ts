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

export interface SettleEvent {
  id: string;
  title: string;
  currency: string;
  participants: Participant[];
  debts: Debt[];
}

export interface SettleScreenProps {
  event: SettleEvent;
  onMarkPaid?: (debtId: string) => void;
}
