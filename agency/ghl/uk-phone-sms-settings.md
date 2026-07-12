# UK Phone & SMS Settings

Per-sub-account configuration, done manually for each client at onboarding (not portable
via the snapshot — see `agency/ghl/snapshot-spec.md` §1). Referenced by
`agency/ghl/workflows/review-request-sequence.md` and `opt-out-handling.md`.

---

## UK long virtual number acquisition (LC Phone)

- Each client sub-account needs its **own UK long virtual number**, provisioned through
  **LC Phone** (GHL's built-in Twilio-backed telephony) inside that sub-account. Do not
  share one number across multiple client sub-accounts.
- Request a **UK long virtual number** (a standard-format +44 mobile-style long number),
  not a shortcode and not an alphanumeric sender ID — see rationale below. Exact
  provisioning screen/flow: verify in GHL UI (LC Phone → Phone Numbers → Buy/Add Number →
  filter to United Kingdom).
- This number becomes the sending (and receiving) number for every SMS in
  `review-request-sequence.md` and the trigger source for the STOP handling in
  `opt-out-handling.md`.
- UK SMS sending does **not** use the US A2P 10DLC registration flow (that's a US-only
  requirement) — but UK mobile carriers do apply their own spam/traffic filtering, so
  sending volume and message content should stay consistent with genuine one-to-one
  transactional/review-request messaging rather than bulk-blast patterns. Verify current
  carrier filtering guidance in GHL UI/support if delivery issues arise.

## Why no alphanumeric sender ID (PECR-4)

- GHL also offers **alphanumeric sender IDs** (a custom text sender name instead of a
  number, shown as the "from"). **Do not use one for review-request SMS.**
- Alphanumeric sender IDs are one-way: a recipient **cannot reply** to them, including
  cannot reply **STOP**. Since "Reply STOP to opt out" is the SMS opt-out mechanism this
  package relies on (PECR-2/PECR-3, see `opt-out-handling.md` Trigger 1), the sending
  number must be reply-capable — i.e. a real UK long virtual number, not an alphanumeric
  ID.
- This applies even though an alphanumeric sender ID might look more "on-brand" (e.g.
  showing the business name as the sender) — the reply-capability requirement overrides
  that preference. Sender identity is instead handled in the **message body** (see next
  section), not the sender ID.

## Sender identity in templates (PECR-2)

- Because the sending number is a plain UK long number (not a named alphanumeric ID), the
  recipient cannot tell who the message is from just by looking at the sender. Every SMS
  and email template must therefore **name the business explicitly in the message body**,
  using `{{custom_values.business_name}}` — enforced in
  `agency/campaigns/sms-sequence.md` and `agency/campaigns/email-sequence.md`, checked
  again structurally in `agency/ghl/snapshot-spec.md` §6.
- Save the number in the client's own contacts/caller ID display where possible (client's
  own phone/CRM contact book) so replies and calls are recognisable, but never rely on
  that alone — the in-message identification is the compliance requirement, the
  caller-ID convenience is a bonus.

## Quiet-hours configuration (TONE-1)

- **SMS sends only 08:00–20:00, Europe/London, every day of the week**, on every SMS step
  of `review-request-sequence.md` (initial, follow-up 1, follow-up 2).
- Configure this as the send window/business-hours setting on each SMS action in the
  workflow (or the account-level default sending-hours setting if GHL applies one
  globally to the sub-account) — verify the exact control surface in GHL UI, since
  workflow-action-level windows and account-level quiet hours may both exist; where both
  exist, set both to 08:00–20:00 Europe/London so neither can override the other to a
  wider window.
- A message due to send outside the window must queue and send at the next in-window
  moment, not send immediately outside the window and not send early.
- Time zone: confirm the sub-account's time zone setting is set to a UK zone (London) so
  "08:00–20:00" is evaluated in local UK time, not UTC or another default — verify in
  GHL UI (Sub-account Settings → Business Info → Time Zone).
- Email has no equivalent quiet-hours requirement under this checklist, but as a matter
  of consistent tone, initial/follow-up emails should also be scheduled within a similar
  daytime window rather than sent at 3am — a soft preference, not a hard compliance rule.

## Indicative costs

Verify current, exact pricing in the GHL UI/billing area before quoting a client — the
figures below are indicative planning numbers only, not a quote:

- **Agency-level GHL plan**: Agency Unlimited-tier plan carrying the client sub-accounts,
  roughly £235–£395/month depending on plan (per `agency/research/offer-and-pricing.md`),
  absorbed into agency overheads, not billed line-by-line to the client.
- **UK long virtual number rental**: a small monthly per-number fee (typically low
  single-digit £/month equivalent) per client sub-account — verify current rate in LC
  Phone pricing.
- **Per-SMS send cost**: UK long-number SMS sends carry a small per-segment cost
  (typically low pence per segment) — verify current LC Phone/Twilio UK SMS rate in GHL
  billing, and remember a message over ~160 characters (or ~70 for messages containing
  certain non-GSM characters) may be billed as multiple segments; keep templates short
  (see `agency/campaigns/sms-sequence.md` character counts).
- **Email sends**: LC Email sending is typically included/very low marginal cost within
  the plan — verify current allowance/overage pricing in GHL UI.
- These are pass-through infrastructure costs, separate from the agency's setup fee and
  monthly retainer in `agency/research/offer-and-pricing.md`; decide during onboarding
  whether they are absorbed into the retainer or itemised to the client, and document
  the choice in the client's service agreement.

## Compliance summary for this file

- PECR-4: UK long virtual number (not alphanumeric sender ID) so STOP replies can be
  received — feeds `opt-out-handling.md` Trigger 1.
- PECR-2: sender identity carried in message body via `{{custom_values.business_name}}`,
  since the number itself doesn't display a business name.
- TONE-1: 08:00–20:00 Europe/London quiet-hours window enforced at the workflow/account
  level for every SMS step.
