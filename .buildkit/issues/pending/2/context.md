<frontmatter>
issue: 2
title: ClaimName: claim participant slot + add payment handles
branch: feat/issue-2-claim-name
mode: hitl
blocked_by: [1]
</frontmatter>

<core_ac>
- [FAST] Tap-to-claim → next paint with claimed state ≤100ms (no network round-trip; localStorage write).
- [ACCURATE] After claim, eventStore.read(eventId).participants.find(p => p.id === claimedId).claimedBy === true AND optional handles persist on the same participant object.
- [RELIABLE] Probe fixture "already-claimed" must FAIL — claiming a participant whose claimedBy===true is rejected with a detail message naming the offender.
</core_ac>

<agent_contract>
- context_source: src/features/claim/ClaimNameScreen.tsx, src/lib/eventStore.ts (extend with claimName + setHandles), src/features/settle/types.ts (add claimedBy + handles to Participant)
- stable_interface: ClaimNameScreen route /e/:eventId/claim; data-verify-* on container (unit, unclaimed-count, claimed-count) + per-name row (data-verify-participant-id, claimed)
- proof_command: bun run typecheck && bun run verify
- non_agent_decisions: no identity verification; claim is open per SPEC.md "Open edit model"; handles are optional fields, not required to claim
</agent_contract>
