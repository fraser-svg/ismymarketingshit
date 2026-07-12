# GHL Setup Guide — "Review Automation UK" Snapshot

This guide walks a non-technical agency owner through creating the **"Review Automation UK"** snapshot
and onboarding a new client. Each step mirrors the GHL UI; verify exact menu names in your current
GHL UI instance as interfaces may vary between versions.

---

## Prerequisites — Complete Before Starting

Before you build the snapshot or configure a client sub-account, ensure:

1. **GHL agency account created and signed into** at gohighlevel.com. You should be on an Agency plan
   (e.g. Agency Unlimited) to manage sub-accounts.

2. **Client business details on hand:**
   - Business name (e.g. "Riverside Plumbing Ltd")
   - Client's Google Business Profile (GBP) Place ID and access credentials (so you can connect it
     to the sub-account during setup — see Step 9 below)
   - Client's email address for business contact/support (e.g. "hello@riversideplumbing.co.uk")

3. **Signed service agreement and Data Processing Agreement (DPA)** between agency and client.
   - Must be signed *before* any contact data is imported or workflows activated.
   - Template: `agency/legal/service-agreement-template.md` and `agency/compliance/dpa-template.md`.
   - Client must also update their privacy notice to include review-request processing — template
     insert at `agency/compliance/privacy-notice-template.md`.

4. **Consent basis audit:** Before importing any contact, confirm the client has a lawful basis
   (consent or soft opt-in under PECR) recorded for each contact. Only import contacts with
   documented consent. Details: `agency/compliance/lawful-basis-analysis.md` and
   `agency/compliance/pecr-consent-flow.md`.

5. **ICO data protection fee:** Both the agency and the client may need to register with the ICO
   and pay the annual data protection fee. Confirm responsibility and payment in the service
   agreement. Details: `agency/compliance/ico-registration-note.md`.

---

## PART A — Build the Snapshot (One-Time Setup)

The snapshot is built once by the agency and loaded into every new client sub-account. It contains
every custom field, tag, pipeline, workflow, and template slot (copy bodies come from
`agency/campaigns/`). This part is done once in the agency account.

### Step 1 — Create a test sub-account for building (optional but recommended)

You may build the snapshot in a dedicated test sub-account first, then export it as a template for
reuse. Alternatively, build it directly in your first production client's sub-account and export
from there. Either way, the steps below are identical.

- In the GHL agency dashboard, select **"New Sub-Account"** or **"Add Location"**.
- Enter a temporary name like "Review Automation UK — Test Build" (if building a template sub-account first).
- Complete the sub-account creation flow.
- Note the sub-account ID for reference.

### Step 2 — Create custom fields

Custom fields track compliance data and workflow state per contact. Create them in the
sub-account in this order:

1. Go to **Contacts** → **Custom Fields** (or equivalent menu — may vary by GHL UI version).
2. Click **"Create Custom Field"** or **"Add Field"**.

**Field 1: Review Consent Basis**
- Field name: `Review Consent Basis` (must match exactly)
- Type: **Dropdown (single select)**
- Options (enter both):
  - `consent`
  - `soft-opt-in`
- Required: No
- Description (optional): "PECR lawful basis for sending this contact a review request."

**Field 2: Review Consent Date**
- Field name: `Review Consent Date` (must match exactly)
- Type: **Date**
- Required: No
- Description (optional): "When the consent basis above was captured (audit trail)."

**Field 3: Review Request Status**
- Field name: `Review Request Status` (must match exactly)
- Type: **Dropdown (single select)**
- Options (enter all in this order):
  - `Not Started`
  - `Requested`
  - `Follow-up 1 Sent`
  - `Follow-up 2 Sent`
  - `Review Left`
  - `Opted Out`
- Required: No
- Description (optional): "Tracks where this contact is in the review request sequence."

**Field 4: Last Job Completed Date**
- Field name: `Last Job Completed Date` (must match exactly)
- Type: **Date**
- Required: No
- Description (optional): "Date of the transaction the current review request relates to. Used to
  detect new transactions so repeat customers can legitimately be asked again for a new job."

**Field 5: Job Reference**
- Field name: `Job Reference` (must match exactly)
- Type: **Text**
- Required: No
- Description (optional): "Free text / invoice or job ID; ties a request cycle to one transaction."

**Field 6: Opt-Out Date**
- Field name: `Opt-Out Date` (must match exactly)
- Type: **Date/Time**
- Required: No
- Description (optional): "When a STOP reply or unsubscribe click was received (audit trail)."

