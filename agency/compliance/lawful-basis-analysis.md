# Lawful Basis Analysis — Review-Request Processing

> **LEGAL-1 disclaimer:** This is a template for information purposes, not legal advice.
> Have a solicitor review it before use.

**Prepared for:** [Client Business Name] ("the Client")
**Prepared by:** [Agency Name] ("the Agency")
**Date:** [Date]
**Status:** Template — complete all [bracketed] fields and have a solicitor review before
relying on this analysis.

---

## 1. Purpose of this document

This document records, for each processing operation involved in running compliant
review-request campaigns on GoHighLevel, the UK GDPR lawful basis relied upon and the
PECR basis (where the processing involves electronic direct marketing). It should be
kept on file by the Client as evidence of "accountability" under UK GDPR Article 5(2),
and updated whenever the Client's processing changes.

---

## 2. Processing operations table

| # | Processing operation | Personal data involved | UK GDPR Article 6 basis | PECR basis (if direct marketing) | Notes / conditions |
|---|---|---|---|---|---|
| 1 | Sending an SMS/email review request to a customer | Name, mobile number and/or email, transaction date, service purchased | Legitimate interests (Art. 6(1)(f)) — see LIA §3 below | Soft opt-in (PECR reg. 22(3)) **or** prior consent — see decision tree §4 | Soft opt-in requires all four limbs (PECR-1) to be met; if any limb fails, prior consent is required instead |
| 2 | Storing the customer's contact details and consent-basis record in GoHighLevel | Name, mobile/email, consent basis, date/method of capture | Legitimate interests (Art. 6(1)(f)), and legal obligation (Art. 6(1)(c)) insofar as records must be kept to demonstrate compliance | N/A (storage, not marketing) | Data stored on GHL sub-processor infrastructure — see `dpa-template.md` for processor terms and international-transfer position |
| 3 | Logging opt-outs / STOP replies / unsubscribe clicks | Name, mobile/email, opt-out date/method | Legal obligation (Art. 6(1)(c)) — PECR reg. 22/23 compliance; legitimate interests in maintaining a reliable suppression list | N/A | Suppression records are the one category kept **indefinitely** — see `retention-schedule.md` (GDPR-4) |
| 4 | Sending follow-up review requests (2nd/3rd message in the sequence) | As row 1 | Legitimate interests (Art. 6(1)(f)) | Same basis as the initial message (soft opt-in or consent) — the basis is not re-assessed per message, but the opt-out right applies to every message | Frequency capped per `.claude/skills/build-agency/references/uk-compliance-checklist.md` TONE-1: initial + 2 follow-ups maximum, quiet hours 08:00–20:00 UK time |
| 5 | Publishing/aggregating review outcomes for the Client's reporting (star rating trend, review count) | Aggregated review metadata (not typically special-category data) | Legitimate interests (Art. 6(1)(f)) | N/A | Must never involve incentivised or gated collection — see `dmcc-review-policy.md` |

**[Client to add/adapt rows for any processing operation specific to their business —
this table is not exhaustive.]**

---

## 3. Legitimate Interests Assessment (LIA) template

Complete this LIA for the "sending review requests" processing operation (row 1 above).
A documented LIA is required whenever legitimate interests (Art. 6(1)(f)) is relied upon.

### 3.1 Purpose test

