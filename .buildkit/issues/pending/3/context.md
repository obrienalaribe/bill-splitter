<frontmatter>
issue: 3
title: AddExpense: expense type + input flow + balance math
branch: feat/issue-3-add-expense
mode: hitl
blocked_by: [1]
</frontmatter>

<core_ac>
- [FAST] On Save → expense persisted + redirect to /e/:eventId ≤200ms.
- [ACCURATE] Sum of all data-verify-amount-cents on EventHome (after add) equals subtotal+tax+tip of every persisted Expense; computeBalances total === 0 across participants.
- [RELIABLE] Probe "whitespace-description" must FAIL — saving an expense with description.trim() === "" is rejected.
</core_ac>

<agent_contract>
- context_source: src/features/expense/AddExpenseScreen.tsx, src/lib/eventStore.ts (addExpense reducer), src/features/settle/types.ts (new Expense interface)
- stable_interface: AddExpenseScreen route /e/:eventId/add; data-verify-* on form (unit, valid, split-count, payer-id, has-tax, has-tip)
- proof_command: bun run typecheck && bun run verify
- non_agent_decisions: cents-as-integer (no floats); equal split only in v1 (itemized is v1.5 per SPEC); tax+tip split equally among splitWith
</agent_contract>
