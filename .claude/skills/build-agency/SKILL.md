---
name: build-agency
description: Generate the complete UK-legal GoHighLevel review-automation agency launch package into agency/ using the multi-agent harness (research → strategy → design → assets → compliance gate → package). Use when asked to build, rebuild, or audit the agency launch package. Pass --gate-only to audit the existing agency/ files without regenerating.
---

# Build the UK GHL Review-Automation Agency Launch Package

This skill runs a multi-agent harness that generates a complete, UK-legal launch package
for a GoHighLevel review-automation agency into `agency/`. Legality is enforced by a
compliance gate (UK GDPR, PECR reg 22, DMCC Act 2024) — nothing is packaged until the
gate passes. Models are minimised per stage: Haiku for mechanical work, Sonnet where
judgment is load-bearing, no Opus.

## Preferred path: the workflow

Run the Workflow tool with:

- `scriptPath: .claude/workflows/build-ghl-agency.js`
- `args: {"runDate": "<today, YYYY-MM-DD>"}` — the script cannot call Date.now(); always
  pass today's date.
- For an audit-only run (no regeneration): `args: {"runDate": "<today>", "gateOnly": true}`.
  This is the `--gate-only` mode; it audits the existing `agency/**` files, writes the
  verdict to `agency/_gate/`, and still dispatches fixes if the gate fails.

Expect ~12 subagent runs across 6 phases. On success the script returns
`{verdict: "PASS", …}` and `agency/MANIFEST.md` records the gate result. If the gate
fails 3 times the script throws and nothing is packaged — read `agency/_gate/review-iter-*.md`
and fix the harness (usually an agent prompt) before rerunning.

## Fallback path: manual orchestration (if the Workflow tool is unavailable)

Run the same plan with the Agent tool, using these agent types (defined in
`.claude/agents/`) in this order. Phases 1, 3 and 4 fan out in parallel; wait for each
phase to finish before the next (later phases read earlier phases' files from disk).

| Phase | Agents (parallel within phase) |
|---|---|
| 1 Research | `market-researcher`, `compliance-researcher` |
| 2 Strategy | `offer-strategist` |
| 3 Design | `ghl-architect`, `legal-drafter` |
| 4 Assets | `setup-guide-writer`, `campaign-copywriter`, `ops-writer` |
| 5 Gate loop | `compliance-reviewer` → if FAIL, route each finding to its owner agent in FIX MODE (owners by path: `agency/ghl/setup-guide.md`→setup-guide-writer; other `agency/ghl/**`→ghl-architect; `agency/campaigns/**`→campaign-copywriter; `agency/compliance/legal-research-notes.md`→compliance-researcher; other `agency/compliance/**` and `agency/legal/**`→legal-drafter; `agency/ops/**`→ops-writer; `agency/research/**`→offer-strategist) → re-audit. Max 3 iterations, then stop and report failure. Record each verdict in `agency/_gate/review-iter-N.md`. |
| 6 Package | `packager` (only after PASS) |

Ask the gate agent to end with a JSON verdict `{"verdict": "PASS"|"FAIL", "findings":
[{"file", "checklist_id", "issue", "required_fix"}]}` and treat malformed output as FAIL.

## Hard rules (both paths)

- All generated output goes under `agency/` ONLY. Never modify the Next.js app (`src/`,
  `scripts/`, configs) or the harness's own reference files during a run.
- The compliance checklist at `references/uk-compliance-checklist.md` is ground truth;
  agents never relax it. Discrepancies with current law get reported, not self-patched.
- Do not skip the gate, cap it above 3 iterations, or package after a failing gate.