- **What is the legitimate interest?** [E.g. "Building [Client Business Name]'s public
  reputation and gathering genuine customer feedback by inviting past customers to leave
  an honest Google review."]
- **Is the interest genuine and specific, or vague/speculative?** [Answer]
- **Whose interest is it?** The Client (data controller); indirectly, the Agency as
  processor providing the automation.
- **What is the benefit to the Client of the processing?** [Answer]
- **Would the processing also benefit third parties (e.g. future customers reading
  honest reviews)?** [Answer]

### 3.2 Necessity test

- **Is sending a review request the least intrusive way to achieve the purpose?**
  [Answer — e.g. a single, capped, opt-out-respecting message sequence is proportionate.]
- **Could the purpose be achieved without processing personal data, or with less data?**
  [Answer]

### 3.3 Balancing test

- **Would the customer reasonably expect this processing?** [Consider: was the review
  request flagged at the point of sale? Is it a "similar" ask to the original
  transaction?]
- **What is the nature of the data?** Ordinary contact data — not special-category data.
- **Could the processing cause unwarranted harm or distress?** [Consider frequency cap,
  quiet hours, and the immediate, no-questions-asked opt-out as mitigations.]
- **What safeguards are in place?**
  - Frequency cap: initial request + maximum 2 follow-ups per transaction (TONE-1).
  - Quiet hours: sends only 08:00–20:00 UK time (TONE-1).
  - Immediate opt-out actioned before any further message can send (PECR-3).
  - No sale, rental, or third-party use of the contact data beyond the review-request
    purpose.
- **Outcome:** [State whether the Client's interest is judged to override the individual's
  rights/interests, or not. If not, consent must be obtained instead of relying on
  legitimate interests/soft opt-in.]

**LIA completed by:** [Name/role] **Date:** [Date] **Review date:** [Date + 12 months, or
sooner if processing changes]

---

## 4. PECR decision tree — consent vs soft opt-in

Use this decision tree for **every** category of contact the Client intends to send a
review request to. Per PECR-5, treat sole traders and non-limited partnerships as
individual subscribers unless independently verified as a limited company — apply the
same tree to them as to consumers.

```
START: Do you want to send an SMS or email asking this contact for a review?
  |
  v
Q1. Did you obtain the contact's details directly, in the course of a sale
    or negotiation for a sale of a product/service to them?
    (Not from a purchased list, a broker, or a third party.)
  NO  -> Prior CONSENT required (freely given, specific, informed, unambiguous,
         and recorded). Do not rely on soft opt-in.
  YES -> continue to Q2
  |
  v
Q2. Is the review request about your OWN similar products/services
    (i.e. not a different, unrelated business or an unrelated product line)?
  NO  -> Prior CONSENT required.
  YES -> continue to Q3
  |
  v
Q3. Was the contact given a simple, free means to refuse/opt out
    AT THE TIME their details were collected (limb (d), part 1)?
  NO  -> Soft opt-in NOT available. Prior CONSENT required (or fix the sale/booking
         process going forward to offer opt-out at collection).
  YES -> continue to Q4
  |
  v
Q4. Will every review-request message ALSO offer a simple, free
    opt-out (limb (d), part 2 — e.g. "Reply STOP", unsubscribe link)?
  NO  -> Fix the message templates before sending. This is a hard requirement
         (PECR-2) regardless of basis.
  YES -> All four soft opt-in limbs are met.
  |
  v
RESULT: SOFT OPT-IN available (PECR reg. 22(3)). Record the basis as
"Soft opt-in" in the GHL "Review Consent Basis" custom field, with the date
and transaction reference — see `pecr-consent-flow.md`.
```

**All four limbs (recap, per PECR-1):**
(a) the recipient is the sender's own customer;
(b) contact details were collected in the course of a sale (or negotiations for one) of a
product or service;
(c) the message concerns the sender's own **similar** products/services only;
(d) a simple, free opt-out was offered both when details were collected **and** in every
subsequent message.

### 4.1 Sole traders and non-limited partnerships (PECR-5)

Sole traders and non-limited (unincorporated) partnerships are **individual
subscribers** under PECR, not corporate subscribers — the same rules as for consumers
apply to them by default. Only treat a contact as a "corporate subscriber" (outside PECR
reg. 22's individual-subscriber protection) where the Client has independently verified
the contact is a limited company or LLP, not merely because the transaction was
"business-to-business" in character. When in doubt, apply the individual-subscriber
rules — this is the harness's conservative default and should not be relaxed without
solicitor advice.

### 4.2 What is NOT a valid basis

- A bought-in or broker-sourced contact list — soft opt-in never applies to third-party
  lists, regardless of how the list was described to the Client.
- Implied consent inferred from silence, a pre-ticked box, or general terms and
  conditions the customer did not affirmatively engage with.
- Treating a B2B-flavoured transaction as exempt from PECR merely because the customer
  is "trade" — see §4.1.

---

## 5. Solicitor review points

- [ ] Confirm the LIA outcome in §3.3 for this specific Client's customer base and sector.
- [ ] Confirm whether any of the Client's processing operations involve special-category
      data (e.g. health data implied by a review of a medical/dental service) requiring an
      Article 9 condition in addition to Article 6.
- [ ] Confirm current ICO guidance wording on review requests as direct marketing (see
      `agency/compliance/legal-research-notes.md` §2 — sourcing gap flagged, ICO pages
      blocked direct fetch in research).
