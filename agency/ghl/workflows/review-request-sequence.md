# Workflow — Review Request Sequence

Sub-account workflow: `Review Request Sequence`. Uses fields, tags, custom values and
the pipeline defined in `agency/ghl/snapshot-spec.md` — names must match exactly.

This is the **only** path to the public review ask. It is identical for every eligible
contact. There is no sentiment branch, rating filter, or "if unhappy" detour anywhere in
this workflow (DMCC-2). If GHL's built-in Reputation Management review funnel is used
for anything, **do not enable its sentiment pre-screening option** — this custom
workflow is what actually decides who gets asked, using the eligibility check below, not
how the customer feels about the business.

---

## Trigger

- **Contact Tag Added: `job-completed`**

  (Set by the client's own process — e.g. an admin tags a contact when a job/appointment/
  return is finished — or, if the client's pipeline already tracks this, a **Pipeline
  Stage Changed** trigger on their operational pipeline reaching a "Job Completed"
  equivalent stage. Either trigger is acceptable; use one consistently per client and
  document which in the setup guide. Verify exact trigger options in GHL UI.)

---

## Step 0 — Eligibility check (If/Else branch, before any send)

This branch is a **compliance gate**, not a content branch — it decides *whether* a
message sends at all, never *which* message or *which link*. Every contact that clears it
receives the exact same sequence.

Conditions (all must be true to proceed; ANY false → exit to the "Not Eligible" path,
which takes no action and sends nothing):

1. `Review Consent Basis` is not empty (i.e. equals `consent` or `soft-opt-in`) — PECR-1.
   No message sends to a contact with no recorded lawful basis, ever.
2. Contact is **not** DND for SMS and **not** DND for Email — PECR-3 (a suppressed
   contact never re-enters this sequence; see opt-out-handling.md).
3. Tag `opted-out` is **not** present on the contact — belt-and-braces alongside the DND
   check.
4. `Review Request Status` equals `Not Started` — TONE-1, "not already asked for this
   transaction." A contact whose status is anything else (`Requested`, `Follow-up 1
   Sent`, `Follow-up 2 Sent`, `Review Left`, `Opted Out`) does not get asked again for
   the same job.

**"Not Eligible" exit path:** end workflow for this contact. No SMS, no email, no tag
change. (Optional: add an internal-only notification/task to an admin, e.g. "contact
tagged job-completed but has no consent basis recorded" — helpful for catching
onboarding gaps, but this is an internal notice, never a customer-facing message.)

**Repeat-customer dedupe note:** to legitimately ask the same contact again for a *new*
transaction, the client's process must first reset `Review Request Status` to
`Not Started` and update `Last Job Completed Date`/`Job Reference` to the new job — this
is a deliberate manual/administrative step, not something this workflow does
automatically, so that "already asked for this transaction" stays true by construction.

---

## Step 1 — Mark requested

- Set custom field `Review Request Status` = `Requested`.

## Step 2 — Send initial SMS

- Action: **Send SMS**, template "Initial review request" (`agency/campaigns/sms-sequence.md`).
- **Quiet hours window: 08:00–20:00 Europe/London, every day (TONE-1).** Configure the
  send window on this action (or the equivalent account-level sending-hours setting —
  verify exact control in GHL UI); a message due outside the window queues for the next
  in-window moment rather than sending immediately.
- Message must end with the STOP opt-out instruction and identify
  `{{custom_values.business_name}}` (PECR-2) — enforced in the template itself.

## Step 3 — Send initial email

- Action: **Send Email**, template "Initial review request" (`agency/campaigns/email-sequence.md`).
- Must include the platform unsubscribe element/merge tag and identify
  `{{custom_values.business_name}}` (PECR-2) — enforced in the template itself.

## Step 4 — Tag

- Add tag `review-requested`.

## Step 5 — Wait

- **Wait 3 days.**

## Step 6 — Goal check (implicit workflow goal)

- **Goal event: tag `review-left` added, OR contact replied to the SMS/email
  (excluding STOP-type replies, which are handled by the separate opt-out workflow and
  remove the contact from here regardless).**
- If the goal has fired for this contact by this point, the workflow ends here for them —
  no further steps run. Configure this as a workflow-level Goal in GHL (exits any
  enrolled contact the moment the goal condition is met, not only at this checkpoint) —
  verify exact configuration in GHL UI.
- Note: GHL cannot itself confirm a Google review was actually posted. `review-left` is
  applied either manually by staff (e.g. checking new reviews against requested contacts)
  or via a reply-detection heuristic the client sets up — flag as "verify in GHL UI" for
  whichever method is used; do not build an automatic "assume no reply = unhappy, skip
  ahead" branch, which would reintroduce a sentiment-adjacent gate.

## Step 7 — Follow-up 1 (only reached if goal not yet met)

- Send SMS, template "Follow-up 1" (`agency/campaigns/sms-sequence.md`) — same quiet-hours
  window (08:00–20:00 Europe/London), same STOP + sender-identity requirements.
- Send Email, template "Follow-up 1" (`agency/campaigns/email-sequence.md`) — same
  unsubscribe + sender-identity requirements.
- Set `Review Request Status` = `Follow-up 1 Sent`.
- Add tag `review-followup-1-sent`.

## Step 8 — Wait

- **Wait 4 days.**

## Step 9 — Goal check

- Same goal condition as Step 6. If met, workflow ends here.

## Step 10 — Follow-up 2 (only reached if goal not yet met)

- Send SMS, template "Follow-up 2" (`agency/campaigns/sms-sequence.md`) — same quiet-hours
  window, same STOP + sender-identity requirements.
- Send Email, template "Follow-up 2" (`agency/campaigns/email-sequence.md`) — same
  unsubscribe + sender-identity requirements.
- Set `Review Request Status` = `Follow-up 2 Sent`.
- Add tag `review-followup-2-sent`.

## Step 11 — End

- Workflow ends. Maximum sends for this transaction: 1 initial SMS + 1 initial email +
  2 follow-up SMS + 2 follow-up email = the TONE-1 cap of "one initial request plus two
  follow-ups." No further automated review-request contact happens for this transaction
  regardless of outcome.

---

## Stop conditions (apply at every step, not just the named goal checks)

- Tag `review-left` added at any point → remaining steps do not run (goal event).
- Contact becomes DND (SMS or Email), or tag `opted-out` is added, at any point → the
  separate `opt-out-handling.md` workflow removes the contact from this workflow
  immediately; no further step here executes for that contact.
- `Review Request Status` reaching `Follow-up 2 Sent` and Step 11 completing → natural
  end, frequency cap reached.

## Compliance summary for this file

- PECR-1: Step 0 condition 1 blocks any send with no recorded consent basis.
- PECR-2: enforced in every template referenced (STOP line / unsubscribe element, sender
  identity) — see `agency/campaigns/sms-sequence.md` and `email-sequence.md`.
- PECR-3: Step 0 conditions 2–3, plus immediate removal on opt-out (see
  `opt-out-handling.md`).
- DMCC-2: single path, Steps 1–11, identical for every contact that clears Step 0. Step 0
  is a lawful-basis/dedupe gate, not a sentiment or rating gate.
- TONE-1: quiet-hours window on every SMS step; frequency cap of 3 sends per channel per
  transaction; dedupe via `Review Request Status`.
- TONE-2: enforced in template copy (ask for honest feedback, never "a 5-star review") —
  see campaign files.
