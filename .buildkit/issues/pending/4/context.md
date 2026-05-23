<frontmatter>
issue: 4
title: EventHome: balance summary + expense list + nav
branch: feat/issue-4-event-home
mode: hitl
blocked_by: [1, 3]
</frontmatter>

<core_ac>
- [FAST] EventHomeScreen first paint ≤100ms on a 10-expense, 4-participant event (jsdom benchmark via verify matrix).
- [ACCURATE] computeBalances(event) returns Map<participantId,cents> where Σ values === 0 and per-participant value === (sum paid) − (sum owed).
- [RELIABLE] Probe "empty-event" must PASS the empty-state invariant: [data-verify-empty="true"] is present, zero [data-verify-expense] children, "+ Add expense" CTA visible, no crash.
</core_ac>

<agent_contract>
- context_source: src/features/home/EventHomeScreen.tsx, src/lib/balance.ts (new pure helper), src/features/settle/types.ts
- stable_interface: EventHomeScreen route /e/:eventId; data-verify-* on container (unit, event-id, currency, expense-count, participant-count, total-cents) + per-expense row (expense-id, amount-cents, payer-id) + per-balance pill (participant-id, balance-cents)
- proof_command: bun run typecheck && bun run verify
- non_agent_decisions: chronological sort newest-first; show balance pills above expense list; reuse settle.css receipt aesthetic for visual consistency
</agent_contract>
