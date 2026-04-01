---
title: Replace Apify with Free Scraping Alternatives
type: change
status: proposed
specVersion: "1.0"
---

## ADDED Requirements

### Requirement: Drop-in replacement service module
The new scraping service SHALL export the same `scrapeReviews(domain: string): Promise<ScrapeReviewsResult>` function with identical `Review`, `ReviewCategory`, and `ScrapeReviewsResult` types.
The new service SHALL NOT require any paid API tokens to function.
The new service SHALL remove the Apify npm dependency and APIFY_API_TOKEN environment variable.

#### Scenario: Identical interface
- **WHEN** the pipeline calls `scrapeReviews("stripe.com")`
- **THEN** it SHALL return `{ reviews: Review[], platforms: string[], summary: Record<string, number> }` matching the existing type signature exactly.

#### Scenario: No Apify references remain
- **WHEN** the build is complete
- **THEN** there SHALL be zero imports from `@/lib/services/apify` and zero references to `APIFY_API_TOKEN` in the codebase.

### Requirement: All 13 platform scrapers implemented with graceful failure
Each platform scraper SHALL be implemented using free alternatives (npm packages, public APIs, direct HTTP, or Cloudflare Browser Rendering).
Each individual scraper SHALL catch all errors and return an empty array on failure — never throw.
Each scraper SHALL have a hard timeout (30s default, 60s for browser-rendered platforms).
The overall `scrapeReviews` function SHALL use `Promise.allSettled` so one platform failure never blocks others.

#### Scenario: Individual scraper failure isolation
- **WHEN** the G2 scraper throws an error or times out
- **THEN** the pipeline SHALL continue with results from the other 12 platforms
- **AND** the failed platform SHALL be logged but SHALL NOT appear in the `platforms` array.

#### Scenario: All scrapers fail gracefully
- **WHEN** all 13 scrapers fail
- **THEN** `scrapeReviews` SHALL return `{ reviews: [], platforms: [], summary: {} }` — not throw.

#### Scenario: Timeout enforcement
- **WHEN** any scraper exceeds its timeout
- **THEN** it SHALL be terminated and return an empty array.

### Requirement: No hallucinated or fabricated data
Scrapers SHALL only return data actually extracted from the platform response.
Scrapers SHALL NOT generate placeholder, synthetic, or fallback review text.
If a platform returns no usable data, the scraper SHALL return an empty array.
Each review SHALL include a valid `sourceUrl` pointing to the actual source page.

#### Scenario: Empty response handling
- **WHEN** Trustpilot returns a page with no reviews for a domain
- **THEN** the scraper SHALL return an empty array — not fabricate reviews.

#### Scenario: Source URL integrity
- **WHEN** a review is returned
- **THEN** its `sourceUrl` SHALL be a real URL from the scraped platform, not a constructed guess.

#### Scenario: Partial data handling
- **WHEN** a review is missing author or date fields
- **THEN** those fields SHALL use "Anonymous" or "" respectively — not invented values.

### Requirement: Platform-specific implementations
The following approaches SHALL be used:
- App Store: `app-store-scraper` npm package
- Google Play: `google-play-scraper` npm package
- Reddit: Public JSON API (reddit.com/.json endpoints)
- Product Hunt: Official GraphQL API
- Trustpilot: Direct HTTP + __NEXT_DATA__ parsing
- Yelp: Direct HTTP + HTML parsing with cheerio
- LinkedIn: Direct HTTP + application/ld+json parsing
- G2: Cloudflare Browser Rendering + HTML parsing
- Capterra: Cloudflare Browser Rendering + HTML parsing
- Google Business: Cloudflare Browser Rendering + HTML parsing
- Facebook: Cloudflare Browser Rendering + HTML parsing
- Glassdoor: Cloudflare Browser Rendering + HTML parsing
- Twitter/X: `@the-convocation/twitter-scraper` npm package

#### Scenario: npm package scrapers
- **WHEN** App Store or Google Play scrapers run
- **THEN** they SHALL use the npm package API directly with no browser rendering overhead.

#### Scenario: Cloudflare Browser Rendering scrapers
- **WHEN** G2, Capterra, Google Business, Facebook, or Glassdoor scrapers run
- **THEN** they SHALL reuse the existing Cloudflare Browser Rendering infrastructure from `src/lib/services/cloudflare.ts`.

### Requirement: Pipeline integration unchanged
The `scrapeReviewsStep` function in `src/lib/pipeline/scrape-reviews.ts` SHALL continue to work with minimal changes (just import path update).
All downstream pipeline steps SHALL receive data in the same format.

#### Scenario: Pipeline step compatibility
- **WHEN** the pipeline runs the scrape-reviews step
- **THEN** it SHALL call the new service and return results in the same shape as before.
