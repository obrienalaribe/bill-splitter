# Bill-Splitter Spec (Phase 1 Output)

## One-line

A no-account, link-based, mobile-first bill-splitter for friends at dinners/events, scoped to single-currency equal-split MVP with itemized/custom shares as later milestones.

## Audience

**Primary:** Friends at a dinner or event. Casual, ad-hoc, zero-signup expected.

**Implied secondary:** Small travel groups (multi-expense container fits trip use case).

## Session model

**One link = one event with many expenses.**

A "split" is an event container (e.g. "Sat night out", "Mexico trip"). Multiple expenses accrue under it over hours/days. Everyone settles at the end of the event.

## Participation

- **Creator pre-lists participants** ("Alice, Bob, Carol") at event creation.
- Participants open the link and **claim their name** to join.
- On claiming, participant **optionally adds their own payment handle** (Venmo / PayPal.me / Cash App) so they can receive money.
- **No accounts, no passwords, no email/OTP.** Link = identity proof.

## Permissions

**Open edit model:** anyone with the link can edit anything — add expenses, edit names, delete entries, mark debts paid.

Trade-off accepted: griefing risk in exchange for zero friction.

## MVP scope (prioritized)

### v1 (ship first)
- **Equal split** of expenses across selected participants
- Per-expense **payer selection** (who paid, so settle-up math works)
- Manual amount + description entry
- Mobile-first responsive web UI
- Single currency per event (user picks at creation: USD/EUR/GBP/etc.)
- Optional **tax/tip** inputs split equally
- Settle view: "X owes Y $Z" for each pair
- **Mark as paid** button on each debt — either payer or receiver can tap it
- Deep-link to **Venmo, PayPal.me, Cash App** with prefilled amount + note
- Data **lives forever** at the link URL

### v1.5 (after MVP works)
- **Itemized split** — assign specific line items to specific people
- **Custom shares / percentages** — non-equal splits (e.g. 30/30/40)
- **Receipt photo + OCR** — snap a pic, app extracts total + line items
- **Multi-expense settle-up with debt simplification** — reduce N pairwise debts to minimum number of transactions

## Concurrency

**Last-write-wins. No realtime sync.** Refresh to see others' changes. Acceptable because most events have one person actively entering at a time.

## Data lifecycle

Links live **forever**. Server retains data indefinitely. No auto-expiry.

## Out of scope for v1

- Built-in payment processing (Stripe Connect, etc.)
- Multi-currency / FX conversion
- User accounts and cross-event history
- Notifications (push, email, SMS)
- Realtime collaborative editing
- Roommate-style recurring bills
- Zelle integration (no deep-link API; could add "copy amount to clipboard" later)

## Open questions for phase 2

- **Backend choice:** localStorage-only? URL-hash-encoded state? Or a server (SQLite/Postgres + edge function)? Affects "lives forever" claim and link-share UX.
- **Link ID format:** sequential vs UUID vs slug. Affects guessability/security of open-edit links.
- **OCR provider** (v1.5): Claude vision API, Tesseract.js, Google Vision? Cost vs accuracy.
- **Debt simplification algorithm** (v1.5): standard min-cashflow graph reduction; well-known but needs spec.

## Acceptance criteria (v1 done = )

1. User can create event, name participants, pick currency, share link.
2. Recipient opens link on phone, claims their name, optionally adds Venmo handle.
3. Anyone can add an expense (amount, description, payer, optional tax/tip).
4. Event view shows running balance per person.
5. Settle view shows pairwise debts, each with a deep-link button to Venmo/PayPal/Cash App that opens the app with amount + note prefilled.
6. Either side can tap "mark as paid" to clear a debt.
7. Full flow works on a phone-sized viewport with no signup.
