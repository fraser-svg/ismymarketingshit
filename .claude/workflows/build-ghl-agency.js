export const meta = {
  name: 'build-ghl-agency',
  description: 'Generate the full UK-legal GoHighLevel review-automation agency launch package into agency/',
  whenToUse: 'When asked to (re)generate the agency launch package. Pass {gateOnly: true, runDate: "YYYY-MM-DD"} in args to audit the existing agency/ files without regenerating.',
  phases: [
    { title: 'Research', detail: 'UK market facts + current-law verification', model: 'haiku' },
    { title: 'Strategy', detail: 'positioning, niches, pricing' },
    { title: 'Design', detail: 'GHL architecture + legal/compliance pack' },
    { title: 'Assets', detail: 'setup guide, campaign copy, ops SOPs', model: 'haiku' },
    { title: 'Compliance gate', detail: 'audit → fix → re-audit, max 3 iterations' },
    { title: 'Package', detail: 'README + MANIFEST + completeness check', model: 'haiku' },
  ],
}

const REFS = '.claude/skills/build-agency/references'
const CHECKLIST = `${REFS}/uk-compliance-checklist.md`
const SPEC = `${REFS}/output-spec.md`
const MAX_GATE_ITERATIONS = 3
const RUN_DATE = (args && args.runDate) || 'unknown (pass args.runDate)'
const GATE_ONLY = !!(args && args.gateOnly)

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'findings'],
  properties: {
    verdict: { type: 'string', enum: ['PASS', 'FAIL'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['file', 'checklist_id', 'issue', 'required_fix'],
        properties: {
          file: { type: 'string' },
          checklist_id: { type: 'string' },
          issue: { type: 'string' },
          required_fix: { type: 'string' },
        },
      },
    },
  },
}

// Findings are routed back to the file's original author. Order matters:
// the setup guide is more specific than the rest of agency/ghl/.
const OWNER_ROUTES = [
  ['agency/ghl/setup-guide.md', 'setup-guide-writer'],
  ['agency/ghl/', 'ghl-architect'],
  ['agency/campaigns/', 'campaign-copywriter'],
  ['agency/compliance/legal-research-notes.md', 'compliance-researcher'],
  ['agency/compliance/', 'legal-drafter'],
  ['agency/legal/', 'legal-drafter'],
  ['agency/ops/', 'ops-writer'],
  ['agency/research/', 'offer-strategist'],
]

// Lowest-possible-model map. The Sonnet compliance gate is what makes Haiku
// safe for the generation stages.
const AGENT_MODEL = {
  'market-researcher': 'haiku',
  'compliance-researcher': 'sonnet',
  'offer-strategist': 'sonnet',
  'ghl-architect': 'sonnet',
  'setup-guide-writer': 'haiku',
  'campaign-copywriter': 'haiku',
  'legal-drafter': 'sonnet',
  'ops-writer': 'haiku',
  'compliance-reviewer': 'sonnet',
  'packager': 'haiku',
}

function ownerFor(file) {
  const route = OWNER_ROUTES.find(([prefix]) => file.startsWith(prefix))
  return route ? route[1] : 'legal-drafter'
}

function run(agentType, prompt, opts) {
  return agent(prompt, {
    agentType,
    model: AGENT_MODEL[agentType],
    label: (opts && opts.label) || agentType,
    phase: opts && opts.phase,
    schema: opts && opts.schema,
  })
}

async function runGate(iteration, phaseName) {
  const verdict = await run(
    'compliance-reviewer',
    `Audit the generated agency launch package. Follow your agent instructions: read ${CHECKLIST} and ${SPEC}, then read EVERY file under agency/ (except agency/_gate/) and report every genuine violation. This is audit iteration ${iteration} — audit from scratch; do not assume earlier fixes worked.`,
    { label: `gate:iter-${iteration}`, phase: phaseName, schema: VERDICT_SCHEMA }
  )
  if (!verdict) throw new Error(`Compliance gate iteration ${iteration} returned no verdict — aborting, NOT packaging.`)
  const summary = verdict.findings
    .map((f) => `- ${f.file} [${f.checklist_id}] ${f.issue} → ${f.required_fix}`)
    .join('\n')
  await run(
    'packager',
    `Scribe task (exception to your normal outputs): write the file agency/_gate/review-iter-${iteration}.md verbatim from this data and return "done". Do not write any other file.\n\n# Compliance gate — iteration ${iteration} (${RUN_DATE})\n\nVerdict: ${verdict.verdict}\nFindings: ${verdict.findings.length}\n\n${summary || '(none)'}`,
    { label: `gate-scribe:iter-${iteration}`, phase: phaseName }
  )
  return verdict
}

