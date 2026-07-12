# Email Sequence — Review Requests

Three templates for the Review Request Sequence workflow (initial + 2 follow-ups). Each email:
- Identifies the business by name (`{{custom_values.business_name}}`)
- Asks for honest feedback only — never requests a specific rating or number of stars
- Contains a working unsubscribe link (GHL email builder element, required per PECR-2)
- Includes a reply-to email address for support contact

Replace merge fields with GoHighLevel custom values during setup. Paste the subject and body into GHL email templates exactly as shown. The unsubscribe element is added via GHL's email builder interface, not as text.

---

## Initial Review Request

**Template name (GHL):** Initial review request

**Merge fields:**
- `{{custom_values.business_name}}`
- `{{custom_values.google_review_link}}`
- `{{custom_values.business_contact_email}}`

**Subject line:**

```
We'd value your honest feedback
```

**Email body:**

```
Hi {{firstName}},

Thanks for choosing {{custom_values.business_name}}. We really appreciate your business.

We'd love to hear your honest feedback about your recent experience. If you're happy to share, please leave a review on Google:

{{custom_values.google_review_link}}

Your feedback — whether positive or constructive — helps us improve and helps other customers like you make informed decisions.

Thanks,
{{custom_values.business_name}}

---

If you'd prefer not to receive further emails from us, unsubscribe below.

[unsubscribe link — GHL email builder unsubscribe element, required in every email]

Questions? Contact us at {{custom_values.business_contact_email}}
```

---

## Follow-up 1

**Template name (GHL):** Follow-up 1

**Merge fields:**
- `{{custom_values.business_name}}`
- `{{custom_values.google_review_link}}`
- `{{custom_values.business_contact_email}}`

**Subject line:**

```
Your review matters to us
```

**Email body:**

```
Hi {{firstName}},

We just wanted to check in — if you've had a moment, we'd really value your honest review of {{custom_values.business_name}}.

Whether your experience was great, or there's something we could do better, your feedback helps us improve:

{{custom_values.google_review_link}}

Thanks for taking the time.

{{custom_values.business_name}}

---

If you'd prefer not to receive further emails from us, unsubscribe below.

[unsubscribe link — GHL email builder unsubscribe element, required in every email]

Questions? Contact us at {{custom_values.business_contact_email}}
```

---

## Follow-up 2

**Template name (GHL):** Follow-up 2

**Merge fields:**
- `{{custom_values.business_name}}`
- `{{custom_values.google_review_link}}`
- `{{custom_values.business_contact_email}}`

**Subject line:**

```
One last request — your feedback
```

**Email body:**

```
Hi {{firstName}},

Just one more thing — your honest feedback really helps others find us.

If you've had a moment to share your thoughts on Google, that would mean a lot:

{{custom_values.google_review_link}}

Thanks for your time.

{{custom_values.business_name}}

---

If you'd prefer not to receive further emails from us, unsubscribe below.

[unsubscribe link — GHL email builder unsubscribe element, required in every email]

Questions? Contact us at {{custom_values.business_contact_email}}
```

---

## Compliance notes

- **PECR-2:** Every email identifies the business by name and includes an unsubscribe link (GHL element, not text).
- **TONE-2:** All three emails ask for honest feedback only, never "a 5-star review" or "a positive review".
- **DMCC-2:** Identical message to all eligible contacts — no branching by sentiment, rating, or customer type.

## Implementation notes for GHL

1. In GHL's email template builder, create three email templates matching the template names above.
2. Paste the subject and body exactly as shown (including merge fields) into the corresponding fields.
3. In GHL's template builder, add the platform's unsubscribe element/link via the built-in menu (do not type it as text).
4. Ensure the reply-to address is set to `{{custom_values.business_contact_email}}` or the client's actual email.
5. Test each template by sending a test email to yourself or a test contact, verifying:
   - Subject renders correctly
   - Merge fields substitute properly (business name, review link, contact email)
   - Unsubscribe link is present and clickable
   - Review link is clickable and points to the correct URL
6. Confirm plain-English, UK tone is preserved after any formatting applied by GHL.
