# Complaint & Opt-Out Handling SOP

**Standard Operating Procedure for the agency** when a customer opts out or complains about review requests. This document defines roles, SLAs, and escalation paths.

---

## 1. Opt-Out Handling — Immediate Response Required

### 1.1 Opt-Out Triggers

An opt-out occurs when:

1. **SMS STOP reply** — Customer texts STOP, STOP ALL, UNSUBSCRIBE, CANCEL, END, QUIT, or similar to the client's UK long virtual number [PECR-3, PECR-2].
2. **Email unsubscribe** — Customer clicks the unsubscribe link in a review-request email [PECR-2, PECR-3].
3. **Manual suppression request** — Customer emails/calls the client or agency directly to opt out [PECR-3].

### 1.2 Agency Response SLA — Within 2 Hours [PECR-3]

**All opt-outs must be processed within 2 hours of detection.**

#### Step 1 — Detect and log

- **SMS STOP:** Detected automatically by Opt-Out Handling workflow in GHL.
- **Email unsubscribe:** Detected automatically by GHL unsubscribe trigger.
- **Manual request:** Agency receives email or phone call from customer or client; log it immediately.

#### Step 2 — Verify the contact in GHL

1. Log into the client sub-account.
2. Search for the contact (by phone or email).
3. Confirm their current `Review Request Status` and consent basis.

#### Step 3 — Apply suppression (automated or manual)

**If SMS STOP or email unsubscribe:**
- The Opt-Out Handling workflow should have already executed automatically. Verify:
  - Contact is marked **DND: SMS** or **DND: Email** (whichever channel they used).
  - Contact is tagged `opted-out`.
  - Custom field `Review Request Status` = `Opted Out`.
  - Custom field `Opt-Out Date` = timestamp of opt-out.
  - Custom field `Opt-Out Channel` = `SMS` or `Email`.
  - Contact is removed from `Review Request Sequence` workflow (check workflow member list).

**If manual suppression request:**
- Manually apply the same steps:
  1. Set DND: SMS = true AND DND: Email = true (to suppress both channels).
  2. Add tag `opted-out`.
  3. Set `Review Request Status` = `Opted Out`.
  4. Set `Opt-Out Date` = now.
  5. Set `Opt-Out Channel` = `Phone` or `Email` (whichever they used to request opt-out).
  6. Remove contact from `Review Request Sequence` workflow.

#### Step 4 — Confirm removal from pending steps [PECR-3]

- Check the `Review Request Sequence` workflow's current members/activity log.
- If the contact has a pending follow-up message queued, it must be **cancelled immediately** (do not allow it to send).
- Verify the contact does not appear in any pending sends.

#### Step 5 — Notify client (if manual opt-out) [GDPR-3]

If the opt-out came via a manual customer request:

- Email the client: "Contact [name/phone] has requested opt-out from review requests. They have been suppressed as of [time]. No further review messages will be sent to them."
- Include the Opt-Out Date and Channel in your notification for their records.

#### Step 6 — Document in audit log [GDPR-4]

- Ensure the opt-out is recorded in your internal incident log (see Section 4 below).
- Export the contact record at month-end as part of the monthly reporting export.

### 1.3 Permanence [PECR-3, GDPR-4]

- **Never remove** the `opted-out` tag.
- **Never manually clear** the DND flag.
- **Never re-enroll** the contact in the Review Request Sequence, even if they become a customer again or a new transaction occurs.
- The opt-out record (tag, Opt-Out Date, Opt-Out Channel, DND state) is retained **indefinitely** as a suppression-list entry, per `agency/compliance/retention-schedule.md`.

---

## 2. Complaint Handling — Escalation Path

### 2.1 Complaint Triggers

A complaint may arrive via:

1. **Direct email/phone to the agency** — "I'm getting too many messages", "Stop contacting me", "This is harassment"
2. **Email/phone to the client business** — Client forwards to the agency
3. **Regulatory complaint** — ICO, CMA, or other regulator contact (rare; see Section 3 below)

### 2.2 Initial Assessment (Within 4 Hours)

When a complaint arrives:

1. **Log it immediately** in your internal incident log (see Section 4).
2. **Categorize it:**
   - **Opt-out request** (e.g. "Stop contacting me") → Follow Section 1 (Opt-Out Handling) above; also send acknowledgment email (see 2.3).
   - **Repeated contact concern** (e.g. "Got the same message twice in one day") → Investigate (see 2.3).
   - **Accuracy/data complaint** (e.g. "You have my old phone number") → Coordinate with client (see 2.3).
   - **Regulatory allegation** (e.g. "This violates my rights") → Escalate immediately (see Section 3 below).

### 2.3 Response — 24-Hour Turnaround [GDPR-3]

**Standard complaint (not regulatory):**

