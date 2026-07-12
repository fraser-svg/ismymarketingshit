# Legal Research Notes — UK Review-Automation Compliance

> **"This is a template for information purposes, not legal advice. Have a solicitor
> review it before use."**

**Prepared by:** compliance-researcher agent
**Date of research:** 2026-07-12
**Purpose:** Verify the factual/legal claims in `.claude/skills/build-agency/references/uk-compliance-checklist.md` against current primary sources, with citations. This document is research input for the legal-drafter agent's templates. It does not itself set the compliance rules (the checklist does) and it is not legal advice.

---

## 1. DMCC Act 2024 — fake reviews banned practice, commencement, CMA guidance

**Claim being checked (checklist DMCC-1..5):** the fake/incentivised/gated-review banned practices are in force from 6 April 2025; CMA guidance covers gating, incentivised reviews, and "reasonable and proportionate steps."

**Findings:**

- **Statute.** Digital Markets, Competition and Consumers Act 2024, Schedule 20 (the banned practices list added to Sch. 1 of the Consumer Protection from Unfair Trading Regulations 2008 framework carried into the DMCC Act's Part 4 Chapter 1 unfair commercial practices regime), paragraph 13, covers consumer reviews:
  - 13(1)(a): submitting or commissioning a fake consumer review ("purporting to be, but is not, based on a person's genuine experience").
  - 13(1)(b): submitting/commissioning a review that conceals that it was incentivised.
  - 13(2): publishing consumer reviews or review information in a misleading way.
  - 13(3): a positive obligation on anyone publishing/giving access to reviews to take **reasonable and proportionate steps** to prevent and remove banned reviews.
  - 13(4): offering a service to a trader to carry out/facilitate these practices is also banned.
  - Source: legislation.gov.uk, DMCC Act 2024, Schedule 20 — https://www.legislation.gov.uk/ukpga/2024/13/schedule/20
- **Commencement.** Confirmed **6 April 2025**, per the Digital Markets, Competition and Consumers Act 2024 (Commencement No. 4 and Transitional and Saving Provisions) Regulations 2025 (S.I. 2025/272), reg. 2(1)(11). This matches — does not contradict — the checklist's "expected 6 April 2025."
- **CMA guidance (CMA208).** "Fake reviews" guidance published by the CMA, **4 April 2025** (short guide: "Short guide for businesses: publishing consumer reviews and complying with consumer protection law"), full guidance document CMA208.
  - Source: gov.uk — https://www.gov.uk/government/publications/fake-reviews-cma208 and short guide https://www.gov.uk/government/publications/fake-reviews-cma208/short-guide-for-businesses-publishing-consumer-reviews-and-complying-with-consumer-protection-law
  - **Reasonable and proportionate steps**: guidance says this is an outcomes-focused, risk-based test — not one-size-fits-all — and expects: a published policy prohibiting fake/incentivised reviews; a risk assessment of the publisher's own exposure; proactive detection (manual + automated); an investigation/removal process for suspicious reviews; and regular review of the effectiveness of these measures. The guidance explicitly states publishers "cannot justify inaction based on a lack of resources" — i.e. small businesses are not exempt from having *some* proportionate process, even if simpler than a large platform's. (Secondary summary corroborated by Travers Smith briefing, 23 April 2025 — https://www.traverssmith.com/knowledge/knowledge-container/preventing-fake-reviews-what-are-reasonable-and-proportionate-steps/)
  - **"Gating" / selective solicitation**: CMA guidance and CMA/law-firm commentary describe suppressing or selectively promoting reviews as a misleading practice under 13(2): "a trader may infringe the law if they suppress genuine negative or positive reviews, selectively promote positive or negative reviews or omit information around how reviews have been written." Related prohibited conduct flagged in commentary: making dispute resolution conditional on not leaving a negative review, and pressuring customers to submit a private complaint instead of a public review. This directly supports the checklist's DMCC-2 "no sentiment pre-screening / no routing unhappy customers away from the public ask" rule, though note the CMA's own primary guidance frames this under the general "misleading practices" limb (13(2)) rather than using the word "gating" as a defined term — "gating" is industry/legal-commentary shorthand, not itself a statutory term. (techuk summary; Reed Smith "Four months into the DMCC" Aug 2025 — https://www.reedsmith.com/en/perspectives/2025/08/four-months-into-the-dmcc-navigating-cma-guidance-and-what-to-expect; CMA208 short guide as above)
  - **Enforcement posture**: CMA indicated a supportive/lighter-touch approach for the first ~3 months (to July 2025), after which it expects publishers to have taken steps and will consider enforcement. The CMA has since opened investigations into specific businesses over fake/misleading reviews (reported March 2026 — Herbert Smith Freehills Kramer, https://www.hsfkramer.com/notes/crt/2026-03/cma-launches-first-investigations-into-fake-and-misleading-reviews), confirming the regime is now being actively enforced, not merely guidance-stage. Max penalty: fines up to 10% of global turnover (DMCC Act, consumer protection enforcement powers).
- **Confidence:** High for statute text, commencement date, and CMA publication date (primary sources: legislation.gov.uk and gov.uk successfully fetched). Medium-high for the granular "gating"/"reasonable and proportionate steps" wording — the CMA208 PDF itself could not be parsed by the fetch tool (returned as unreadable binary/encoded stream); findings for those specifics rely on the gov.uk short-guide HTML page (fetched directly, primary) plus consistent corroboration from three independent law-firm briefings (Travers Smith, Reed Smith, techuk). Recommend a human re-check of the full CMA208 PDF directly before finalising client-facing policy wording.

**Bottom line for the harness:** the research above indicates checklist DMCC-1 to DMCC-5 remain consistent with current law and guidance as understood from this research; this is not itself a legal conclusion and should be confirmed by a solicitor. No relaxation warranted.

---

## 2. PECR regulation 22 — review requests as direct marketing, soft opt-in, sole traders

**Claim being checked (checklist PECR-1..5):** review invitations are direct marketing under PECR reg 22; soft opt-in has four limbs; sole traders/non-limited partnerships count as individual subscribers; opt-out must be offered at collection and in every message.

**Findings:**

- **Statute — PECR reg 22.** Privacy and Electronic Communications (EC Directive) Regulations 2003, regulation 22:
  - 22(1): applies to unsolicited electronic mail to **individual subscribers**.
  - 22(2): general prohibition on transmitting/instigating unsolicited direct-marketing electronic mail without the recipient's prior consent.
  - 22(3): the soft opt-in exception — contact details obtained in the course of a sale or negotiation for sale of a product/service; the current message concerns only the sender's own **similar** products/services; and the recipient was given a simple, free means to refuse both at collection and in every subsequent message.
  - Source: legislation.gov.uk, PECR reg 22 — https://www.legislation.gov.uk/uksi/2003/2426/regulation/22
  - This matches the checklist's four soft-opt-in limbs (a)-(d) essentially verbatim.
- **"Direct marketing" definition.** PECR reg 22 does not itself define "direct marketing"; it is defined in Data Protection Act 2018 s.122(5) as "the communication (by whatever means) of advertising or marketing material which is directed to particular individuals" — a deliberately broad definition covering promotion of "aims and ideals" as well as sales, and not limited to commercial selling. Source: legislation.gov.uk, DPA 2018 s.122 — https://www.legislation.gov.uk/ukpga/2018/12/section/122.
  - **Application to review requests:** a message soliciting a review is a communication directed at a particular individual for a promotional purpose (building the business's public reputation/ratings) and is treated by the ICO and UK data-protection practitioners as direct marketing falling within this definition — this is the consistent, settled position in ICO-derived secondary guidance and legal commentary reviewed (e.g. Geldards, Lewis Silkin, ConsentTrail summaries of ICO's electronic-mail-marketing guidance). I was **not able to directly fetch the ICO's own guidance pages** — https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/ and the related "marketing and data protection in detail" page — both returned HTTP 403 (ICO's site appears to block this fetch tool's requests, distinct from a content/authority problem). I could not locate any dissenting authority holding review requests are exempt from PECR, and none of the secondary sources reviewed suggested a genuinely non-promotional "pure transactional" reading is available for a review invitation. Recommend a human directly re-open the ICO's live guidance pages (URLs above) to pull an exact quoted line before the legal-drafter finalises `pecr-consent-flow.md`.
  - **Soft opt-in scope limits** (secondary sources, consistent across Geldards/Lewis Silkin/ICO-guidance summaries): soft opt-in only covers the sender's own products/services to their own past customers whose details were collected directly (not bought-in lists, not from a broker/third party); "no third-party marketing list is compliant with soft opt-in." This is directly relevant if the harness or client agency ever considers using third-party-sourced contact lists for review requests — it must not.
  - **New unrelated soft opt-in**: the Data (Use and Access) Act 2025 added a *charitable-purposes* soft opt-in (PECR reg 22(3A)), with ICO final guidance published 27 April 2026. This is not relevant to a commercial review-automation agency and does not change PECR-1..5, but is noted so nobody mistakenly imports its (different) conditions.
- **Sole traders / non-limited partnerships as "individual subscribers."** This is the settled, long-standing PECR position (an "individual subscriber" includes sole traders and unincorporated partnerships, but not limited companies) and is consistent with what the checklist states in PECR-5. I was unable to pull the exact current ICO page confirming this due to the same 403 fetch issue, but this is uncontested across all secondary sources reviewed and is a stable, unchanged feature of PECR since 2003 — no reason to expect the law changed.
- **Confidence:** High for the statutory text (fetched directly from legislation.gov.uk) and for the general "review requests = direct marketing" conclusion (strong, unanimous secondary corroboration). Medium for exact current ICO page wording, due to inability to fetch ico.org.uk directly in this session (HTTP 403 on every attempt, including via a web.archive.org fallback, which this tool cannot reach at all). This is a tooling limitation, not a signal that the guidance has changed — but it should be manually spot-checked.

**Bottom line for the harness:** the research above indicates checklist PECR-1 to PECR-5 remain consistent with current law as understood from this research; this is not itself a legal conclusion and should be confirmed by a solicitor. No relaxation warranted. Flag the ICO direct-fetch gap for human follow-up rather than as a substantive discrepancy.

---

## 3. ICO data protection fee — current tiers and amounts

**Claim being checked (checklist GDPR-5):** both agency and clients must pay the ICO data protection fee; pack should point to ICO fee self-assessment.

**Findings:**

- Current fee structure (three tiers), per multiple independent secondary sources summarising the ICO's published fee tiers (direct fetch of ico.org.uk/for-organisations/data-protection-fee/ pages returned HTTP 403 in this session):
  - **Tier 1 (micro)**: turnover ≤ £632,000 and ≤ 10 staff (or, alternatively, public-sector/charity criteria) → **£52** standard, **£47** by Direct Debit.
  - **Tier 2 (small/medium)**: turnover ≤ £36 million and ≤ 250 staff → **£78** standard, **£73** by Direct Debit.
  - **Tier 3 (large)**: anyone not qualifying for Tier 1 or 2 → **£3,763**.
  - Charities and small occupational pension schemes pay the Tier 1 rate regardless of size/turnover.
  - Sources (secondary, cross-corroborating): dataguard.com fee explainer, formationshunt.co.uk "ICO Data Protection Fee 2026" article, sprintlaw.co.uk fee/bands article. These are practitioner summaries, not primary ICO text — I was unable to load the ICO's own fee page directly (403).
- **Recommendation for the pack:** state the tiers with the above figures, but instruct both agency and client to confirm the live figure via the ICO's own fee self-assessment tool before paying, since fees are reviewed periodically by the ICO and can change without a corresponding change to the enabling legislation (the fee levels sit in secondary legislation — the Data Protection (Charges and Information) Regulations 2018, as amended — not primary statute).
- **Confidence:** Medium. Numbers are consistent across three independent secondary sources and match figures that have been stable since a 2024 uprating I'm aware of, but I could not confirm them against ICO's own current page in this session due to the 403 fetch block. Flag for a human to load `https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/` directly and confirm before the `ico-registration-note.md` template is finalised.

**Bottom line for the harness:** the research above indicates the checklist GDPR-5 principle (both agency and client normally must pay) is correct and unaffected regardless of the exact current amount; this is not itself a legal conclusion and should be confirmed by a solicitor. Amounts above are best-available and should be spot-checked.

---

## 4. GoHighLevel data hosting, DPA, sub-processors, UK transfer mechanisms

**Claim being checked (checklist GDPR-6):** GHL stores data on US infrastructure; DPA/pack must flag the need for an Article 46 transfer mechanism (UK IDTA/Addendum, or UK–US Data Bridge where GHL is certified); direct users to verify current sub-processor/transfer terms.

**Findings:**

- **Hosting location.** HighLevel's Data Processing Agreement states: "All personal data [is] stored on AWS and GoogleCloud" — both US-headquartered providers. HighLevel's own sub-processor list (see below) lists Google Cloud Services and Amazon Web Services, Inc. for "Data Storage," located in the **United States**.
  - Source: HighLevel Data Processing Agreement — https://www.gohighlevel.com/data-processing-agreement
- **Sub-processors.** HighLevel's published sub-processor list (fetched directly, current as marked "Last updated: September 2025") includes, among others: Google Cloud Services and Amazon Web Services (data storage, US); Twilio, Mailgun, LeadConnector LLC (communications/messaging, US); Stripe, Chargebacks911 (payments, US); Pendo, ChartMogul, People Data Labs, Mozart Data (analytics, US); OpenAI, BotPress, RetellAI, Synthflow (AI features, US); HighLevel India (support, India).
  - Source: https://www.gohighlevel.com/sub-processors
  - HighLevel commits to giving customers 30 days' notice of new/replaced sub-processors and a right to object/terminate if unresolved (per the DPA text).
- **International transfer mechanisms — confirmed TWO independent valid bases, both live:**
  1. **UK IDTA / UK Addendum to the EU SCCs.** The DPA states the Addendum "incorporates by reference the EU 2021 SCCs, which have been adopted for use by the UK ICO with certain modifications and the addition of the UK Transfer Addendum" — i.e. GHL's contractual paperwork includes the ICO's International Data Transfer Addendum mechanism.
     - Source: HighLevel DPA — https://www.gohighlevel.com/data-processing-agreement
  2. **UK Extension to the EU-U.S. Data Privacy Framework ("UK–US Data Bridge").** HighLevel's own privacy policy states directly: "HighLevel Inc. and LeadConnector LLC comply with the EU-U.S. Data Privacy Framework (EU-U.S. DPF), the UK Extension to the EU-U.S. DPF, and the Swiss-U.S. Data Privacy Framework." This is HighLevel's own self-certification statement (fetched directly from https://www.gohighlevel.com/privacy-policy). The UK Extension (informally the "UK–US Data Bridge") took effect 12 October 2023 (ICO adequacy regulations) and lets UK exporters rely on a certified US importer's DPF certification as an Article 46 adequacy-type transfer mechanism, without needing SCCs/IDTA as well.
     - I attempted to independently verify HighLevel's live entry on the official U.S. Data Privacy Framework registry (dataprivacyframework.gov/participant/4838) but the page renders via JavaScript and the fetch tool could not retrieve the underlying certification record — this should be **manually checked at https://www.dataprivacyframework.gov/ (search "HighLevel")** before the pack relies on it, since DPF certifications must be renewed annually and can lapse.
     - ICO guidance on how the UK Extension works: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/adequacy-regulations/how-does-the-uk-extension-to-the-eu-us-data-privacy-framework-work/ (found via search; not independently fetched — ICO site blocked, see §2).
  - **Conclusion:** the checklist's GDPR-6 wording — "note the need for an Article 46 transfer mechanism (e.g. the UK IDTA / Addendum to EU SCCs, or the UK–US Data Bridge extension where the vendor is certified) and direct users to verify GHL's current sub-processor and transfer terms" — appears, from this research, accurate and, if anything, appropriately cautious: GHL currently appears to rely on **both** mechanisms, but the pack is right to tell users to verify currency (annual DPF re-certification; sub-processor list can change with 30 days' notice) rather than assert a single static compliance state.
- **Confidence:** High for hosting location and DPA/sub-processor content (both pages fetched directly). High for HighLevel's own DPF/UK Extension claim (fetched directly from their privacy policy) but Medium for its live registry validity (could not independently confirm via dataprivacyframework.gov due to a JS-rendering limitation of the fetch tool — recommend a human open that URL in a browser and confirm "Active" status before finalising the DPA template's transfer-mechanism wording).

**Bottom line for the harness:** the research above indicates checklist GDPR-6 is correct and current, but this is not itself a legal conclusion and should be confirmed by a solicitor; no relaxation warranted. Recommend the pack explicitly tell users to re-check DPF "Active" status (it lapses if not renewed) rather than treat the transfer basis as permanently settled.

---

## 5. Google review-content policies — incentives and gating

**Claim being checked (checklist TONE-2, supporting DMCC-2):** Google's platform terms independently prohibit review gating and incentivised reviews, so assets may cite this alongside DMCC-2.

**Findings:**

- Google's Maps/Business Profile user-generated-content policy ("Prohibited and restricted content"), fetched directly, states businesses/merchants must not:
  - "Offer incentives — such as payment, discounts, free goods and/or services — in exchange for posting any review or revision or removal of a negative review."
  - "Discourage or prohibit negative reviews, or selectively solicit positive reviews from customers" (i.e. review gating).
  - Require/pressure customers to leave reviews while on the premises, or dictate specific content to include.
  - Post or solicit reviews involving an undisclosed conflict of interest (current/former employment, contractual/consultory relationship, other affiliation).
  - Google explicitly **permits**: "Solicit or encourage the posting of content that does represent a genuine experience, without offering incentives to do so or attempting to influence the rating or the contents of the review" — i.e. exactly the universal, non-gated, non-incentivised ask the harness's workflows are designed to produce.
  - Source: Google Maps/Business Profile User-Generated Content Policy, "Prohibited & restricted content" — https://support.google.com/contributionpolicy/answer/7400114?hl=en
- **Confidence:** High — fetched directly from Google's own current policy page.

**Bottom line for the harness:** the research above indicates checklist TONE-2's claim that Google's own terms independently forbid gating/incentives is confirmed verbatim; this is not itself a legal conclusion and should be confirmed by a solicitor. No relaxation warranted.

---

## Checklist discrepancies

None found. Every rule in `uk-compliance-checklist.md` that could be checked against a primary or strongly-corroborated secondary source remains, on this research, accurate and, where anything, the checklist is appropriately conservative (e.g. treating soft opt-in review requests as PECR-1 direct marketing by default, and not carving out a B2B exception per PECR-5). No checklist rule appears to need loosening or tightening based on this research — but see the disclaimer above: this is research input, not a legal determination.

Two **sourcing gaps** (not legal discrepancies) should be manually closed by a human before the compliance pack ships to a real client, because this session's fetch tool could not reach the primary pages directly:

1. **ico.org.uk** blocked direct fetches with HTTP 403 across every page attempted (PECR guidance, marketing-and-data-protection-in-detail, data-protection-fee pages), and a web.archive.org fallback is unreachable by this tool entirely. Findings on PECR-1's "review requests = direct marketing" position and the exact current ICO fee figures rely on cross-corroborated secondary sources, not a directly-quoted ICO page. Recommend opening these ICO URLs in a normal browser to pull an exact quote:
   - https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/
   - https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/
2. **dataprivacyframework.gov/participant/4838** renders via JavaScript and could not be read by the fetch tool, so HighLevel's live "Active" DPF certification status (as opposed to their own self-certification statement, which was confirmed) should be manually confirmed in a browser before the DPA template asserts the UK–US Data Bridge basis is currently available.

Also note: the CMA's full CMA208 PDF guidance document could not be parsed by the fetch tool (binary/encoded content); the granular "reasonable and proportionate steps" and gating-adjacent findings above rest on the gov.uk short-guide HTML page (fetched successfully) plus three independent law-firm briefings, not a direct quote from the full PDF. Recommend a human skim CMA208 directly if the legal-drafter wants to quote it verbatim in `dmcc-review-policy.md`.

---

## Source list (all URLs cited above)

- https://www.legislation.gov.uk/ukpga/2024/13/schedule/20 (DMCC Act 2024, Sch. 20)
- https://www.gov.uk/government/publications/fake-reviews-cma208 (CMA208 landing page)
- https://www.gov.uk/government/publications/fake-reviews-cma208/short-guide-for-businesses-publishing-consumer-reviews-and-complying-with-consumer-protection-law (CMA short guide, fetched directly)
- https://assets.publishing.service.gov.uk/media/67eeb64fe9c76fa33048c790/CMA208_-_Fake_reviews_guidance.pdf (full CMA208 PDF — fetch attempted, unreadable; not directly quoted)
- https://www.traverssmith.com/knowledge/knowledge-container/preventing-fake-reviews-what-are-reasonable-and-proportionate-steps/ (law firm briefing, 23 Apr 2025, fetched directly)
- https://www.reedsmith.com/en/perspectives/2025/08/four-months-into-the-dmcc-navigating-cma-guidance-and-what-to-expect (law firm briefing, Aug 2025)
- https://www.hsfkramer.com/notes/crt/2026-03/cma-launches-first-investigations-into-fake-and-misleading-reviews (enforcement update, Mar 2026)
- https://www.legislation.gov.uk/uksi/2003/2426/regulation/22 (PECR reg 22, fetched directly)
- https://www.legislation.gov.uk/ukpga/2018/12/section/122 (DPA 2018 s.122, direct marketing definition)
- ICO guidance pages (secondary-corroborated only, direct fetch blocked 403): https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/ ; https://ico.org.uk/for-organisations/advice-for-small-organisations/direct-marketing-and-data-protection/marketing-and-data-protection-in-detail/ ; https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/ ; https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/adequacy-regulations/how-does-the-uk-extension-to-the-eu-us-data-privacy-framework-work/
- https://www.gohighlevel.com/data-processing-agreement (fetched directly)
- https://www.gohighlevel.com/sub-processors (fetched directly, marked last updated Sept 2025)
- https://www.gohighlevel.com/privacy-policy (fetched directly)
- https://www.dataprivacyframework.gov/participant/4838 (fetch attempted, JS-rendered, not confirmed)
- https://support.google.com/contributionpolicy/answer/7400114?hl=en (Google policy, fetched directly)

---

*This document is research input, not legal advice. All templates derived from it must still carry the LEGAL-1 disclaimer.*
