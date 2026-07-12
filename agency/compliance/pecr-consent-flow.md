# PECR Consent / Soft Opt-In Capture Flow

> **LEGAL-1 disclaimer:** This is a template for information purposes, not legal advice.
> Have a solicitor review it before use.

**Applies to:** [Client Business Name]
**Purpose:** How the lawful basis for sending review-request messages is captured at the
point of sale, how it is recorded in GoHighLevel, and how long the evidence is kept.

---

## 1. Capturing the basis at the point of sale

The Client (not the Agency) is the sender of record and must capture the basis at the
moment the customer's contact details are first collected — booking, invoicing, checkout,
or job completion, depending on the Client's business.

### 1.1 Soft opt-in wording (PECR reg. 22(3), all four limbs — see
`lawful-basis-analysis.md` §4)

Use wording of this kind wherever contact details are collected (booking form, invoice
footer, till receipt, checkout screen). Adapt to the Client's actual channel — the
substance (notice + free opt-out) must survive adaptation:

> "We'll send you a short message after your [service/appointment/job] to ask how it
> went and, if you're happy to, invite you to leave a Google review. We won't use your
> details for anything else. Don't want these messages? Tick here [ ] or tell a member
> of staff / reply STOP to any message at any time."

Key requirements reflected in the wording:
- Identifies the sender (the Client's business name).
- States the **specific** purpose (review request), not a vague "marketing" catch-all.
- Offers the opt-out **at the point of collection**, not only later.
- Is a genuinely free, no-detriment choice — ticking the opt-out box must not affect the
  service being bought.

### 1.2 Prior consent wording (where soft opt-in limbs are not met — e.g. contact
details did not come from a direct sale, or the request would cover dissimilar
services)

> "May we send you a short message asking for your feedback and, if you're willing, a
> Google review? We'll only do this if you tick yes below, and you can withdraw this at
> any time by replying STOP or contacting us."
> [ ] Yes, I'm happy to receive a review request by [SMS/email].

Consent must be an unticked, opt-in checkbox (never pre-ticked), specific to the review
request purpose, and separate from any other consent (e.g. general marketing) the Client
seeks.

### 1.3 What must NOT be done

- No pre-ticked consent boxes.
- No bundling review-request consent with an unrelated consent or with acceptance of the
  Client's general terms of service.
- No collecting the opt-out preference but failing to configure it in GoHighLevel before
  the first message is sent (see §2).

---

## 2. Recording the basis in GoHighLevel

Every contact who may receive a review request must have the basis recorded against
their contact record before the review-request workflow can trigger for them.

### 2.1 Custom field: `Review Consent Basis`

Create a custom field on the Contact object named **`Review Consent Basis`** (single
option / dropdown) with the following permitted values (exact casing per
`agency/ghl/snapshot-spec.md` §2 / `agency/ghl/setup-guide.md` Step 2 Field 1 — this file
does not define the field independently; those are the single source of truth):

| Value | Meaning |
|---|---|
| `soft-opt-in` | All four PECR-1 limbs met at point of collection (§1.1) |
| `consent` | Explicit opt-in consent captured (§1.2) |
| *(left empty)* | No basis yet recorded — **must** block the review-request workflow trigger. There is no separate "default" option value; an unset field is simply empty. |

The field has no "opted out" option — opt-out status is **not** recorded as a value of
`Review Consent Basis`. It is tracked separately via the `opted-out` tag and the
`Review Request Status` field being set to `Opted Out`, applied by the
`agency/ghl/workflows/opt-out-handling.md` workflow. `Review Consent Basis` records only
the original lawful basis for the message programme and is not overwritten or cleared
when a contact later opts out — retained per §3 below.

The review-request workflow's eligibility check (see
`agency/ghl/workflows/review-request-sequence.md`, Step 0) must require `Review Consent
Basis` to be not empty (i.e. equal to `consent` or `soft-opt-in`) — a contact left empty
must never receive a message.

### 2.2 Supporting fields to capture alongside the basis

Only fields actually defined in `agency/ghl/snapshot-spec.md` §2 (and built in
`agency/ghl/setup-guide.md` Step 2) are used as the GHL evidence trail:

- `Review Consent Date` — date/time the basis was captured.
- `Job Reference` — the invoice/job/booking reference the request cycle (and, where
  soft opt-in is relied on, the sale) is anchored to. Use this existing field for the
  transaction reference — evidences limb (b) of the soft opt-in test (details collected
  in the course of a sale) — rather than a separate "transaction ref" field.

The specific point-of-collection channel (booking form, invoice checkbox, till receipt,
checkout screen) is **not** itself stored as a GHL custom field. Where the Client needs to
evidence *which* wording/channel was used for a given contact's consent capture, this must
be kept in the Client's own records (e.g. a dated, archived copy of the booking form,
invoice footer, or checkout screen text in force on the date recorded in `Review Consent
Date`) — external to GoHighLevel — as supporting evidence should the lawfulness of a
specific message be challenged. [Solicitor to confirm whether the Client's record-keeping
for this point needs to be more formalised than "keep a dated copy of the wording in use".]

### 2.3 Workflow-level enforcement

The review-request workflow's trigger/eligibility filter must check `Review Consent
Basis` is not empty (i.e. `consent` or `soft-opt-in`), **and** that the contact is not
suppressed as an opt-out — checked via the `opted-out` tag being absent and `Review
Request Status` not being `Opted Out` (see `agency/ghl/workflows/opt-out-handling.md`) —
in addition to the DND and not-already-asked checks described in
`agency/ghl/workflows/review-request-sequence.md`, Step 0.

---

## 3. Evidence retention (GDPR-4)

- Retain the consent-basis record (fields in §2.2) for as long as the contact remains an
  active customer, **plus [6 years]** after the last transaction, to cover limitation
  periods for any dispute about the lawfulness of a message sent during that
  relationship. [Solicitor to confirm exact period appropriate to the Client's sector.]
- If a contact opts out, retain the opt-out record **indefinitely** on the suppression
  list — do not delete it, even after the underlying customer relationship ends, so the
  Client can demonstrate it never re-contacts a suppressed individual (see
  `retention-schedule.md`).
- Store evidence in a form that can be produced to the ICO or a court if the lawfulness
  of a specific message is challenged — the GHL contact record and field history should
  be treated as the primary evidence store; the Client should not manually delete these
  fields outside the retention schedule.

---

## 4. Solicitor review points

- [ ] Confirm the point-of-sale wording in §1.1/§1.2 fits the Client's actual customer
      journey (booking software, invoicing tool, in-person checkout) without alteration
      to its substantive protections.
- [ ] Confirm the retention period in §3 against the Client's specific limitation-period
      exposure.
- [ ] Confirm whether recording the point-of-collection channel only in the Client's own
      (non-GHL) records, per §2.2, is sufficient evidence, or whether a dedicated GHL
      field should be added for it.
