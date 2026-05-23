import type { SettleEvent } from "../features/settle/types";

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
