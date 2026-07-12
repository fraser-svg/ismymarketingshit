# Client Onboarding Checklist

**Pre-kickoff phase.** Complete all steps in order before any customer data enters GoHighLevel. Each step is tied to the compliance rule it satisfies.

---

## Phase 1 — Legal & Regulatory (Complete Before Any Data Import)

- [ ] **Service Agreement signed by both parties** [GDPR-2, LEGAL-1]
  - Use template: `agency/legal/service-agreement-template.md`
  - Both agency and client must sign.
  - Confirms client obligations (truthful contact capture, lawful basis evidence).

- [ ] **Data Processing Agreement (DPA) signed by both parties** [GDPR-2, LEGAL-1]
  - Use template: `agency/compliance/dpa-template.md`
  - Must be executed before ANY customer contact data enters GHL.
  - Includes Article 28(3) mandatory clauses, sub-processors, breach notification, international transfer terms.

- [ ] **Client confirms ICO registration requirement** [GDPR-5, LEGAL-1]
  - Both agency and client must assess whether they need to pay the ICO annual data protection fee.
  - Direct client to: `agency/compliance/ico-registration-note.md`
  - Confirm in writing who pays (usually both).
  - Note: Tier 3 clients are most likely to already be registered; confirm this does not excuse them from the fee.

- [ ] **Client has updated their privacy notice** [GDPR-3, LEGAL-1]
  - Client must update their own privacy notice to disclose review-request processing.
  - Use template insert: `agency/compliance/privacy-notice-template.md`
  - Confirm the updated notice covers: purposes (review requests), basis (consent or soft opt-in), processors (GHL), retention, right to object.
  - Ask client for a copy of the updated notice for your records.

---

## Phase 2 — Consent Basis Audit (PECR-1 Compliance Gate)

- [ ] **Obtain client's contact list** (CSV or similar)
  - Minimum columns: Name, Phone, Email, Date captured, Consent basis (if recorded).

- [ ] **Audit every contact for lawful basis** [PECR-1]
  - **Rule:** Only import contacts with a recorded lawful basis (consent or soft opt-in under PECR-1).
  - Review each contact's consent entry:
    - **If consent recorded:** Proceed to import.
    - **If soft opt-in basis:** Confirm all four limbs are met (client is sender, details collected at point of sale, product/service is same/similar, opt-out was offered at capture and in every prior message).
    - **If no basis recorded:** **Do not import.** Flag to client; require explicit consent capture or evidence of soft opt-in before proceeding.
  - Document the audit result (number of contacts eligible, number excluded with reason).

- [ ] **Agree consent-basis field mapping** [PECR-1]
  - Confirm how the `Review Consent Basis` custom field will be populated (consent or soft-opt-in).
  - For soft opt-in: client must be able to articulate the four limbs if audited.
  - Record the mapping for your records.

---

## Phase 3 — Technical Setup

Follow the click-by-click steps in `agency/ghl/setup-guide.md`, Parts A–D:

- [ ] **Sub-account created and configured** [GDPR-2, PECR-2, TONE-1]
  - Sub-account named after client business.
  - Snapshot loaded (if using a pre-built template).
  - Custom fields, tags, pipeline, workflows created or verified.
  - Time zone set to Europe/London.

- [ ] **Custom values populated** [PECR-2, DMCC-2]
  - `business_name` — client's legal business name.
  - `google_review_link` — direct link to client's Google review form (same link for all eligible contacts).
  - `sms_sender_number` — UK long virtual number (provisioned in next step).
  - `business_contact_email` — client's support/reply-to email.

- [ ] **UK long virtual number (LC Phone) provisioned** [PECR-2, PECR-4, TONE-1]
  - Each sub-account has its own +44 long number.
  - Confirm number is active and can receive STOP replies.
  - Update `sms_sender_number` custom value with the provisioned number.

- [ ] **Google Business Profile connected** [DMCC-2]
  - GHL connected to client's GBP via OAuth.
  - Confirm recent reviews are visible in GHL dashboard.

- [ ] **Contacts imported** [PECR-1, GDPR-2]
  - Only contacts with recorded consent basis.
  - Custom field `Review Consent Basis` set to `consent` or `soft-opt-in` for each contact.
  - Custom field `Review Consent Date` populated (date consent was captured).
  - Use GHL's bulk-import and bulk-edit features to minimize manual entry.

