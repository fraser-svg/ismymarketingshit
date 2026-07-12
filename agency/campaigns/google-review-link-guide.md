# Google Review Link Guide

How to find your client's Google Business Profile Place ID and build the direct review link that will be used in all SMS and email review requests.

---

## Step 1: Locate the client's Google Business Profile

You'll need access to the client's Google Business Profile (GBP) account. This is the business listing that appears in Google Maps and Google Search results.

**To find it:**

1. Go to [google.com/business](https://google.com/business) and sign in with the client's business Google account (or an account with access to their GBP).
2. Select the business location from the list.
3. You should see the business name, address, phone number, and other key details.

If the client doesn't have a Google Business Profile yet, create one first by following Google's setup flow. The business must be verified before you can collect reviews.

---

## Step 2: Find the Place ID

The Place ID is a unique identifier Google assigns to each business location. Once you have it, you can build the direct review link.

**Method A: From the GBP dashboard (recommended)**

1. On the GBP home page (after you've selected the location), look at the URL in your browser's address bar.
2. It will look something like: `https://business.google.com/[account-id]/[location-id]/...`
3. The **`[location-id]`** (the long number after your account ID) is your Place ID. Copy it.

**Method B: From Google Maps**

1. Go to [google.com/maps](https://google.com/maps).
2. Search for the business by name.
3. Click on the business listing to open the details panel.
4. Click the "Share" button (arrow icon).
5. Click "Copy link" to copy the full URL.
6. Paste it into a text editor. The URL will look like:
   ```
   https://www.google.com/maps/place/[Business+Name]/...
   ```
7. Look for the parameter `placeId=...` in the URL. The string after `placeId=` is your Place ID.

**Method C: Use Google Places API (advanced, requires API key)**

If neither method above works, the agency can use Google Places API with a valid API key to search for the business and retrieve its Place ID. This requires more technical setup and an active Google Cloud project. Typically not needed for standard onboarding.

---

## Step 3: Build the review link

Once you have the Place ID, construct the review link:

```
https://search.google.com/local/writereview?placeid=[PLACE_ID]
```

Replace `[PLACE_ID]` with the actual Place ID (no brackets).

**Example:**
- Place ID: `ChIJXYaXYaXYaXYaXYaXYaXY`
- Review link: `https://search.google.com/local/writereview?placeid=ChIJXYaXYaXYaXYaXYaXYaXY`

This link will open Google's review form with the business pre-selected. Customers don't need to search; they just write and submit their review.

---

## Step 4: Store in GoHighLevel

Once you've built the link, store it as a custom value in the client's sub-account:

1. In GoHighLevel, go to **Settings > Custom Values** (or your sub-account's equivalent).
2. Find or create the custom value **`google_review_link`** (this should already exist from the snapshot).
3. Enter the full review link URL you built in Step 3.
4. Save.

This custom value will be used as `{{custom_values.google_review_link}}` in all SMS and email templates, so every message automatically includes the correct review link.

---

## Step 5: Test the link

Before enabling the workflow for this client:

1. **Copy the review link** from the custom value in GoHighLevel.
2. **Paste it into a browser address bar** and press Enter.
3. **Verify:**
   - The page loads and shows the business name in the browser title (or the Google search results page with the business highlighted).
   - You can see the "Write a review" button or form.
   - Clicking "Write a review" opens Google's review submission form with the correct business selected.
4. **On mobile:** Test the link on a smartphone or tablet using a mobile browser. It should work just as well, and reviews should be easy to write.

If the link doesn't work:
- Double-check the Place ID has no extra spaces or characters.
- Verify the business is verified in Google Business Profile (unverified listings can't receive reviews).
- Check that the GBP location is the correct one (some large chains have multiple locations with separate Place IDs).

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Business not found" when I click the review link | Check: (1) Place ID is correct and has no spaces, (2) business is verified in Google Business Profile, (3) you're using the right location (multi-location businesses have separate Place IDs per location). |
| Place ID appears in URL but doesn't look like the example | Google occasionally updates Place ID formats. If it starts with "ChIJ" or another prefix and is 20+ characters, it's likely valid. Test it. |
| I can't find the Place ID in the GBP dashboard | Try Method B (Google Maps) instead. If neither works, contact Google Business Profile support. |
| Multiple locations / franchise setup | Each location needs its own Place ID and its own custom value entry in GoHighLevel. Each sub-account should have only one review link (for that location). |

---

## Common questions

**Q: Can we use a shortened URL (e.g. bit.ly) instead of the full writereview link?**
A: Yes, if you prefer. Shortened URLs are easier to type and include in printed materials. But for SMS/email use, the full link works fine and is more transparent. Avoid shorteners if you want customers to see exactly where they're going.

**Q: What if the business has multiple locations?**
A: Each location has its own Google Business Profile and Place ID. If the client has multiple locations, set up a separate sub-account for each, with each sub-account's `google_review_link` custom value pointing to that location's review link.

**Q: Can customers leave reviews without a Google account?**
A: Typically not — customers need a Google account (or Gmail). If this is a barrier for your client's customer base, note that Google Business Profile reviews are still the most valuable for local search visibility, so the effort is worthwhile.

**Q: How do we know reviews are actually being posted?**
A: You can't automatically — Google doesn't send a notification to the business when a review is submitted. Staff must:
1. Check Google Business Profile regularly (weekly recommended).
2. Look for new reviews since the last check.
3. Manually tag those contacts in GoHighLevel with the tag `review-left` (which stops the workflow for that contact and triggers the "goal event" completion).

This is intentional to prevent the workflow from auto-assuming "no reply = no review" and re-asking the customer.

---

## Security & best practice

- **Store the Place ID securely** in GoHighLevel and don't share it publicly in comments or documentation.
- **Test with a real account** (staff member or test email) to confirm the link works before launching the workflow.
- **Monitor reviews regularly** — at least weekly — to spot fake or concerning reviews early and to confirm legitimate reviews are coming through.
- **Keep the link confidential to clients** — don't publish it on social media or in ads as a blanket "leave us a review" call, as this risks attracting fake reviews. Use it only for customers in the automated workflow who have an actual transaction history.

---

## Reference

- Google Business Profile support: [support.google.com/business](https://support.google.com/business)
- Google Places API documentation (if building custom integrations): [developers.google.com/maps/documentation/places](https://developers.google.com/maps/documentation/places)
