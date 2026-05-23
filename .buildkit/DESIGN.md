# Phase 2: Four Design Directions

Four divergent visual directions for the no-account bill-splitter spec'd in
`../phase-1-exploration/SPEC.md`. Same content across all four for fair
side-by-side comparison.

## Common scenario (used in all mockups)

- **Event:** Saturday Night Out (USD)
- **Participants:** Alex, Sam, Jordan, Riley
- **Expenses:** Dinner $180 (Alex paid) · Bar $80 (Sam paid) · Uber $40 (Jordan paid)
- **Math:** $300 total / 4 = $75 per person
- **Settle:** Riley → Alex $75 · Jordan → Alex $30 · Jordan → Sam $5

## The four directions

### A. Receipt (`a-receipt/`)

Paper-receipt aesthetic. Monospace, dotted dividers, ink-stamp accents,
all-caps headers. Tactile and utilitarian — feels like a real itemized
receipt from a diner. Strong personality, narrow brand.

**Strengths:** memorable, fun, instantly readable as "bill-related."
**Risks:** monospace ages fast, may feel gimmicky beyond demo.

### B. Chat (`b-chat/`)

Group-chat feed. Each expense is a bubble with the payer's avatar and
timestamp. Bottom-tab nav. Feels like iMessage / WhatsApp — social,
familiar, easy to scan latest activity.

**Strengths:** social mental-model matches the use case (friend group),
zero-learning UX since people already use chat apps.
**Risks:** unusual for a finance tool, can feel cluttered with many items.

### C. Modernist (`c-modernist/`)

Stripe/Linear minimal. White background, generous whitespace, big
numerals, single accent color. Calm, premium, "serious money" feel.

**Strengths:** scales to v1.5 features (itemized, custom shares) without
visual chaos. Trustworthy.
**Risks:** generic — looks like every other modern SaaS.

### D. Playful (`d-playful/`)

Pastel gradient, rounded corners everywhere, emoji avatars per person,
soft shadows, friendly copy ("Who paid? 👀"). Aimed at non-techy friend
groups, social-first.

**Strengths:** approachable, distinctive, signals "this is not Splitwise."
**Risks:** may feel un-serious when amounts get large.

## Screens covered per direction

Three most-differentiating screens (signup/claim are mostly forms and look
similar across directions, so omitted to keep comparison crisp):

1. **`event-home.html`** — main view: balance summary, expense list, add CTA
2. **`add-expense.html`** — input flow: amount, payer, split-with selection
3. **`settle.html`** — pairwise debts with payment-app deep-link buttons

## How to view

```sh
cd /Users/ob/cwc-workshops/how-we-claude-code/phase-2-planning
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

Or just open `index.html` directly in a browser (file://).
