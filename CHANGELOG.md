# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0.0] - 2026-03-31

### Changed
- Replace Apify review scraping with 13 free alternatives (direct HTTP, npm packages, Cloudflare Browser Rendering)
- App Store and Google Play reviews now use dedicated npm packages (`app-store-scraper`, `google-play-scraper`)
- Reddit mentions use the public JSON API (no auth needed)
- Trustpilot reviews parsed from `__NEXT_DATA__` without JS rendering
- G2, Capterra, Google Business, Facebook, Glassdoor use existing Cloudflare Browser Rendering
- Twitter/X mentions scraped via Nitter fallback instances
- Product Hunt and LinkedIn profiles parsed from HTML meta tags and JSON-LD

### Removed
- Apify dependency and `APIFY_API_TOKEN` environment variable
- `src/lib/services/apify.ts` (replaced by `src/lib/services/reviews.ts`)

### Added
- SSRF prevention allowlist on Cloudflare Browser Rendering helper
- Timeout on all Cloudflare render requests
- Type declarations for `app-store-scraper` and `google-play-scraper`
