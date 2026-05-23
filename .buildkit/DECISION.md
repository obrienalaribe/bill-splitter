# Phase 2 Decision

**Chosen direction: A. Receipt**

## Rationale

| Lens | Winner | Why |
|---|---|---|
| Gut pick | A. Receipt | First emotional response |
| v1.5 fit | A. Receipt | Itemized layout is literally what receipts do |
| Memorability constraint | A. Receipt / D. Playful | Strong personality |
| First-2sec "ease" | B. Chat | Familiarity (only lens that pulled away) |

3 of 4 lenses point to Receipt. The "ease" gap is real but solvable by borrowing patterns from Chat without changing the skin.

## Build instructions for phase 3

When the Receipt direction is ported into the verifiable React app, keep:

- Cream paper background (`#f4ecd8` / `#fbf5e3` panel)
- Monospace family for numbers + descriptions
- Dotted dividers, perforated top/bottom edges
- Ink-stamp PAID accent (rotated -8deg, red `#c0392b`, opacity ~.7)
- All-caps headers for section labels

But borrow from Chat:

- Sticky "+ Add expense" composer bar at bottom (familiar mobile pattern)
- Per-participant color dot + initials on every expense
- Conversational copy: "Sam paid $80 · Bar tab" not "EXPENSE: SAM"
- Small timestamps in grey

And borrow from Modernist:

- Clear numeric hierarchy: total = ~36px, line items = ~15px
- Hairlines (`#eaeaea` 1px) instead of dotted dividers in dense expense lists where dotted clutters

Cut:

- Pastel gradients (clash with paper)
- Chat bubble backgrounds (eat vertical space)
- Emoji avatars (incongruent with paper aesthetic)

## Cross-reference

- Spec: `../phase-1-exploration/SPEC.md`
- Chosen mocks: `a-receipt/event-home.html`, `a-receipt/add-expense.html`, `a-receipt/settle.html`
