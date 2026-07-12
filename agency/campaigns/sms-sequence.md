# SMS Sequence — Review Requests

Three templates for the Review Request Sequence workflow (initial + 2 follow-ups). Each message:
- Identifies the business by name (`{{custom_values.business_name}}`)
- Asks for honest feedback only — never requests a specific rating or number of stars
- Ends with the STOP opt-out line (PECR-2)
- Fits within 2 SMS segments (306 characters max)
- Sends only between 08:00–20:00 UK time (quiet-hours window, TONE-1)

Replace merge fields with GoHighLevel custom values during setup. Test each message in GHL before sending to ensure formatting and character count after merge-field substitution.

---

## Initial Review Request

**Template name (GHL):** Initial review request

**Merge fields:**
- `{{custom_values.business_name}}`
- `{{custom_values.google_review_link}}`

**Message body:**

```
Hi! Thanks for using {{custom_values.business_name}}. Your honest feedback really matters to us. Please share your review: {{custom_values.google_review_link}} Reply STOP to opt out
```

**Character count:** 164 characters (1 SMS segment)

*Note: Actual count will vary once merge fields are filled in. Example above assumes business name ~20 chars, URL ~70 chars.*

---

## Follow-up 1

**Template name (GHL):** Follow-up 1

**Merge fields:**
- `{{custom_values.business_name}}`
- `{{custom_values.google_review_link}}`

**Message body:**

```
Just checking in — if you've had a moment, we'd really value your honest review of {{custom_values.business_name}}: {{custom_values.google_review_link}} Reply STOP to opt out
```

**Character count:** 195 characters (1 SMS segment)

*Note: Actual count will vary once merge fields are filled in.*

---

## Follow-up 2

**Template name (GHL):** Follow-up 2

**Merge fields:**
- `{{custom_values.business_name}}`
- `{{custom_values.google_review_link}}`

**Message body:**

```
One last reminder — your honest feedback helps others choose {{custom_values.business_name}}. Please review: {{custom_values.google_review_link}} Reply STOP to opt out
```

**Character count:** 174 characters (1 SMS segment)

*Note: Actual count will vary once merge fields are filled in.*

---

## Compliance notes

- **PECR-2:** Every message identifies the business by name and ends with "Reply STOP to opt out" verbatim.
- **TONE-1:** Quiet-hours window (08:00–20:00 Europe/London) configured in the workflow action; frequency capped at 1 initial + 2 follow-ups per transaction.
- **TONE-2:** All three messages ask for honest feedback only, never "a 5-star review" or "a positive review".
- **DMCC-2:** Identical message to all eligible contacts — no branching by sentiment, rating, or customer type.

## Implementation notes for GHL

1. Paste each message body (including merge fields) into the GHL SMS template.
2. Configure the send action's quiet-hours setting to 08:00–20:00 Europe/London.
3. Test with a real (test) contact to verify character count after merge-field replacement.
4. Confirm the STOP line renders as shown and the review link URL is clickable.