async function fixFindings(verdict, iteration, phaseName) {
  const byOwner = {}
  for (const f of verdict.findings) {
    const owner = ownerFor(f.file)
    ;(byOwner[owner] = byOwner[owner] || []).push(f)
  }
  log(`Gate iteration ${iteration}: FAIL with ${verdict.findings.length} finding(s) across ${Object.keys(byOwner).length} owner agent(s) — dispatching fixes`)
  await parallel(
    Object.entries(byOwner).map(([owner, findings]) => () =>
      run(
        owner,
        `FIX MODE. The compliance gate rejected files you own. Address ONLY these findings, exactly as specified, citing the checklist (${CHECKLIST}). Edit only the cited files; change nothing else.\n\n${JSON.stringify(findings, null, 2)}`,
        { label: `fix:${owner}`, phase: phaseName }
      )
    )
  )
}

// ---------------------------------------------------------------------------

if (!GATE_ONLY) {
  phase('Research')
  await parallel([
    () => run('market-researcher', `Produce agency/research/market-snapshot.md and agency/research/target-niches.md per your agent instructions and ${SPEC}. Today's date for source-recency judgement: ${RUN_DATE}.`),
    () => run('compliance-researcher', `Produce agency/compliance/legal-research-notes.md per your agent instructions: verify the factual claims in ${CHECKLIST} against current primary sources and cite everything. Today's date: ${RUN_DATE}.`),
  ])

  phase('Strategy')
  await run('offer-strategist', `Produce agency/research/offer-and-pricing.md per your agent instructions, from the research files and ${CHECKLIST}.`)

  phase('Design')
  await parallel([
    () => run('ghl-architect', `Produce agency/ghl/snapshot-spec.md, agency/ghl/workflows/review-request-sequence.md, agency/ghl/workflows/opt-out-handling.md and agency/ghl/uk-phone-sms-settings.md per your agent instructions. Compliance is structural: DMCC-2 (no gating), PECR-1/2/3/4, TONE-1 are binding.`),
    () => run('legal-drafter', `Produce all agency/compliance/ files (except legal-research-notes.md) and agency/legal/service-agreement-template.md per your agent instructions and ${SPEC}. LEGAL-1 disclaimer on every file.`),
  ])

  phase('Assets')
  await parallel([
    () => run('setup-guide-writer', `Produce agency/ghl/setup-guide.md per your agent instructions, from the four agency/ghl spec files.`),
    () => run('campaign-copywriter', `Produce the four agency/campaigns/ files per your agent instructions. PECR-2 (STOP line / unsubscribe in every message), DMCC-2 (identical ask for everyone), TONE-2 (honest feedback, never "5-star") are binding.`),
    () => run('ops-writer', `Produce the three agency/ops/ files per your agent instructions and ${SPEC}.`),
  ])
}

let verdict = null
for (let i = 1; i <= MAX_GATE_ITERATIONS; i++) {
  verdict = await runGate(i, 'Compliance gate')
  if (verdict.verdict === 'PASS') {
    log(`Compliance gate: PASS on iteration ${i}`)
    break
  }
  if (i === MAX_GATE_ITERATIONS) {
    throw new Error(`Compliance gate FAILED after ${MAX_GATE_ITERATIONS} iterations (${verdict.findings.length} finding(s) remain). NOT packaging. Audit trail: agency/_gate/`)
  }
  await fixFindings(verdict, i, 'Compliance gate')
}

if (GATE_ONLY) {
  return { gateOnly: true, verdict: verdict.verdict, findings: verdict.findings }
}

phase('Package')
const packResult = await run(
  'packager',
  `The compliance gate PASSED. Produce agency/README.md and agency/MANIFEST.md per your agent instructions. Gate status: PASS. Generation date: ${RUN_DATE}. Verify every path in ${SPEC} exists and report honestly.`
)

return { verdict: 'PASS', packager: packResult }
