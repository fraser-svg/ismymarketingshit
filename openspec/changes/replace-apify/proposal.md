---
title: Replace Apify with Free Scraping Alternatives
type: change
status: proposed
---

## Why

Apify costs ~$47/month in actor run fees for scraping customer reviews across 13 platforms. The account is at 95% of its $50 monthly limit. Need zero-cost alternatives that produce the same data shape.

## What Changes

- Replace all 13 Apify-powered scrapers with free alternatives:
  - npm packages for App Store, Google Play, Twitter
  - Public APIs for Reddit, Product Hunt
  - Direct HTTP parsing for Trustpilot, Yelp, LinkedIn
  - Cloudflare Browser Rendering (already in project) for G2, Capterra, Google Business, Facebook, Glassdoor
- Remove APIFY_API_TOKEN dependency entirely
- Every scraper must fail gracefully (return empty array, never throw)
- The existing Review type and ScrapeReviewsResult interface stay identical
- No hallucinated data — if a scraper can't get real data, it returns nothing

## Capabilities

### New Capabilities
- `replace-apify`: Drop-in replacement for all 13 Apify-powered review scrapers using free alternatives (npm packages, public APIs, direct HTTP, Cloudflare Browser Rendering)

### Modified Capabilities
<!-- No existing spec capabilities are being modified — this is a full replacement -->

## Impact

- Removes `apify` npm dependency and `APIFY_API_TOKEN` environment variable
- Adds new npm dependencies: `app-store-scraper`, `google-play-scraper`, `@the-convocation/twitter-scraper`, `cheerio`
- `src/lib/services/apify.ts` replaced by new scraping service module
- `src/lib/pipeline/scrape-reviews.ts` import path updated
- Cloudflare Browser Rendering usage increases (5 additional platforms)
- Monthly cost reduced from ~$47/month to $0
