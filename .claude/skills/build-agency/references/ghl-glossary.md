# GoHighLevel (GHL) Glossary — shared terminology for harness agents

Use these terms exactly. Do not invent GHL features. If a design needs something not
listed here, describe it generically and flag it for the human operator to verify in the
GHL UI.

- **Agency account** — the top-level GHL account the agency owns. Manages sub-accounts,
  billing, snapshots, and white-labelling. Created by human signup at gohighlevel.com
  (Agency Starter ≈ $97/mo, Agency Unlimited ≈ $297/mo — verify current pricing).
- **Sub-account / Location** — one client business's isolated workspace (contacts,
  pipelines, workflows, calendars, phone numbers). One client = one sub-account.
- **Snapshot** — an exportable template of a sub-account (custom fields, workflows,
  pipelines, tags, email/SMS templates). The agency builds one "Review Automation UK"
  snapshot and loads it into every new client sub-account.
- **Contact** — a person record. Relevant standard fields: name, email, phone, DND
  status, tags.
- **DND (Do Not Disturb)** — per-contact, per-channel suppression flag. Setting DND for
  SMS/email stops GHL sending to that contact on that channel. This is the suppression
  mechanism for opt-outs (PECR-3).
- **Tag** — free-form label on a contact (e.g. `review-requested`, `review-left`,
  `opted-out`). Used for segmenting and workflow triggers/goals.
- **Custom field** — extra data on a contact (e.g. `Last Job Completed Date`,
  `Review Consent Basis`). Defined per sub-account; included in snapshots.
- **Custom value** — a per-sub-account variable usable in templates (e.g.
  `{{custom_values.google_review_link}}`, `{{custom_values.business_name}}`). Set once
  per client during onboarding.
- **Pipeline / Stage** — kanban-style opportunity tracking (e.g. stages: Job Completed →
  Review Requested → Review Left / Opted Out).
- **Workflow** — GHL's automation builder: a **trigger** (e.g. tag added, pipeline stage
  changed, customer replied) followed by **actions** (send SMS, send email, wait, add
  tag, set DND, if/else branch, goal event). Workflows live in sub-accounts and are
  included in snapshots.
- **Workflow trigger** — the entry condition. Common: "Contact Tag Added",
  "Pipeline Stage Changed", "Customer Replied", "Contact DND".
- **Goal event** — a workflow condition that, when met (e.g. tag `review-left` added),
  pulls the contact out of remaining steps. Used to stop follow-ups once a review is
  detected/recorded.
- **LC Phone (LeadConnector Phone)** — GHL's built-in telephony/SMS (Twilio-backed).
  Alternative: connecting the agency's own Twilio account. Either way UK sending needs a
  UK number; UK does not use US A2P 10DLC registration, but carriers filter spam and
  sender-ID rules apply (see PECR-4).
- **LC Email / SMTP** — GHL's email sending (or a connected provider like Mailgun).
  Unsubscribe links are inserted via the email builder's unsubscribe element/merge tag.
- **Reputation Management** — GHL's built-in review feature set: sends review requests
  (email/SMS) with links to Google/Facebook review pages, monitors connected Google
  Business Profile / Facebook reviews, and provides a reviews dashboard/widget.
  Note: its default "review funnel" page may offer sentiment pre-screening — **do not use
  sentiment gating** (DMCC-2); link directly to the public review page for everyone.
- **Google Business Profile (GBP) integration** — connecting a client's GBP lets GHL pull
  reviews in and (via Reputation Management) reply to Google reviews from inside GHL.
- **Review link** — the direct URL to a business's Google review dialog
  (`https://search.google.com/local/writereview?placeid=<PLACE_ID>`). Stored as a custom
  value per client.
- **Trust Center / A2P** — US-only SMS registration flows in GHL; not applicable to
  UK-only sending, but note it if a client also texts US numbers.
- **SaaS mode** — agency feature for rebilling sub-accounts automatically. Out of scope
  for the launch package (mention only as a later upsell path).
