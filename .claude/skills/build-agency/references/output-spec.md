# Output Specification — `agency/` launch package

The contract shared by all writer agents, the compliance gate, and the packager.
Every file below MUST exist after a successful run, contain the required sections, and
satisfy the applicable checklist rules (IDs refer to `uk-compliance-checklist.md`).

All output is written **only** under `agency/`. UK English throughout.

| Path | Owner agent | Required sections | Applicable rules |
|---|---|---|---|
| `agency/research/market-snapshot.md` | market-researcher | UK market overview; competitor table (name, offer, price); demand signals; sources list | LEGAL-2 |
| `agency/research/target-niches.md` | market-researcher | 5–8 candidate niches with rationale (review volume dependence, transaction frequency, ease of contact capture) | — |
| `agency/research/offer-and-pricing.md` | offer-strategist | Positioning statement; chosen top-3 niches; core offer; 3-tier pricing (setup fee + monthly); compliance-as-differentiator angle; what we will NOT do (gating, incentives, fake reviews) | DMCC-1, DMCC-2, LEGAL-2 |
| `agency/ghl/snapshot-spec.md` | ghl-architect | Sub-account structure; custom fields list; custom values list; tags taxonomy; pipeline + stages; template inventory | PECR-1..4, DMCC-2 |
| `agency/ghl/workflows/review-request-sequence.md` | ghl-architect | Trigger; eligibility check (consent basis recorded, not DND, not already asked); step-by-step actions with waits; goal event; quiet-hours settings; stop conditions | PECR-1, PECR-2, PECR-3, DMCC-2, TONE-1, TONE-2 |
| `agency/ghl/workflows/opt-out-handling.md` | ghl-architect | STOP-reply trigger → DND + tag + remove from workflows; email unsubscribe handling; suppression permanence; audit logging | PECR-2, PECR-3, GDPR-4 |
| `agency/ghl/uk-phone-sms-settings.md` | ghl-architect | UK long number acquisition (LC Phone); sender identity; why no alphanumeric sender ID; quiet hours configuration; cost notes | PECR-2, PECR-4, TONE-1 |
| `agency/ghl/setup-guide.md` | setup-guide-writer | Prerequisites; numbered click-by-click UI steps covering: agency account, snapshot build, sub-account creation, phone setup, GBP connect, workflow build, custom values, test send | all of the above (guide must not contradict specs) |
| `agency/campaigns/sms-sequence.md` | campaign-copywriter | Full SMS copy for initial + 2 follow-ups with merge fields; character counts; STOP line in every message; sender identification | PECR-2, DMCC-2, TONE-1, TONE-2 |
| `agency/campaigns/email-sequence.md` | campaign-copywriter | Full email copy (subject + body) for initial + 2 follow-ups; unsubscribe element noted in every email; sender identification | PECR-2, DMCC-2, TONE-1, TONE-2 |
| `agency/campaigns/review-response-templates.md` | campaign-copywriter | ≥4 positive-review responses; ≥4 negative-review responses (empathetic, take-it-offline, never conditional offers); usage guidance | DMCC-3, DMCC-5 |
| `agency/campaigns/google-review-link-guide.md` | campaign-copywriter | How to find a client's Place ID; construct the writereview URL; store as GHL custom value; test it | TONE-2 |
| `agency/compliance/legal-research-notes.md` | compliance-researcher | Current-law notes with sources: DMCC status + CMA guidance, PECR reg 22 + ICO position on review requests, ICO fee tiers, GHL data-location caveat | — |
| `agency/compliance/lawful-basis-analysis.md` | legal-drafter | Processing operations table → lawful basis; LIA template; PECR basis (consent vs soft opt-in) decision tree | GDPR-1, PECR-1, PECR-5, LEGAL-1 |
| `agency/compliance/pecr-consent-flow.md` | legal-drafter | How consent / soft opt-in is captured at point of sale; wording examples; how basis is recorded in GHL (custom field); evidence retention | PECR-1, PECR-5, GDPR-4, LEGAL-1 |
| `agency/compliance/dmcc-review-policy.md` | legal-drafter | Client-facing policy: no fake/incentivised reviews; no gating; no paying to alter; reasonable-steps duties; staff do's & don'ts | DMCC-1..5, LEGAL-1 |
| `agency/compliance/dpa-template.md` | legal-drafter | Art 28(3) mandatory clauses; parties/roles; sub-processors (GHL) ; international transfers clause; breach notification | GDPR-2, GDPR-6, LEGAL-1 |
| `agency/compliance/privacy-notice-template.md` | legal-drafter | Insert for the client's privacy notice covering review invitations: purposes, basis, processors, retention, rights, right to object | GDPR-3, LEGAL-1 |
| `agency/compliance/retention-schedule.md` | legal-drafter | Data categories → retention period → justification; suppression-list permanence | GDPR-4, LEGAL-1 |
| `agency/compliance/ico-registration-note.md` | legal-drafter | ICO data protection fee: who must pay (agency AND clients), tiers, self-assessment link | GDPR-5, LEGAL-1 |
| `agency/compliance/disclaimers.md` | legal-drafter | Master disclaimer text; where it must appear; scope-of-service limits | LEGAL-1 |
| `agency/legal/service-agreement-template.md` | legal-drafter | Services; client obligations (consent capture, truthful info); compliance warranties both ways; DPA incorporation; fees; term/termination; liability | GDPR-2, DMCC-4, LEGAL-1 |
| `agency/ops/onboarding-checklist.md` | ops-writer | Pre-kickoff (contract+DPA signed, ICO fee, privacy notice updated); technical setup steps; consent-basis audit; go-live checks; first-week monitoring | GDPR-2, GDPR-5, PECR-1 |
| `agency/ops/monthly-reporting-template.md` | ops-writer | KPI table (requests sent, delivery, reviews gained, rating trend, opt-out rate); compliance attestations section; narrative section | TONE-1 |
| `agency/ops/complaint-optout-sop.md` | ops-writer | Opt-out handling steps + SLA (immediate); complaint escalation; data subject rights requests routing to client; incident log | PECR-3, GDPR-3, GDPR-4 |
| `agency/README.md` † | packager | What this package is; how to use it (read order); limitations (templates not legal advice; no GHL API automation; verify current law) | LEGAL-1 |
| `agency/MANIFEST.md` † | packager | Full file list; gate status + iterations; generation date; harness version | — |

† Written by the packager only AFTER the compliance gate passes — exempt from the gate
audit (their absence during the gate is expected, never a finding).

Gate audit trail (`agency/_gate/review-iter-N.md`) is written by the workflow itself and
is exempt from the spec table.
