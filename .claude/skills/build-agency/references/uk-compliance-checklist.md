# UK Compliance Checklist — Review-Automation Agency

This is the **static ground truth** for the `build-ghl-agency` harness. Every generated
asset must comply with every applicable rule below. The `compliance-reviewer` agent cites
rules **by ID**. These rules are intentionally conservative — stricter than the legal
minimum in places — because the agency promise is "fully legal in the UK".

If the law changes, update this file; agents must never relax a rule on their own
judgment. The `compliance-researcher` agent's findings inform the *content of the
compliance pack*, not the rules of this gate.

---

## PECR — Privacy and Electronic Communications Regulations 2003

### PECR-1 — Review requests are direct marketing
A message asking a customer to leave a review is **direct marketing** under PECR
regulation 22 (per ICO direct marketing guidance). Therefore every SMS or email review
request requires either:
- **prior consent**, or
- the **soft opt-in**, all four limbs: (a) the recipient is the sender's own customer,
  (b) contact details were collected in the course of a sale (or negotiations for one) of
  a product/service, (c) the message concerns the sender's own **similar**
  products/services, and (d) a simple opt-out was offered **when details were collected
  and in every subsequent message**.

Every generated asset that describes sending review requests must state which basis is
used and how it was captured. The sender is the **client business** (not the agency);
messages must be sent in the client's name.

### PECR-2 — Opt-out and sender identity in every message
- Every SMS template ends with an opt-out instruction (e.g. "Reply STOP to opt out").
- Every email template contains a working unsubscribe link.
- Every message identifies the sending business by name.

### PECR-3 — Opt-outs actioned immediately
Workflow specs must include a suppression path: a STOP reply or unsubscribe click marks
the contact DND in GoHighLevel and removes them from all pending review-request steps
before any further message can send. No re-adding suppressed contacts.

### PECR-4 — UK sender numbers must accept replies
UK alphanumeric sender IDs cannot receive replies. If "Reply STOP" is the opt-out
mechanism, sending must use a UK long virtual number (or another reply-capable number).
Documented in the phone/SMS settings guide.

### PECR-5 — Business-to-business nuance is not an escape hatch
Sole traders and (non-limited) partnerships count as individual subscribers under PECR —
treat all recipients as individuals unless verified corporate subscribers. Default: apply
PECR-1 to everyone.

---

## UK GDPR / Data Protection Act 2018

### GDPR-1 — Documented lawful basis
The compliance pack must contain a lawful-basis analysis for each processing operation
(sending requests, storing contact data, logging opt-outs). Where the soft opt-in is
relied on for PECR, the UK GDPR basis is normally **legitimate interests**, and the pack
must include a short legitimate-interests assessment (LIA) template.

### GDPR-2 — Agency is a processor: Article 28 DPA required
The agency processes client customer data on the client's instructions → a written data
processing agreement containing the Article 28(3) mandatory terms must be in place
**before** any customer data enters GoHighLevel. Template required in the pack.

### GDPR-3 — Privacy notice coverage
The client's privacy notice must tell customers their contact details will be used to
send review invitations, name the categories of processors (CRM/messaging provider),
state the lawful basis, and explain the right to object. Template required.

### GDPR-4 — Retention schedule
Defined retention periods for: contact data, message logs, consent/opt-out records
(opt-out suppression records are kept indefinitely as a suppression list), campaign
analytics. No indefinite retention of marketing data "just in case".

### GDPR-5 — ICO registration (data protection fee)
Both the agency and (almost certainly) each client must pay the ICO data protection fee.
The pack must include a note directing both to the ICO fee self-assessment.

### GDPR-6 — International transfers
GoHighLevel stores data on US infrastructure → the DPA/pack must note the need for an
Article 46 transfer mechanism (e.g. the UK IDTA / Addendum to EU SCCs, or the UK–US Data
Bridge extension where the vendor is certified) and direct users to verify GHL's current
sub-processor and transfer terms.

---

## DMCC — Digital Markets, Competition and Consumers Act 2024
(Consumer protection provisions, including the banned-practices list covering fake
reviews, in force from **6 April 2025**. CMA enforces; fines up to 10% of global
turnover.)

### DMCC-1 — No fake or hidden-incentive reviews
It is a banned practice to submit or commission fake reviews, or to publish reviews
without disclosing that an incentive was given. **Harness default: no incentives for
reviews at all** — no discounts, entries into draws, or payment for leaving a review,
disclosed or not. Assets must never suggest incentivising reviews.

### DMCC-2 — No review gating
The public review invitation must go to **all** eligible customers identically:
- No sentiment pre-screening ("How was your experience?" → only happy customers get the
  Google link).
- No rating filter, no NPS branch, no "if unhappy, send our private feedback form
  *instead*".
- Internal feedback capture is permitted **only in addition to** the universal public
  ask — never as a replacement for it, and never sequenced so that a negative internal
  answer suppresses the public ask.

### DMCC-3 — No paying to alter reviews
Response templates and SOPs must never offer payment, refunds, or benefits conditional on
a customer editing or removing a review. Making things right for a genuinely unhappy
customer is fine; buying the review's removal is not.

### DMCC-4 — Reasonable and proportionate steps
Businesses that publish or commission reviews must take reasonable and proportionate
steps to prevent/remove fake or hidden-incentive reviews. The client-facing review policy
must state this duty and give practical steps (only invite verified customers, keep send
logs, report suspicious reviews to the platform).

### DMCC-5 — No impersonating customers
The agency must never draft or post reviews on behalf of customers, "help" customers
write reviews with pre-written text, or submit reviews from agency-controlled accounts.

---

## Messaging conduct

### TONE-1 — Quiet hours and frequency caps
SMS sends only between 08:00 and 20:00 UK time. Maximum one initial request plus two
follow-ups per transaction; a customer who has been asked is not re-asked for the same
purchase. Follow-ups stop immediately on review completion or opt-out.

### TONE-2 — Honest framing
Requests must ask for **honest feedback**, never for "a 5-star review" or "a positive
review". Platform terms (Google) also prohibit review gating and incentives — assets may
cite this alongside DMCC-2.

---

## Meta

### LEGAL-1 — Not legal advice
Every legal/compliance template (DPA, privacy notice, service agreement, policies)
carries a visible disclaimer: *"This is a template for information purposes, not legal
advice. Have a solicitor review it before use."*

### LEGAL-2 — Truthful agency marketing
The agency's own positioning/offer materials must not promise outcomes it cannot
guarantee ("we'll get you 50 five-star reviews") — claims must be about the service
(automated, compliant review invitations), not guaranteed ratings. (Consumer protection
law applies to the agency's own marketing too.)