1. **Send acknowledgment email within 4 hours:**
   - Apologize for the inconvenience.
   - Confirm receipt and next steps.
   - **Do NOT promise compensation or refund** (this risks being construed as conditional on review removal — see DMCC-3).
   - Example: "Thank you for contacting us. We have received your request to opt out and are processing it immediately. You should not receive any further messages from [client name]. If you have any further questions, please reply to this email."

2. **Investigate within 24 hours:**
   - Pull the contact record in GHL.
   - Review their message history (SMS/email logs).
   - Check workflow activity (were multiple sends triggered in error?).
   - Verify consent basis and `Review Request Status` field.
   - Check for any known issues (duplicate contact records, campaign errors).

3. **Take corrective action if needed:**
   - **If duplicate record:** Merge or suppress the duplicate.
   - **If workflow error:** Review workflow logs; report to GHL support if technical issue.
   - **If opt-out was delayed:** Confirm suppression is now in place; note the delay as an incident.

4. **Send follow-up email within 24 hours:**
   - Explain what you found (e.g. "Your contact record shows no duplicate; you received an initial SMS on [date] and a follow-up email on [date], which are the expected cadence").
   - Confirm action taken (e.g. "You have been marked as opted-out and will not receive further messages").
   - Provide the client's or agency's contact information for further questions.
   - **Do NOT offer compensation or incentive to remove a negative review** [DMCC-3].

### 2.4 Escalation to Client [GDPR-3]

If the complaint reveals a data issue or breach:

- **Example:** "My contact information is wrong" → Client is the data controller; they must correct their own records.
- **Example:** "I never consented to this" → This is a potential GDPR data subject rights claim (see Section 3.1 below).

Notify the client:

1. Forward the complaint details (anonymized if necessary).
2. Explain which aspect requires the client's action (e.g. "This is a data-correction request that your business must handle").
3. Confirm you have suppressed the contact on your side.
4. Request confirmation that the client has resolved the issue (updated contact info, etc.).

---

## 3. Data Subject Rights Requests

### 3.1 Detecting a Rights Request [GDPR-3]

A data subject may contact the agency or client with requests like:

- "I want a copy of the data you hold on me" (access request)
- "Delete all my data" (erasure request)
- "Stop processing my data" (restriction request)
- "What are you doing with my information?" (more info request)

If phrased as a complaint, it may come in as a "complaint"; always treat any ambiguous request as a potential rights claim.

### 3.2 Agency Role — Processor Assistance [GDPR-3]

**The client (data controller) owns the legal duty to respond to rights requests.**

**The agency (data processor) provides assistance:**

1. **Do not respond directly to the customer** (even if the complaint came to the agency).
2. **Immediately escalate to the client:**
   - Forward the request verbatim or summarized.
   - Confirm: "This is a data subject rights request directed at your business (the data controller). We are assisting as your processor. Please respond within 30 days per UK GDPR."
   - Offer to help (see Step 3 below).

3. **Cooperate with the client's response:**
   - Export contact data (consent records, message logs, opt-out history) from GHL if the client needs it for a subject-access response.
   - Confirm suppression/deletion on the agency's side once the client has decided how to respond.
   - Provide evidence of opt-out or suppression (Opt-Out Date, DND flags, audit trail) to support the client's response.

### 3.3 Escalation (If No Client Response Within 10 Business Days)

If the client does not respond or coordinate within 10 business days:

