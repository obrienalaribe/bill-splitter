import type { Expense, ParticipantHandles, SettleEvent } from "../features/settle/types";
import { computeBalances, expenseTotalCents } from "./balance";

export { computeBalances, expenseTotalCents };

const KEY_PREFIX = "billsplitter:event:";

export function eventKey(eventId: string): string {
  return `${KEY_PREFIX}${eventId}`;
}

export function readEvent(eventId: string): SettleEvent | null {
  const raw = window.localStorage.getItem(eventKey(eventId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SettleEvent;
  } catch {
    return null;
  }
}

export function writeEvent(event: SettleEvent): void {
  window.localStorage.setItem(eventKey(event.id), JSON.stringify(event));
}

const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function makeEventId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "event";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  return `${slug}-${suffix}`;
}

export class AlreadyClaimedError extends Error {
  constructor(public participantId: string, public participantName: string) {
    super(`already claimed: ${participantName} (${participantId})`);
    this.name = "AlreadyClaimedError";
  }
}

export type ClaimErrorCode = "name-not-found" | "event-not-found";

export class ClaimError extends Error {
  constructor(public code: ClaimErrorCode, message: string) {
    super(message);
    this.name = "ClaimError";
  }
}

export function claimName(
  eventId: string,
  participantId: string,
  handles?: ParticipantHandles
): SettleEvent {
  const event = readEvent(eventId);
  if (!event) throw new ClaimError("event-not-found", `event "${eventId}" not found`);
  const p = event.participants.find((x) => x.id === participantId);
  if (!p) throw new ClaimError("name-not-found", `participant "${participantId}" not in event`);
  if (p.claimedBy) throw new AlreadyClaimedError(p.id, p.name);
  p.claimedBy = true;
  if (handles?.venmo) p.venmo = handles.venmo;
  if (handles?.cashapp) p.cashapp = handles.cashapp;
  if (handles?.paypal) p.paypal = handles.paypal;
  writeEvent(event);
  return event;
}

export function setHandles(
  eventId: string,
  participantId: string,
  handles: ParticipantHandles
): SettleEvent {
  const event = readEvent(eventId);
  if (!event) throw new Error(`event "${eventId}" not found`);
  const p = event.participants.find((x) => x.id === participantId);
  if (!p) throw new Error(`participant "${participantId}" not in event`);
  if (handles.venmo !== undefined) p.venmo = handles.venmo || undefined;
  if (handles.cashapp !== undefined) p.cashapp = handles.cashapp || undefined;
  if (handles.paypal !== undefined) p.paypal = handles.paypal || undefined;
  writeEvent(event);
  return event;
}

export type ExpenseErrorCode =
  | "blank-description"
  | "zero-amount"
  | "negative-amount"
  | "negative-tax"
  | "negative-tip"
  | "unknown-payer"
  | "empty-split"
  | "payer-not-in-split"
  | "unknown-participant";

export class ExpenseError extends Error {
  constructor(public code: ExpenseErrorCode, message: string) {
    super(message);
    this.name = "ExpenseError";
  }
}

/** Pure reducer: returns a new event with the expense appended. Throws ExpenseError on invalid input. */
export function addExpense(event: SettleEvent, expense: Expense): SettleEvent {
  if (expense.description.trim() === "") {
    throw new ExpenseError("blank-description", "expense description must not be blank");
  }
  if (expense.amountCents === 0) {
    throw new ExpenseError("zero-amount", "expense amount must be > 0");
  }
  if (expense.amountCents < 0) {
    throw new ExpenseError("negative-amount", "expense amount must be > 0");
  }
  if (expense.taxCents < 0) {
    throw new ExpenseError("negative-tax", "tax must be >= 0");
  }
  if (expense.tipCents < 0) {
    throw new ExpenseError("negative-tip", "tip must be >= 0");
  }
  const ids = new Set(event.participants.map((p) => p.id));
  if (!ids.has(expense.payerId)) {
    throw new ExpenseError("unknown-payer", `payer "${expense.payerId}" not in event`);
  }
  if (expense.splitWith.length === 0) {
    throw new ExpenseError("empty-split", "splitWith must include at least one participant");
  }
  for (const id of expense.splitWith) {
    if (!ids.has(id)) {
      throw new ExpenseError("unknown-participant", `participant "${id}" not in event`);
    }
  }
  if (!expense.splitWith.includes(expense.payerId)) {
    throw new ExpenseError(
      "payer-not-in-split",
      `payer "${expense.payerId}" must be included in splitWith`
    );
  }
  return {
    ...event,
    expenses: [...(event.expenses ?? []), expense],
  };
}

export function makeExpenseId(): string {
  let suffix = "";
  for (let i = 0; i < 8; i++) suffix += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  return `exp-${suffix}`;
}

export function makeParticipantId(name: string, taken: Set<string>): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "p";
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
