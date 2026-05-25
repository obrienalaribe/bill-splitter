# bill-splitter

A no-account, link-based, mobile-first bill splitter for friends at dinners and events.

> Built as a workshop output using [buildkit](https://github.com/obrienalaribe/buildkit), an autonomous build harness for Claude Code. See the retrospective: [What I learned from building an agent harness](https://obrienalaribe.github.io/journal/what-i-learned-from-building-an-agent-harness/).

## Run locally

```bash
bun install
bun run dev          # app at http://localhost:5200
bun run verify       # vitest verification matrix
bun run typecheck
```

Open `http://localhost:5200/verify` for the live verification dashboard (per the [How We Claude Code workshop, phase 3](https://github.com/anthropics/cwc-workshops/tree/main/how-we-claude-code/phase-3-verify) pattern). Every component declares fixtures, invariants, and a machine-readable DOM contract that the dashboard exercises at runtime.

## How this repo was built

This project was built end-to-end by [buildkit](https://github.com/obrienalaribe/buildkit) following the [Anthropic How We Claude Code workshop](https://github.com/anthropics/cwc-workshops/tree/main/how-we-claude-code) three-phase flow:

1. **Phase 1 (interview brainstorm)**: an interview-driven session produced [`SPEC.md`](.buildkit/SPEC.md) (audience, session model, scope ladder).
2. **Phase 2 (divergent planning)**: four visual design directions were rendered as static HTML mockups; one was picked and the rationale captured in [`DECISION.md`](.buildkit/DECISION.md). The chosen direction (Receipt) is described in [`DESIGN.md`](.buildkit/DESIGN.md).
3. **Phase 3 (verifiable build)**: the spec was broken into vertical slices, one GitHub issue per slice. The buildkit harness drove each slice through `intake → build → proof → audit → PR → merge`. Every per-issue state transition is in [`orchestrator-events.jsonl`](.buildkit/orchestrator-events.jsonl).

## What's in `.buildkit/`

A transparency artifact. Anyone reading the repo can trace how the code got here:

| File | Contents |
|---|---|
| `SPEC.md` | Phase 1 output. One-line summary, audience, session model, scope ladder, success criteria. |
| `DECISION.md` | Phase 2 output. The chosen visual design direction (out of four explored) plus the rationale lens-by-lens. |
| `DESIGN.md` | Phase 2 output. The picked direction's visual + interaction details. |
| `orchestrator-events.jsonl` | Append-only audit log. One JSONL line per supervisor state transition (bootstrap, phase-3 breakdown, per-slice build/merge). |
| `issues/` | Per-issue state under `pending/`, `blocked/`, `done/`. Each issue dir has `context.md` (XML build contract), `build-state.json`, `events.jsonl`, `transcripts/`, `reviews/`. |
| `worktrees/` | Per-issue git worktrees the buildkit builder runs inside. Local-only cache. |

## License

Apache-2.0 (matching the cwc-workshops upstream).
