# GHL Snapshot Spec — "Review Automation UK"

One GoHighLevel **snapshot** built once by the agency and loaded into every new client
**sub-account**. It contains every structural element below except the phone number and
the Google Business Profile connection, which are per-client and configured manually at
onboarding (see `agency/ghl/uk-phone-sms-settings.md` and `agency/ghl/setup-guide.md`).

This spec is the single source of truth for field/tag/custom-value **names**. Every other
`agency/ghl/**` file references these names exactly; do not rename anything here without
updating the workflow files and setup guide.

---

## 1. Sub-account structure

- **One client business = one sub-account** (one location). Multi-location clients (Tier
  3) get one sub-account per location, each loaded from this same snapshot, each with its
  own phone number, GBP connection, and custom-value values (see below) — structure and
  logic are identical across locations; only the per-location values differ.
- Snapshot contents loaded into each sub-account:
  - Custom fields (Section 2)
  - Custom values, empty/placeholder (Section 3) — filled in per client at onboarding
  - Tags (Section 4)
  - Pipeline + stages (Section 5)
  - Templates (Section 6) — email/SMS bodies live in `agency/campaigns/`, imported here
  - Workflows: `agency/ghl/workflows/review-request-sequence.md`,
    `agency/ghl/workflows/opt-out-handling.md`
- **Not** included in the snapshot (must be set up per sub-account, manually, at
  onboarding — flagged "verify in GHL UI"):
  - The UK long virtual number (LC Phone numbers are provisioned per sub-account, not
    portable via snapshot).
  - The Google Business Profile / Reputation Management connection.
  - Custom value *values* (business name, review link, sender number — the snapshot
    carries the custom value *definitions* only).

---

## 2. Custom fields

| Field name | Type | Values / format | Purpose |
|---|---|---|---|
| `Review Consent Basis` | Dropdown (single select) | `consent`, `soft-opt-in` | PECR-1 lawful basis for sending this contact a review request. Must be set before the review-request workflow will send (see eligibility check). Empty = not eligible. |
| `Review Consent Date` | Date | ISO date | When the consent basis above was captured. Evidence for PECR-1/GDPR-4 audit trail. |
| `Review Request Status` | Dropdown (single select) | `Not Started`, `Requested`, `Follow-up 1 Sent`, `Follow-up 2 Sent`, `Review Left`, `Opted Out` | Drives the "not already asked for this transaction" eligibility check (TONE-1) and the pipeline stage. Reset to `Not Started` only when a genuinely new, separate transaction begins (see review-request-sequence.md dedupe note). |
| `Last Job Completed Date` | Date | ISO date | Date of the transaction the current review request relates to. Used to detect a new transaction (a later date than the one on record when `Review Request Status` was last set) so a repeat customer can be legitimately asked again for a *new* job, without re-asking for the same one. |
| `Job Reference` | Text | Free text / invoice or job ID | Optional but recommended: ties a request cycle to one transaction, so status resets are auditable and defensible if a client asks "why did this customer get asked twice". |
| `Opt-Out Date` | Date/time | ISO datetime | When a STOP reply or unsubscribe click was received. PECR-3 / GDPR-4 audit trail. |
| `Opt-Out Channel` | Dropdown (single select) | `SMS`, `Email`, `Phone` | Which channel the opt-out arrived on. Audit trail. |

## 3. Custom values

Per-sub-account variables, defined empty in the snapshot, filled in per client during
onboarding, used as merge fields in every SMS/email template.

| Custom value | Example content | Used for |
|---|---|---|
| `{{custom_values.business_name}}` | "Riverside Plumbing Ltd" | Sender identity in every message (PECR-2). |
| `{{custom_values.google_review_link}}` | `https://search.google.com/local/writereview?placeid=...` | The public review ask — the same link for every eligible contact (DMCC-2). See `agency/campaigns/google-review-link-guide.md`. |
| `{{custom_values.sms_sender_number}}` | The client's UK long virtual number, human-readable | Reference in setup docs and staff training; not itself inserted into message bodies (the number is the sending number, not template text). |
| `{{custom_values.business_contact_email}}` | "hello@riversideplumbing.co.uk" | Reply-to / support contact shown in email footer, alongside the unsubscribe link. |

## 4. Tags taxonomy

| Tag | Meaning | Set by |
|---|---|---|
| `job-completed` | A transaction has finished and the contact is a candidate for a review request. | Client's own process (manual tag, or pipeline automation upstream of this snapshot) — the workflow trigger. |
| `review-requested` | Initial SMS + email sent. | review-request-sequence workflow, Step 2. |
| `review-followup-1-sent` | Follow-up 1 sent. | review-request-sequence workflow. |
| `review-followup-2-sent` | Follow-up 2 sent. | review-request-sequence workflow. |
| `review-left` | Goal event — contact has left a review (or confirmed doing so). Stops all remaining steps. | Manually by staff, or by reply-detection heuristic — flag "verify in GHL UI" for any automatic detection method, since GHL cannot itself confirm a Google review was posted. |
| `opted-out` | Contact has STOPped or unsubscribed. Permanent. | opt-out-handling workflow. Never removed. |

## 5. Pipeline + stages

**Pipeline name:** `Review Automation`

| Stage | Entered when |
|---|---|
| `Job Completed` | Trigger tag `job-completed` added / contact enters the workflow. |
| `Review Requested` | Initial SMS + email sent (`Review Request Status` = `Requested`). |
| `Follow-Up Sent` | Either follow-up sent (`Review Request Status` = `Follow-up 1 Sent` or `Follow-up 2 Sent`). |
| `Review Left` (won) | Goal event fires — tag `review-left` added. |
| `Opted Out` (lost) | Opt-out workflow fires — tag `opted-out` added. |

The pipeline is a reporting/visibility layer over the same statuses already tracked in
`Review Request Status`; it must never introduce a branch not present in the workflow
logic (no "Unhappy" or "Negative" stage — that would be a DMCC-2 gating risk surfaced in
the pipeline rather than the workflow).

## 6. Template inventory

Copy is authored by the campaign-copywriter in `agency/campaigns/`; this snapshot defines
the **slots** each template fills and where it is used. Every slot below is used
identically for every eligible contact (DMCC-2) — there is no alternate version for any
segment of customers.

| Template slot | Channel | Used in | Source copy |
|---|---|---|---|
| Initial review request | SMS | review-request-sequence, Step 2 | `agency/campaigns/sms-sequence.md` |
| Initial review request | Email | review-request-sequence, Step 3 | `agency/campaigns/email-sequence.md` |
| Follow-up 1 | SMS | review-request-sequence, Step 7 | `agency/campaigns/sms-sequence.md` |
| Follow-up 1 | Email | review-request-sequence, Step 7 | `agency/campaigns/email-sequence.md` |
| Follow-up 2 | SMS | review-request-sequence, Step 10 | `agency/campaigns/sms-sequence.md` |
| Follow-up 2 | Email | review-request-sequence, Step 10 | `agency/campaigns/email-sequence.md` |

Every SMS template must end with an opt-out instruction and every email template must
carry the platform unsubscribe element (PECR-2) — enforced in the copy files, verified
again at the workflow level in `opt-out-handling.md`.

Internal feedback capture (optional, additive only per DMCC-2) is out of scope for this
snapshot's default build; if a client wants it, it must be added as a **separate**
message sent in addition to — never instead of, and never gating — the public review
ask above. Flag as "verify in GHL UI" / custom build if requested.