- [ ] **SMS & Email templates loaded** [PECR-2, DMCC-2, TONE-1, TONE-2]
  - All templates (initial + 2 follow-ups, SMS & email) imported from `agency/campaigns/`.
  - SMS templates include STOP instruction at end.
  - Email templates include unsubscribe element.
  - All templates use `{{custom_values.business_name}}` and `{{custom_values.google_review_link}}` identically (no branching).

- [ ] **Workflows built and published** [PECR-1, PECR-3, DMCC-2, TONE-1, TONE-2]
  - `Review Request Sequence` — sends initial + 2 follow-ups with eligibility gates.
  - `Opt-Out Handling` — immediate suppression on STOP/unsubscribe.
  - Both tested and active.

---

## Phase 4 — Go-Live Checks

- [ ] **Consent basis audit results reviewed** [PECR-1]
  - Confirm the audit from Phase 2 is complete and documented.
  - Note any exclusions or flag contact records for client review.

- [ ] **Test send to yourself** [PECR-2, DMCC-2]
  - Create a test contact (your phone + email).
  - Set `Review Consent Basis` = `consent`, `Review Request Status` = `Not Started`.
  - Tag with `job-completed` to trigger workflow.
  - Receive and verify:
    - SMS with business name, review link, STOP instruction.
    - Email with business name, review link, unsubscribe link.
    - Correct reply-to address.
    - No typos or broken merge fields.
  - Delete test contact after verification.

- [ ] **Opt-out workflow test** [PECR-3]
  - Send a test STOP reply to the provisioned number.
  - Confirm the Opt-Out Handling workflow triggers immediately.
  - Verify test contact is marked DND (SMS) and tagged `opted-out`.
  - Confirm `Review Request Status` = `Opted Out` and `Opt-Out Date` is set.

- [ ] **Verify time zone and quiet hours** [TONE-1]
  - Sub-account time zone set to Europe/London (not UTC).
  - Quiet hours (if set per-action or account-wide) = 08:00–20:00 Europe/London.
  - Confirm any messages sent outside this window queue for next in-window slot.

- [ ] **Privacy notice re-confirmed** [GDPR-3]
  - Ask client to share the updated privacy notice (again, from Phase 1).
  - Spot-check that review-request processing, basis, and retention are disclosed.

- [ ] **Service agreement and DPA re-confirmed** [GDPR-2]
  - Both signed and dated.
  - File copies for your records.

- [ ] **ICO fee status confirmed** [GDPR-5]
  - Confirm which party is paying (or if both).
  - If client is responsible, note the payment date/proof (not agency's responsibility to verify, but good to confirm).

---

## Phase 5 — First-Week Monitoring

- [ ] **Workflow activity checked (Day 1–2)** [PECR-1, PECR-3, TONE-1]
  - Log into client sub-account.
  - Go to each workflow's activity/analytics page.
  - Confirm messages are triggering and sending (look for completed steps).
  - Check for any error messages (SMS delivery failures, email bounces).

- [ ] **Delivery rate spot-checked** [PECR-2]
  - Sample a few sent messages in GHL conversation log.
  - Confirm delivery status (delivered, bounced, queued).
  - If any bounces or failures, diagnose (bad phone format, carrier issues, quiet hours) and inform client.

- [ ] **Opt-outs monitored** [PECR-3, GDPR-4]
  - Check for any STOP replies or email unsubscribes in first week.
  - Confirm Opt-Out Handling workflow is triggering.
  - Verify contacts are immediately DND + tagged `opted-out`.

- [ ] **Reply-detection working** (if used) [DMCC-2]
  - If client is auto-detecting reviews via reply heuristic, spot-check a reply.
  - Confirm `review-left` tag is applied correctly.

- [ ] **Client notified of go-live status**
  - Summarize: total contacts enrolled, messages sent in first week, any issues, next steps (monthly reporting cadence).
  - Share instructions for ongoing use (`agency/ghl/setup-guide.md` Step 23–24).

---

## Sign-Off

- [ ] Agency owner/operator signature: _________________________ Date: _______
- [ ] Client contact: _________________________ Date: _______

**Notes / Issues:**

[Use this space to document any deviations, exclusions, or known issues for the client file.]
