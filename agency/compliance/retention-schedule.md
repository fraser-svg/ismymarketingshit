# Data Retention Schedule — Review-Request Processing

> **LEGAL-1 disclaimer:** This is a template for information purposes, not legal advice.
> Have a solicitor review it before use.

**Applies to:** [Client Business Name], processed via GoHighLevel by [Agency Name]
(Processor).

This schedule sets defined retention periods for each category of personal data
processed in connection with review-request automation (GDPR-4). It must not be used to
justify indefinite retention of ordinary marketing data "just in case" — every category
below has either a defined end-point or an explicit, justified reason for indefinite
retention.

---

## Retention table

| Data category | Retention period | Justification |
|---|---|---|
| **Active customer contact data** (name, mobile/email, transaction reference) | For the duration of the customer relationship, plus **[6 years]** after the last transaction | Covers the limitation period for contract/consumer disputes during which the lawfulness of a message might reasonably be challenged. [Solicitor to confirm period appropriate to Client's sector — e.g. shorter for high-volume low-value retail, longer where contracts are deeds.] |
| **Consent / soft opt-in basis record** (`Review Consent Basis`, `Review Consent Date`, `Job Reference` — see `pecr-consent-flow.md`) | Same as the contact record above | Evidences the lawful basis for every message sent to that contact; must not be deleted before the underlying contact data, or the Client loses the ability to demonstrate compliance for messages already sent |
| **Message logs** (send date/time, channel, delivery status, message content sent) | **[24 months]** from send date | Sufficient to investigate a complaint or ICO enquiry about a specific message, without indefinitely storing full message history |
| **Opt-out / suppression records** (STOP replies, unsubscribe clicks, DND status and date) | **Indefinite** | Kept forever as a permanent suppression list — this is the one category exempted from time-limited deletion, because deleting an opt-out record risks the contact being re-added and re-messaged, which is itself a compliance failure (PECR-3). Suppression records may be retained even after all other data about the contact has been deleted. |
| **Campaign analytics** (aggregate send counts, delivery rates, review-conversion rates, opt-out rates) | **[36 months]**, then aggregated to fully anonymised summary statistics with no contact-level detail | Supports trend reporting (see `agency/ops/monthly-reporting-template.md`) without indefinitely retaining contact-level detail once no longer operationally needed |
| **Review content/outcome metadata** (star rating, review date, platform) linked to a contact | **[24 months]**, or the same period as the contact record, whichever is shorter | Used for reporting only; the review itself remains published on the third-party platform (Google) independently of the Client's own retention |

---

## Rules

1. **No indefinite retention of ordinary marketing/contact data.** Every category above
   other than the suppression list has a defined end-point.
2. **The suppression list is the sole indefinite-retention category**, and must be kept
   separately identifiable so it survives deletion of the underlying contact record.
3. **Deletion cascades**: when a contact record's retention period expires, delete the
   linked consent-basis record and message logs for that contact at the same time,
   **except** any opt-out/suppression entry, which is preserved indefinitely per the
   table above.
4. **Review this schedule at least annually**, or immediately if UK GDPR/PECR guidance,
   or the Client's own risk profile, changes.

---

## Solicitor review points

- [ ] Confirm the [6 years] active-contact retention period against the Client's actual
      limitation-period exposure (e.g. contract claims are generally 6 years in England
      and Wales, but sector-specific rules may differ).
- [ ] Confirm the message-log and analytics periods are proportionate for the Client's
      transaction volume.