**Field 7: Opt-Out Channel**
- Field name: `Opt-Out Channel` (must match exactly)
- Type: **Dropdown (single select)**
- Options (enter all three):
  - `SMS`
  - `Email`
  - `Phone`
- Required: No
- Description (optional): "Which channel the opt-out arrived on (audit trail)."

### Step 3 — Create custom values (placeholder definitions)

Custom values are per-sub-account variables used as merge fields in every SMS/email template.
The snapshot carries the *definitions* only; clients fill in *values* per-location during onboarding
(Step 5 below).

1. Go to **Settings** (or **Sub-account Settings**) → **Custom Values** or **Merge Fields**.
2. Click **"Create Custom Value"** or **"Add Value"**.

**Value 1: business_name**
- Name: `business_name` (must match exactly; stored as `{{custom_values.business_name}}`)
- Default / placeholder: Leave empty or enter "Business Name" as a placeholder.
- Description (optional): "Client's business name. Used in every SMS and email body for sender
  identification (PECR-2)."

**Value 2: google_review_link**
- Name: `google_review_link` (must match exactly; stored as `{{custom_values.google_review_link}}`)
- Default / placeholder: Leave empty or enter "https://example.com" as a placeholder.
- Description (optional): "Direct URL to the client's Google review dialog. Same for every eligible
  contact (DMCC-2). How to construct: agency/campaigns/google-review-link-guide.md"

**Value 3: sms_sender_number**
- Name: `sms_sender_number` (must match exactly)
- Default / placeholder: Leave empty or enter "+44 7700 000000" as a placeholder.
- Description (optional): "Client's UK long virtual number (human-readable reference). Used in staff
  training and setup docs, not in message bodies."

**Value 4: business_contact_email**
- Name: `business_contact_email` (must match exactly)
- Default / placeholder: Leave empty or enter "hello@example.co.uk" as a placeholder.
- Description (optional): "Client's email address for reply-to / support contact shown in email
  footer."

### Step 4 — Create tags

Tags are free-form labels used to segment contacts and trigger/drive workflows.

1. Go to **Contacts** → **Tags** (or equivalent menu).
2. Click **"Create Tag"** or **"Add Tag"**.

Create these tags in any order (exact names must match):

- `job-completed` — A transaction has finished; contact is a candidate for a review request. Set
  by the client's own process.
- `review-requested` — Initial SMS + email sent. Set by the review-request-sequence workflow.
- `review-followup-1-sent` — Follow-up 1 sent. Set by review-request-sequence workflow.
- `review-followup-2-sent` — Follow-up 2 sent. Set by review-request-sequence workflow.
- `review-left` — Goal event: contact has left a review. Set manually by staff or by reply-detection
  heuristic. Stops all remaining workflow steps.
- `opted-out` — Contact has STOPped or unsubscribed. Set by opt-out-handling workflow. Permanent;
  never removed.

### Step 5 — Create the pipeline and stages

The pipeline is a reporting/visibility layer over the workflow statuses. It has no branches or
sentiment gates — it mirrors the `Review Request Status` field and tag progression.

1. Go to **Pipelines** (or equivalent menu).
2. Click **"Create Pipeline"** or **"New Pipeline"**.
3. Enter pipeline name: `Review Automation` (must match exactly).
4. Create these stages in order (exact names must match):

| Stage name | Description |
|---|---|
| `Job Completed` | Trigger tag `job-completed` added / contact enters workflow. |
| `Review Requested` | Initial SMS + email sent (`Review Request Status` = `Requested`). |
| `Follow-Up Sent` | Either follow-up sent (`Review Request Status` = `Follow-up 1 Sent` or `Follow-up 2 Sent`). |
| `Review Left` | Goal event fires — tag `review-left` added. *(Mark as "Won" in GHL pipeline settings if applicable.)* |
| `Opted Out` | Opt-out workflow fires — tag `opted-out` added. *(Mark as "Lost" in GHL pipeline settings if applicable.)* |

---

## PART B — Import and Configure Templates

Templates are created in the GHL email/SMS builder and reference the SMS/email copy from
`agency/campaigns/`. You create one email template and one SMS template for each stage (initial,
follow-up 1, follow-up 2). The workflow will call them by name.

### Step 6 — Import SMS templates

1. Go to **Campaigns** → **SMS** or **Automations** → **SMS Templates** (menu names vary).
2. Click **"Create SMS Template"** or **"New SMS"**.

