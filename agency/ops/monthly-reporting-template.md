# Monthly Reporting Template

**For:** [Client Name]  
**Period:** [Month/Year]  
**Prepared by:** [Agency name]  
**Report date:** [Date]

---

## Section 1 — Key Performance Indicators (KPIs)

| Metric | Count | Notes |
|---|---|---|
| **Review requests sent** | — | Total SMS + email initial + follow-up messages sent this month |
| **Messages delivered** | — | Delivery rate (delivered ÷ sent); flag any significant bounces |
| **Reviews gained** | — | New reviews left on client's Google Business Profile this month |
| **Average rating** | — | Current average rating; trend vs. previous month (e.g. ↑ 4.6 from 4.5) |
| **Opt-out rate** | — | Percentage of enrolled contacts who opted out (total opt-outs ÷ total contacted) |
| **Complaints received** | — | Number of complaints via email/phone (see incident log below) |

**KPI Notes:**  
[Add any context: seasonal trends, issues, notable results, etc.]

---

## Section 2 — Compliance Attestations

Each statement below is certified for the reporting period. Reference the compliance rules in brackets.

- [ ] **Quiet hours respected** [TONE-1]  
  All SMS messages sent between 08:00 and 20:00 UK time (Europe/London).  
  Any messages queued outside these hours were delivered in the next in-window slot.

- [ ] **Zero gating / no sentiment screening** [DMCC-2]  
  Every eligible contact (consent basis recorded, not DND, not already asked for this transaction) received the same public review invitation. No customers were routed away based on estimated sentiment, NPS score, or likelihood to leave a positive review. No alternate "feedback form" path replaced the public Google review ask.

- [ ] **Zero incentivised reviews** [DMCC-1]  
  No customer was offered, promised, or given any discount, prize draw entry, refund, or payment in exchange for leaving a review or in exchange for its removal.

- [ ] **All opt-outs actioned immediately** [PECR-3, GDPR-4]  
  Every STOP SMS reply and every email unsubscribe click triggered the Opt-Out Handling workflow within [X] seconds. Opted-out contacts were immediately marked DND and removed from pending review-request steps. No opted-out contact received a further message after opting out.

- [ ] **No re-contacts after opt-out** [PECR-3, GDPR-4]  
  No contact tagged `opted-out` was re-enrolled in the Review Request Sequence workflow, even for genuinely new transactions. The suppression list is permanent.

---

## Section 3 — Incident Log

Record any complaints, opt-outs with context, or unusual activity below. Cross-reference with the GHL incident log exported at month-end.

| Date | Channel | Contact | Issue | Resolution | Rule |
|---|---|---|---|---|---|
| [date] | SMS/Email | [phone/email] | [e.g. "complaint: too many messages"] | [action taken] | [PECR-3, GDPR-3, etc.] |

**No incidents this period?** Note: "None"

---

## Section 4 — Narrative Summary

**Bullet points only; keep to ~100–150 words.**

- Overall review request volume and delivery health this month
- Standout metrics (e.g. opt-out rate lower than expected, higher review volume this period)
- Any technical issues (e.g. SMS delivery delays, workflow hiccups)
- Action items for next month (e.g. list refreshes, workflow tweaks)
- Compliance posture (any red flags, or confirmation of full compliance)

**Example:**

> This month we sent 847 review requests (initial + follow-ups) across SMS and email, with a 96% delivery rate. Seven reviews were gained (avg rating 4.7, up from 4.6). Opt-out rate was 1.2%, well within normal range. Quiet hours were respected throughout; no compliance incidents. Next month we plan to refresh the contact list with new job completions from [date forward].

---

## Section 5 — Attestation

I confirm that the above KPIs and compliance attestations are accurate and reflect the agency's records for this reporting period. [GDPR-4]

**Agency signature:** _________________________ Date: _______

---

## Data Retention & Audit Trail

### Required exports at month-end (retain in client file):

1. **Contact report** — All contacts with `Review Request Status` (shows pipeline progression)
2. **Opt-out list** — All contacts tagged `opted-out`, including `Opt-Out Date` and `Opt-Out Channel` [GDPR-4, PECR-3]
3. **Message log** — Delivery status (sent, bounced, queued) for all SMS/email [GDPR-4]
4. **Workflow activity log** — Steps executed, timestamps [GDPR-4]

**Retention:** Keep these exports for the client file for [client-agreement-specified period], minimum 1 year.

---

## Template Notes

- Replace [date], [Client Name], etc. with actual values each month.
- The KPI table and incident log are meant to be filled in with real data; do not submit a template with blank rows unless there were truly no incidents.
- Compliance attestations (Section 2) are checkbox confirmations; check each box if true, or note exceptions/issues if any failed.
- Share this report with the client by [date specified in service agreement]; typically within 5–10 working days of month-end.
