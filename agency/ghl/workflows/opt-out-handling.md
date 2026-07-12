# Workflow — Opt-Out Handling

Sub-account workflow: `Opt-Out Handling`. Runs in parallel with, and takes priority over,
`review-request-sequence.md`. Uses fields and tags defined in
`agency/ghl/snapshot-spec.md` — names must match exactly.

Suppression under this workflow is **permanent** — see "Permanence" below.

---

## Trigger 1 — SMS STOP reply

- **Contact Replied** (SMS), message contains any of the standard UK opt-out keywords:
  `STOP`, `STOP ALL`, `UNSUBSCRIBE`, `CANCEL`, `END`, `QUIT` (case-insensitive; verify the
  exact keyword-matching mechanism in GHL UI — some carriers/LC Phone handle certain STOP
  keywords automatically at the network level before the message even reaches a workflow
  trigger; this workflow is the backstop that guarantees the CRM-side state is also
  correct regardless of carrier-level handling).

### Actions (SMS STOP path)

1. Set contact **DND: SMS = true**.
2. Add tag `opted-out`.
3. Set custom field `Review Request Status` = `Opted Out`.
4. Set custom field `Opt-Out Date` = now.
5. Set custom field `Opt-Out Channel` = `SMS`.
6. **Remove contact from workflow: `Review Request Sequence`** (and any other active
   marketing workflow in the sub-account) — must happen before any further step in those
   workflows can execute. If the contact is mid-wait in the review-request sequence when
   this fires, removal must pre-empt the next queued send.
7. (Optional, recommended) Internal task/notification to the client: "contact opted out
   via SMS" — internal visibility only, never a further customer-facing message.

## Trigger 2 — Email unsubscribe

- **Contact Unsubscribed** (email) — GHL's built-in unsubscribe element/merge tag in
  every email template (see `agency/ghl/snapshot-spec.md` §6) automatically sets the
  contact's Email DND when clicked; this trigger fires on that event.

### Actions (email unsubscribe path)

1. Set contact **DND: Email = true**. (GHL may set this automatically on unsubscribe
   click — verify in UI — but the workflow should set it explicitly too, so behaviour
   does not depend on an assumption about a default.)
2. Add tag `opted-out`.
3. Set custom field `Review Request Status` = `Opted Out`.
4. Set custom field `Opt-Out Date` = now.
5. Set custom field `Opt-Out Channel` = `Email`.
6. **Remove contact from workflow: `Review Request Sequence`** (and any other active
   marketing workflow).
7. (Optional) Internal task/notification, as above.

---

## Scope of suppression

Unsubscribing/STOPping on one channel is treated as a full opt-out from the **review
request programme**, not just that one channel: both Triggers 1 and 2 add the same
`opted-out` tag and set `Review Request Status` = `Opted Out` regardless of which channel
the opt-out arrived on, and Step 6 removes the contact from the review-request workflow
entirely. (DND itself is only set on the channel the opt-out arrived on, per GHL's
model, but the tag/status/removal ensure the customer is not re-asked on the *other*
channel either — a contact who texts STOP does not then get an "are you sure" review
email the next week.)

## Permanence (GDPR-4 / PECR-3)

- The `opted-out` tag is **never removed**, and DND set by this workflow is **never
  manually cleared**, for as long as the contact record exists.
- A contact who is `opted-out` must **never** be re-added to the `Review Request
  Sequence` workflow, even for a genuinely new transaction. If the client re-engages the
  customer commercially, the *review-request* programme specifically remains suppressed
  for that contact indefinitely — this is a suppression-list record, not a preference
  that lapses.
- Retention: the opt-out record itself (`opted-out` tag, `Opt-Out Date`, `Opt-Out
  Channel`, DND state) is kept indefinitely as a suppression-list entry even where other
  contact data is later deleted per the retention schedule — see
  `agency/compliance/retention-schedule.md`. Do not build any automated process that
  clears these fields.

## Audit trail

- `Opt-Out Date` and `Opt-Out Channel` on the contact record are the primary audit
  fields — timestamped, per-contact, exportable via GHL contact export.
- The original STOP reply / unsubscribe click is retained in GHL's native
  Conversations/activity log for that contact — do not delete conversation history for
  opted-out contacts; it is the evidentiary record that the opt-out was honoured
  immediately (PECR-3).
- Recommend a monthly export of all contacts with tag `opted-out` (date, channel) into
  the client's compliance file, cross-checked against `agency/ops/monthly-reporting-template.md`
  opt-out rate reporting.

## Compliance summary for this file

- PECR-2: relies on the STOP line / unsubscribe element being present in every template
  (enforced in `agency/campaigns/`) so this workflow always has a trigger to catch.
- PECR-3: DND set + tag added + removal from all pending review-request steps, on both
  triggers, before any further message can send.
- GDPR-4: suppression record retained indefinitely; never re-added.
