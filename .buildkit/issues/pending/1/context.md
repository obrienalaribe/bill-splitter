<frontmatter>
issue: 1
title: CreateEvent: event store + new-event form
branch: feat/issue-1-create-event
mode: hitl
</frontmatter>

<core_ac>
- [FAST] On submit of CreateEventScreen, persistEvent + navigate('/e/:eventId') completes in <200ms (DOMContentLoaded → next-route paint).
- [ACCURATE] After hard refresh of /e/:eventId, the rehydrated Event from localStorage is deep-equal to what was persisted at submit time.
- [RELIABLE] Probe fixture "duplicate-participants" (e.g. "Alex, Alex, Sam") must FAIL the verify schema with a detail message naming the duplicated id.
</core_ac>

<agent_contract>
- context_source: src/features/create/CreateEventScreen.tsx, src/lib/eventStore.ts, src/features/settle/types.ts
- stable_interface: window.localStorage key pattern "billsplitter:event:<eventId>" + a CreateEventScreen unit registered in src/verify/specs/CreateEventScreen.verify.ts emitting data-verify-* on the form (unit, participant-count, currency, valid)
- proof_command: bun run typecheck && bun run verify
- non_agent_decisions: routing library (already react-router-dom v6), event id format (slug from title + 6-char random suffix), currency list (USD, EUR, GBP, CAD, AUD)
</agent_contract>