- Contact the client's nominated contact in the service agreement and DPA.
- Remind them of their 30-day GDPR response deadline.
- Offer to escalate further (e.g. suggest they get legal advice).
- Do not unilaterally delete or modify data without explicit client instruction (you are acting under the client's authority).

---

## 4. Incident Logging and Audit Trail [GDPR-4]

### 4.1 Incident Log Template

Maintain a dedicated spreadsheet or file (e.g. `[Client Name] — Incident Log — [Year].csv` or .xlsx) with the following columns:

| Date | Time | Channel | Contact Identifier | Issue Type | Summary | Action Taken | Resolved? | Date Resolved | Rule(s) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-07-15 | 14:23 | SMS | 07700123456 | Opt-out | STOP reply received | Applied DND, opted-out tag, removed from workflow | Yes | 2026-07-15 | PECR-3, GDPR-4 | Verified removal within 2 hours |
| 2026-07-17 | 09:45 | Email | alice@example.com | Complaint | "Too many emails" | Suppressed; sent explanation | Yes | 2026-07-17 | PECR-3, GDPR-3 | No workflow error found |

### 4.2 Required Fields

- **Date/Time:** When detected (or received, for manual complaints).
- **Channel:** SMS, Email, Phone, or other.
- **Contact Identifier:** Phone or email (anonymized if shared outside the agency; keep the full identifier in your secure file).
- **Issue Type:** Opt-out, Complaint, Rights request, Regulatory, Technical error, etc.
- **Summary:** 1–2 sentences.
- **Action Taken:** What you did (suppressed, escalated, investigated, etc.).
- **Resolved?** Yes/No.
- **Date Resolved:** When action was completed.
- **Rule(s):** Applicable compliance rule IDs (PECR-3, GDPR-3, GDPR-4, DMCC-3, etc.).
- **Notes:** Any follow-up needed, client notification, etc.

### 4.3 Monthly Export and Retention [GDPR-4]

1. **Export at month-end:**
   - Extract all incident log entries for the month.
   - Cross-reference with the opt-out list exported from GHL (contacts tagged `opted-out`).
   - Verify counts match (each STOP/unsubscribe should appear in both the log and the GHL export).

2. **Retain:**
   - Keep the incident log indefinitely (it is evidence of PECR-3 and GDPR-4 compliance).
   - Attach a summary to your monthly report if incidents occurred.
   - Do not delete or alter past entries.

### 4.4 Audit Trail Evidence [GDPR-4]

Preserve:

- **GHL activity logs** — Show workflow triggers, DND status changes, tag additions, timestamps.
- **Conversation history** — SMS replies (STOP) and email unsubscribes remain in GHL's conversation log (do not delete).
- **Contact record export** — Opt-Out Date, Opt-Out Channel, DND status.
- **Email correspondence** — Save copies of complaints, acknowledgments, and escalations to the client.

These form the audit trail that proves opt-outs were honoured immediately (PECR-3) and that data processing was tracked (GDPR-4).

---

## 5. Regulatory Escalation (Rare Cases)

### 5.1 If a Regulator Contacts the Agency

**If you receive contact from the ICO, CMA, or other regulator:**

1. **Do not respond unilaterally.**
2. **Immediately notify the client and your legal advisor.**
3. **Preserve all evidence:** Do not alter, delete, or dispose of GHL records, logs, or email correspondence.
4. **Cooperate with instructions:** Follow guidance from legal counsel and the regulator.

This is a rare event. The compliance design of this agency (consent-basis gating, immediate opt-out, no gating, no incentives) is intended to make such contact unlikely, but it can happen if a complaint is misdirected or a misunderstanding occurs.

---

## 6. Training & Handover

### 6.1 Staff Instructions

Any agency staff handling customer contact must:

- **Never ignore or delay an opt-out.** Process within 2 hours, always.
- **Never re-contact an opted-out customer** for any reason (review or otherwise).
- **Never offer payment, discounts, or refunds to remove a negative review** [DMCC-3].
- **Never tell a customer "if you leave a positive review, we'll..."** [DMCC-1].
- **Escalate any complaint that mentions a regulatory body or legal threat** to the agency owner and legal advisor immediately.

### 6.2 Client Training

As part of onboarding (see `agency/ops/onboarding-checklist.md`), share this document with the client and confirm they understand:

- If a customer replies STOP or unsubscribes, they are automatically suppressed (no manual action needed).
- The client should not try to "correct" a customer's consent or re-enroll them after an opt-out.
- If a customer contacts the client with a complaint or rights request, forward it to the agency immediately.
- The client is the data controller; if a data subject writes to them, the client must respond (the agency assists).

---

## 7. SLA Summary

| Event | SLA | Responsible Party |
|---|---|---|
| SMS STOP / Email unsubscribe detected | 2 hours (automatic via workflow) | Workflow + Agency verification |
| Manual opt-out request received | 2 hours processing | Agency operations |
| Complaint acknowledgment | 4 hours | Agency operations |
| Complaint investigation & follow-up | 24 hours | Agency operations |
| Data subject rights escalation to client | 4 hours | Agency operations |

---

## Appendix — Template Emails

### Acknowledgment of Opt-Out Request

```
Subject: Your Opt-Out Request — [Client Name]

Dear [Customer Name],

Thank you for contacting us. We have received your request to stop receiving review-request messages from [Client Name].

We have immediately processed your opt-out. You will not receive any further SMS or email messages about leaving a review.

If you have any questions, please feel free to reply to this email or contact [Client Name] directly at [client phone/email].

Best regards,
[Agency Name]
[Agency contact details]
```

### Acknowledgment of General Complaint

```
Subject: We've Received Your Feedback

Dear [Customer Name],

Thank you for getting in touch. We're sorry to hear you had a negative experience.

We have received your message and are looking into it. You can expect a response within 24 hours with more details and any steps we've taken.

If you would like to opt out of future review-request messages, please reply to this email and we will process that immediately.

Best regards,
[Agency Name]
[Agency contact details]
```

### Escalation to Client

```
Subject: Customer Complaint — [Customer Name] — Action Required

Dear [Client Contact],

A customer has contacted us with the following concern:

[Customer message or summary]

We have [suppressed the contact / investigated / other action]. Please confirm if you would like to take any further action on your side.

If this is a data subject rights request (access, deletion, etc.), please note that you (as the data controller) are responsible for responding within 30 days. We are here to assist if you need contact records or other data extracted from our system.

Best regards,
[Agency Name]
```

---

**Last updated:** [Date]  
**Approved by:** [Agency owner or compliance officer]