Create three SMS templates in this order. **Each template must end with an opt-out instruction**
(PECR-2). Copy the full message text from `agency/campaigns/sms-sequence.md` (section "SMS
Templates"), including:
- The merge field `{{custom_values.business_name}}`
- The merge field `{{custom_values.google_review_link}}`
- The STOP instruction at the end ("Reply STOP to opt out")

**Template 1: "Initial review request" (SMS)**
- Template name: `Initial review request` (must match exactly)
- Message body: Copy from `agency/campaigns/sms-sequence.md`, Initial Review Request section.
- Verify merge fields are present: `{{custom_values.business_name}}` and `{{custom_values.google_review_link}}`.
- Verify STOP opt-out instruction is at the end.

**Template 2: "Follow-up 1" (SMS)**
- Template name: `Follow-up 1` (must match exactly)
- Message body: Copy from `agency/campaigns/sms-sequence.md`, Follow-up 1 section.
- Same merge fields and STOP instruction.

**Template 3: "Follow-up 2" (SMS)**
- Template name: `Follow-up 2` (must match exactly)
- Message body: Copy from `agency/campaigns/sms-sequence.md`, Follow-up 2 section.
- Same merge fields and STOP instruction.

### Step 7 — Import email templates

1. Go to **Campaigns** → **Email** or **Automations** → **Email Templates** (menu names vary).
2. Click **"Create Email Template"** or **"New Email"**.

Create three email templates in this order. **Each email template must include the platform
unsubscribe element/merge tag** (PECR-2 requirement; GHL's email builder usually has a button for
this). Copy the subject line and body text from `agency/campaigns/email-sequence.md`.

**Template 1: "Initial review request" (Email)**
- Template name: `Initial review request` (must match exactly)
- Subject: Copy from `agency/campaigns/email-sequence.md`, Initial Review Request section.
- Body: Copy from `agency/campaigns/email-sequence.md`, Initial Review Request section.
- Verify merge fields are present: `{{custom_values.business_name}}`, `{{custom_values.google_review_link}}`,
  and `{{custom_values.business_contact_email}}`.
- **Verify the unsubscribe element is included** (GHL email builder should prompt for this or have
  a dedicated button; it auto-inserts an unsubscribe link).
- Verify sender identity (business name) is mentioned in the body.

**Template 2: "Follow-up 1" (Email)**
- Template name: `Follow-up 1` (must match exactly)
- Subject and body: Copy from `agency/campaigns/email-sequence.md`, Follow-up 1 section.
- Same merge fields and unsubscribe element.

**Template 3: "Follow-up 2" (Email)**
- Template name: `Follow-up 2` (must match exactly)
- Subject and body: Copy from `agency/campaigns/email-sequence.md`, Follow-up 2 section.
- Same merge fields and unsubscribe element.

---

## PART C — Build Workflows

The two workflows below automate the review request sequence and opt-out handling. Both are included
in the snapshot and run in parallel. Create them in the sub-account in this order.

### Step 8 — Create "Review Request Sequence" workflow

This is the main workflow that sends review requests (with compliance gates) and follow-ups.

1. Go to **Workflows** or **Automations** → **Workflows**.
2. Click **"Create Workflow"** or **"New Workflow"**.
3. Name: `Review Request Sequence` (must match exactly).

#### Step 8a — Set the trigger

- **Trigger type:** "Contact Tag Added" OR "Pipeline Stage Changed" (choose one and use it
  consistently for all clients).

**If using "Contact Tag Added":**
- Select tag: `job-completed`
- This means the workflow starts when a contact is tagged `job-completed` by the client's own
  process.

**If using "Pipeline Stage Changed":**
- Select pipeline: (the client's *operational* pipeline, upstream of Review Automation)
- Select stage: (the equivalent of "Job Completed")
- This means the workflow starts when the contact reaches that stage in the client's pipeline.

(Verify exact trigger options and wording in your GHL UI version.)

#### Step 8b — Add the eligibility check (If/Else branch)

This is a **compliance gate**, not a content branch. Contacts that fail any condition take the
"Not Eligible" exit path (no send).

1. After the trigger, add an **If/Else** action/branch.
2. Set up **four conditions** (all must be true):

**Condition 1:** `Review Consent Basis` is not empty
- Field: `Review Consent Basis`
- Operator: "is set" or "is not empty"
- This blocks any send with no recorded lawful basis.

**Condition 2:** Contact is not DND for SMS
- Field: Contact DND (SMS) or equivalent
- Operator: "is false" or "is not set"
- This checks the contact's SMS Do-Not-Disturb status.

**Condition 3:** Contact is not DND for Email
- Field: Contact DND (Email) or equivalent
- Operator: "is false" or "is not set"

**Condition 4:** Tag `opted-out` is not present
- Field: Tags
- Operator: "does not contain" or "does not have tag"
- Select tag: `opted-out`

**If all conditions are true:** → Continue to Step 8c (send path).
**If any condition is false:** → "Not Eligible" exit path: End workflow for this contact (no action,
no send).

#### Step 8c — Send path: Step 1 (Mark requested)

- Action: **Set Custom Field**
- Field: `Review Request Status`
- Value: `Requested`

#### Step 8d — Send path: Step 2 (Send initial SMS)

- Action: **Send SMS**
- Template: Select "Initial review request" (from Step 6).
- **Configure quiet hours / send window:**
  - Look for an option like "Send during business hours" or "Quiet hours" or "Sending window".
  - Set to: **08:00–20:00 Europe/London**, every day.
  - (If this option is not present on the SMS action, skip here and configure it account-wide in
    the next step; verify in your GHL UI settings.)
  - Messages due outside this window queue for the next in-window moment.

#### Step 8e — Send path: Step 3 (Send initial email)

- Action: **Send Email**
- Template: Select "Initial review request" (from Step 7).
- No quiet-hours requirement for email (optional soft preference to send during business hours, but
  not a compliance rule).

#### Step 8f — Send path: Step 4 (Tag)

- Action: **Add Tag**
- Tag: `review-requested`

#### Step 8g — Send path: Step 5 (Wait)

- Action: **Wait**
- Duration: **3 days**

#### Step 8h — Send path: Step 6 (Goal check)

This is a **workflow-level goal event**. The goal event exits the workflow for this contact the
moment the goal condition is met, not only at this checkpoint.

1. Configure the workflow's **Goal / Exit Condition** (look for a button/tab like "Goal Event" or
   "Workflow Goals" at the workflow level, not inside a step).
2. Set the goal condition:
   - Tag `review-left` is added, **OR** Contact replied to the SMS/email (excluding STOP-type
     replies, which are handled by the opt-out workflow).
   - (GHL may phrase this as: "Goal: Tag contains 'review-left' OR Contact replied to message".
     Verify exact wording in your UI.)
3. Goal action: **Exit workflow** for this contact (no further steps run).

*Note: GHL cannot itself confirm a Google review was actually posted. `review-left` is applied
either manually by staff (checking new reviews against requested contacts) or via a reply-detection
heuristic the client sets up. Flag "verify in GHL UI" for whichever method is used.*

#### Step 8i — Send path: Step 7 (Follow-up 1)

This step is only reached if the goal has not fired yet.

- Action: **Send SMS**
  - Template: "Follow-up 1"
  - Quiet hours: 08:00–20:00 Europe/London (same as Step 2)
- Action: **Send Email**
  - Template: "Follow-up 1"
- Action: **Set Custom Field**
  - Field: `Review Request Status`
  - Value: `Follow-up 1 Sent`
- Action: **Add Tag**
  - Tag: `review-followup-1-sent`

#### Step 8j — Send path: Step 8 (Wait)

- Action: **Wait**
- Duration: **4 days**

#### Step 8k — Send path: Step 9 (Goal check)

- Same goal condition as Step 6. If met, workflow ends here (due to the workflow-level goal event).

#### Step 8l — Send path: Step 10 (Follow-up 2)

This step is only reached if the goal has not fired yet.

- Action: **Send SMS**
  - Template: "Follow-up 2"
  - Quiet hours: 08:00–20:00 Europe/London
- Action: **Send Email**
  - Template: "Follow-up 2"
- Action: **Set Custom Field**
  - Field: `Review Request Status`
  - Value: `Follow-up 2 Sent`
- Action: **Add Tag**
  - Tag: `review-followup-2-sent`

#### Step 8m — Send path: Step 11 (End)

- Workflow ends naturally. Maximum sends: 1 initial SMS + 1 initial email + 2 follow-up SMS + 2
  follow-up email.

#### Step 8n — Publish the workflow

- Click **"Publish"** or **"Save & Activate"** to enable the workflow.

### Step 9 — Configure account-level quiet hours (if not set per-action)

If your GHL UI has an account-level quiet-hours / sending-hours setting (and you did not configure
it per-SMS-action in Step 8d), set it now:

1. Go to **Settings** (or **Sub-account Settings**) → **Business Info** or **Sending Settings**.
2. Find **"Quiet Hours"** or **"Sending Window"** or **"Business Hours"**.
3. Set to: **08:00–20:00 Europe/London**, every day.
4. **Confirm the time zone is set to "London" or "Europe/London"** (so "08:00–20:00" is evaluated
   in UK time, not UTC).
   - Look for **Time Zone** setting in the same settings area.
   - Set it to **Europe/London** if not already set.

### Step 10 — Verify: Confirm time zone setting

This is critical for quiet hours to work correctly.

1. Go to **Settings** → **Business Info** or equivalent.
2. Find **"Time Zone"**.
3. Verify it is set to **Europe/London** (not UTC, not another timezone, not blank).
4. If not, change it to **Europe/London** and save.

### Step 11 — Create "Opt-Out Handling" workflow

This workflow runs in parallel with Review Request Sequence and takes priority. It handles SMS STOP
replies and email unsubscribes.

1. Go to **Workflows** or **Automations** → **Workflows**.
2. Click **"Create Workflow"**.
3. Name: `Opt-Out Handling` (must match exactly).

#### Step 11a — Trigger 1: SMS STOP reply

1. Add trigger: **Contact Replied** (SMS).
2. Set condition: Message contains any of these keywords (case-insensitive):
   - `STOP`
   - `STOP ALL`
   - `UNSUBSCRIBE`
   - `CANCEL`
   - `END`
   - `QUIT`
   - (Note: Some carriers/LC Phone may handle certain STOP keywords at the network level before
     reaching this workflow. This workflow is the backstop that guarantees the CRM-side state is
     correct.)
3. **Actions for SMS STOP path:**
   - Set DND (SMS): True
   - Add tag: `opted-out`
   - Set custom field `Review Request Status`: `Opted Out`
   - Set custom field `Opt-Out Date`: Now (current timestamp)
   - Set custom field `Opt-Out Channel`: `SMS`
   - **Remove contact from workflow:** `Review Request Sequence` (this must pre-empt any queued
     sends in that workflow)
   - (Optional, recommended) Create internal task/notification: "Contact opted out via SMS"

#### Step 11b — Trigger 2: Email unsubscribe

1. Add a second trigger in the same workflow (or create a parallel if/else): **Contact Unsubscribed**
   (Email).
   - (GHL's built-in unsubscribe element in email templates automatically sets Email DND when
     clicked; this trigger fires on that event.)
2. **Actions for email unsubscribe path:**
   - Set DND (Email): True (GHL may do this automatically, but set it explicitly)
   - Add tag: `opted-out`
   - Set custom field `Review Request Status`: `Opted Out`
   - Set custom field `Opt-Out Date`: Now
   - Set custom field `Opt-Out Channel`: `Email`
   - **Remove contact from workflow:** `Review Request Sequence` (pre-empt any queued sends)
   - (Optional) Internal task/notification: "Contact opted out via email"

#### Step 11c — Permanence rules (for documentation)

The `opted-out` tag is **never removed**, and DND set by this workflow is **never manually
cleared**. A contact who is opted-out must **never** be re-added to Review Request Sequence, even
for a genuinely new transaction. The opt-out record is retained indefinitely as a suppression-list
entry (see `agency/compliance/retention-schedule.md`).

#### Step 11d — Publish the workflow

- Click **"Publish"** or **"Save & Activate"**.

---

## PART D — Per-Client Onboarding Setup (Repeat for Each New Client)

Once the snapshot is built, each new client gets a fresh sub-account loaded from this snapshot.
Complete these steps for each client.

### Step 12 — Create and name the client sub-account

1. In the GHL agency dashboard, click **"New Sub-Account"** or **"Add Location"**.
2. Enter client name (e.g. "Riverside Plumbing Ltd").
3. Complete the sub-account creation.
4. **Select this sub-account** so you are now working inside it.

### Step 13 — Load the snapshot (if not automatically included)

If your snapshot was built in a separate test sub-account:

1. Go to **Settings** → **Import / Snapshots** or equivalent (menu name varies).
2. Select the snapshot you built (e.g. "Review Automation UK").
3. Click **"Load Snapshot"** or **"Import"**.
4. Confirm that all custom fields, tags, pipeline, workflows, and templates are now loaded into
   this sub-account.

If you built the snapshot directly in a production client's sub-account, you may have already
loaded it; verify the custom fields, tags, and workflows are present.

### Step 14 — Fill in custom values for this client

Now populate the placeholder custom values with the client's specific information:

1. Go to **Settings** → **Custom Values** or **Merge Fields**.
2. Edit each custom value (or click through them in order):

**Value 1: business_name**
- Set to the client's legal business name (e.g. "Riverside Plumbing Ltd").

**Value 2: google_review_link**
- Set to the direct URL to the client's Google review dialog. How to construct:
  - Find the client's Google Business Profile (via Google Maps search or their GBP login).
  - Copy the Place ID from the URL or GBP settings.
  - Construct the URL: `https://search.google.com/local/writereview?placeid=<PLACE_ID>`
  - Paste this full URL as the custom value.
  - Test it in a browser to confirm it opens the client's review form.
  - Full instructions: `agency/campaigns/google-review-link-guide.md`

**Value 3: sms_sender_number**
- Set to the UK long virtual number you will buy in Step 15 (you can fill this in after buying the
  number, or leave it as a reference for staff training).
- Format: e.g. "+44 7700 000000" (human-readable, with spaces and country code).

**Value 4: business_contact_email**
- Set to the client's contact email for support/replies (e.g. "hello@riversideplumbing.co.uk").

### Step 15 — Buy a UK long virtual number (LC Phone)

Each client sub-account needs its own UK long virtual number for SMS sending and STOP-reply
handling.

1. Go to **Settings** → **Phone Numbers** or **LC Phone** or **Telephony** (menu name varies).
2. Click **"Buy Number"** or **"Add Number"** or **"Request Number"**.
3. Select **United Kingdom** as the country.
4. Request a **UK long virtual number** (a standard-format +44 mobile-style long number).
   - Do **not** request a shortcode or alphanumeric sender ID — a real number is required because
     recipients must be able to reply STOP.
5. Complete the purchase/provisioning.
6. Note the provisioned number.
7. **Update the `sms_sender_number` custom value** (from Step 14) with this number if you haven't
   already.

### Step 16 — Connect Google Business Profile

Connect the client's GBP so GHL can pull in reviews and (optionally) reply to them from inside
GHL.

1. Go to **Settings** → **Integrations** or **Google Business Profile** or **Reputation
   Management** (menu name varies).
2. Click **"Connect Google Business Profile"** or **"Authorize"**.
3. Follow the OAuth flow to authorize GHL to access the client's GBP.
4. Select the client's business location when prompted.
5. Confirm the connection is active.

### Step 17 — Import contacts (with consent check)

Import the client's contact list into the sub-account. **Only import contacts with a recorded
lawful basis (consent or soft opt-in).**

1. Go to **Contacts** → **Contacts** or **Import**.
2. Click **"Import Contacts"** or **"Bulk Import"** or equivalent.
3. Prepare your contact file (CSV, Excel, etc.) with columns:
   - Name, Phone, Email (at minimum)
   - Add a column for `Review Consent Basis` if importing the lawful basis field, or set it
     manually after import.
4. Upload the file.
5. Map columns to GHL contact fields (phone → Phone, email → Email, etc.).
6. **Before completing the import:** Audit the contact list to confirm every contact has a
   recorded consent basis. Remove or flag any contact with no consent recorded — they cannot be
   enrolled in the review request sequence.
7. Complete the import.

### Step 18 — Set the consent basis for each contact (or audit post-import)

Ensure each imported contact has a `Review Consent Basis` value recorded:

1. Go to **Contacts**.
2. Open a contact record.
3. Find the custom field `Review Consent Basis`.
4. Set it to either `consent` or `soft-opt-in` (based on how the client captured consent from this
   contact).
5. Set `Review Consent Date` to the date consent was captured (audit trail).
6. Repeat for all contacts, or use GHL's bulk-edit feature if available.

(If you imported this field in Step 17, verify the values are correctly mapped and complete.)

### Step 19 — Test send to yourself

Before going live, send a test message to yourself to verify the SMS/email setup and merge fields.

1. Create a test contact in this sub-account:
   - Name: Your name
   - Phone: Your phone number
   - Email: Your email address
2. On this test contact, manually set:
   - `Review Consent Basis`: `consent`
   - `Review Request Status`: `Not Started`
3. Add the tag `job-completed` to the test contact.
4. Wait for the Review Request Sequence workflow to trigger and send. (It should send within a few
   seconds if the workflow is published and the trigger is active.)
5. Verify you receive the initial SMS and email with:
   - The client's business name (`{{custom_values.business_name}}`)
   - The correct Google review link (`{{custom_values.google_review_link}}`)
   - Correct reply-to address (if applicable)
   - STOP instruction in SMS and unsubscribe link in email
6. If SMS or email does not arrive within 1–2 minutes:
   - Check the workflow activity log for errors.
   - Verify the SMS quiet hours allow sending at this time.
   - Verify the test contact is not DND.
   - Verify the `Review Request Status` field is set to `Not Started` (not something else).
7. Once verified, delete the test contact (or move it to a "Do Not Send" tag to exclude from
   reports).

### Step 20 — Save / export this sub-account as a snapshot (optional re-use)

If you want to reuse this configuration for future clients, export it as a snapshot:

1. Go to **Settings** → **Snapshots** or **Export** (menu name varies).
2. Click **"Save as Snapshot"** or **"Export Snapshot"**.
3. Name it: `Review Automation UK` (or a variant like `Review Automation UK — Updated YYYY-MM-DD`).
4. Confirm the snapshot includes:
   - All custom fields (7 fields from Step 2)
   - All custom values (4 value definitions from Step 3; values themselves are empty/client-specific)
   - All tags (6 tags from Step 4)
   - The pipeline `Review Automation` and all stages (from Step 5)
   - All email and SMS templates (3 each, from Steps 6–7)
   - Both workflows `Review Request Sequence` and `Opt-Out Handling` (from Steps 8–11)
5. Do **not** include the following in the snapshot (these are per-client and set manually):
   - The UK phone number (LC Phone)
   - The Google Business Profile connection
   - The custom value *values* (only definitions)
   - Any contact data

### Step 21 — Go-live checks

Before the client starts using the system:

1. **Verify all contacts have a consent basis recorded** — audit the Contacts list and confirm
   `Review Consent Basis` is set to `consent` or `soft-opt-in` for every enrolled contact.
2. **Verify the business name and review link are correct** in the custom values (test one more time
   by sending to yourself or a trusted user).
3. **Confirm the phone number** is working (receive a test STOP reply to verify the opt-out
   workflow triggers).
4. **Confirm GBP is connected** — check a recent review appears in the GHL dashboard.
5. **Review the privacy notice** — confirm the client has updated their online privacy notice to
   include the review-request processing (template: `agency/compliance/privacy-notice-template.md`).
6. **Confirm the service agreement and DPA are signed** by both parties.
7. **Document the setup** — take screenshots of key settings (phone number, quiet hours, workflow
   trigger) for your records.

---

## PART E — Post-Launch Monitoring

### Step 22 — Monitor first week

1. **Check workflow activity** — go to each workflow's activity/analytics page and confirm messages
   are sending.
2. **Watch for bounce/delivery errors** — review any SMS or email delivery failures and address
   carrier issues if needed.
3. **Monitor opt-outs** — watch for STOP replies and confirm the Opt-Out Handling workflow is
   triggering correctly (contact should be DND + tagged `opted-out` immediately).
4. **Check reply-detection** — if the client is using a reply heuristic to set `review-left`,
   verify the logic is working (or arrange manual tagging by staff).

### Step 23 — Monthly reporting and compliance

Per the service agreement, produce a monthly report including:

- Total requests sent
- Delivery rate
- Reviews gained
- Average rating trend
- Opt-out rate
- Compliance attestation (all opt-outs honored immediately, no re-sends after opt-out, etc.)

Template: `agency/ops/monthly-reporting-template.md`

### Step 24 — Retain suppression records

- Export all contacts with tag `opted-out` monthly and retain indefinitely as a suppression-list
  record.
- Never clear the `opted-out` tag or manually remove DND for an opted-out contact.
- Retain conversation history (STOP replies, unsubscribe clicks) in GHL for as long as the contact
  record exists.

---

## Compliance Reminders

1. **Consent basis (PECR-1):** Every contact must have `Review Consent Basis` recorded before they
   can be enrolled. No consent = no send.
2. **Opt-out (PECR-3):** STOP and unsubscribe are permanent. Opt-out handling must be immediate.
   Never re-send to an opted-out contact.
3. **Sender identity (PECR-2):** Business name must be in every SMS and email body (merge field
   `{{custom_values.business_name}}`).
4. **Quiet hours (TONE-1):** SMS only 08:00–20:00 Europe/London. Verify time zone is set to London.
5. **No sentiment gating (DMCC-2):** Everyone who clears the consent/DND/dedupe gate gets the same
   sequence. No branching on rating or feedback.
6. **Frequency cap (TONE-1):** Maximum 3 SMS + 3 email per contact per transaction (1 initial + 2
   follow-ups each).
7. **DPA and service agreement:** Both must be signed before any data import or workflow activation.

For detailed compliance rationale, see:
- `agency/compliance/lawful-basis-analysis.md` (PECR-1 / GDPR-1)
- `agency/compliance/pecr-consent-flow.md` (consent capture)
- `agency/compliance/dmcc-review-policy.md` (no gating, no incentives)
- `agency/compliance/retention-schedule.md` (data retention)

---

## Troubleshooting & Verification

**"Menu names may vary"** — Your GHL UI version may use slightly different menu names than listed
above. For example:
- "Workflows" might be "Automations"
- "Custom Fields" might be "Contact Fields" or "Custom Attributes"
- "Settings" might be "Sub-account Settings" or "Account Settings"
- "Snapshots" might be "Import/Export" or "Templates"

**When in doubt:** Look for menu items containing keywords like "Custom", "Field", "Workflow",
"Automation", "Template", "Settings", "Import", "Snapshot" to locate the right section.

**Workflow trigger not firing?** Verify:
1. The workflow is published/active (not in draft mode).
2. The trigger condition is set correctly (tag `job-completed` added, or pipeline stage changed).
3. The contact meets the eligibility check (has `Review Consent Basis` set, is not DND, no
   `opted-out` tag, and `Review Request Status` is `Not Started`).

**SMS not sending?** Verify:
1. The workflow is published.
2. Quiet hours: current time is within 08:00–20:00 Europe/London (if outside, message queues).
3. The contact is not DND for SMS.
4. The phone number is provisioned and active.
5. Check GHL activity/error logs for SMS send failures.

**Email unsubscribe not triggering opt-out workflow?** Verify:
1. The email template includes the unsubscribe element/merge tag.
2. The Opt-Out Handling workflow's email-unsubscribe trigger is published.
3. Check GHL activity logs to see if the contact unsubscribed (look for an event).

**Merge fields showing as `{{...}}` in sent messages?** Verify:
1. The template uses the correct merge-field syntax (e.g. `{{custom_values.business_name}}`).
2. The custom value is defined and populated (not empty).
3. Resend / retry the message after fixing.

---

## Summary Checklist

### Snapshot build (one-time):
- [ ] Custom fields created (7 total)
- [ ] Custom values defined as placeholders (4 total)
- [ ] Tags created (6 total)
- [ ] Pipeline and stages created
- [ ] SMS templates imported (3 total)
- [ ] Email templates imported (3 total)
- [ ] Review Request Sequence workflow built and published
- [ ] Opt-Out Handling workflow built and published
- [ ] Account-level time zone set to Europe/London
- [ ] Account-level quiet hours set to 08:00–20:00 Europe/London (if applicable)
- [ ] Snapshot exported and saved for re-use

### Per-client onboarding:
- [ ] Sub-account created
- [ ] Snapshot loaded into sub-account
- [ ] Custom values filled in (business name, review link, SMS number, contact email)
- [ ] UK long virtual number provisioned (LC Phone)
- [ ] Google Business Profile connected
- [ ] Contacts imported (with consent-basis audit)
- [ ] Consent basis set for each contact
- [ ] Test send to yourself completed successfully
- [ ] Time zone verified as Europe/London
- [ ] Privacy notice updated by client
- [ ] Service agreement and DPA signed
- [ ] Go-live checks completed
- [ ] First-week monitoring commenced

---

## Next Steps

1. **Read the specifications** behind this guide:
   - `agency/ghl/snapshot-spec.md` — field/tag/custom value definitions
   - `agency/ghl/workflows/review-request-sequence.md` — workflow step-by-step logic
   - `agency/ghl/workflows/opt-out-handling.md` — opt-out handling logic
   - `agency/ghl/uk-phone-sms-settings.md` — phone & SMS compliance settings

2. **Review the campaign copy** before building templates:
   - `agency/campaigns/sms-sequence.md` — SMS message bodies
   - `agency/campaigns/email-sequence.md` — email subject & body
   - `agency/campaigns/google-review-link-guide.md` — how to construct the review link

3. **Understand the legal context:**
   - `agency/compliance/lawful-basis-analysis.md` — PECR & GDPR consent rules
   - `agency/compliance/pecr-consent-flow.md` — how to capture and record consent
   - `agency/compliance/dmcc-review-policy.md` — limitations on review requests (no fake reviews,
     no gating, no incentives)
   - `agency/compliance/dpa-template.md` — client data processing agreement

4. **Launch the first client** using this guide, then **export and save the snapshot** for
   replication to future clients.

5. **Monitor and support:**
   - `agency/ops/monthly-reporting-template.md` — monthly compliance report
   - `agency/ops/complaint-optout-sop.md` — opt-out and complaint handling procedures
