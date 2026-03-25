import type { AnalysisInput, NarrativeGapResult } from "../types";

/**
 * Builds the customer psychology analysis prompt.
 *
 * Adapted from PatrickVersion 04-customer-psychology.md.
 * Only meaningful when 3+ reviews exist.
 *
 * Kept: before state, emotional payoff, switching trigger,
 *       recommendation language, doorman test.
 * Cut:  taxi test (no founder data), loss aversion, social proof (too granular).
 */
export function buildCustomerPsychologyPrompt(
  input: AnalysisInput,
  narrativeGap: NarrativeGapResult,
): string {
  const companyName = input.company.name ?? input.company.domain;

  const reviewsBlock = input.reviews
    .map(
      (r) =>
        `--- REVIEW (${r.source}, ${r.url}) ---\n${r.content}\n--- END REVIEW ---`,
    )
    .join("\n\n");

  const homepageCopy = input.pages
    .find((p) => p.url.replace(/\/$/, "").endsWith(input.company.domain) || p.url.includes("://"))
    ?.content.slice(0, 3000) ?? "";

  const gapsSummary = narrativeGap.gaps
    .map(
      (g) =>
        `- ${g.theme}: Company says "${g.companyMessage}". Customers say "${g.customerPerception}".`,
    )
    .join("\n");

  return `TASK: Customer Psychology Profile for ${companyName}

The narrative gap analysis found: "${narrativeGap.mirrorLine}"

Key gaps identified:
${gapsSummary}

Now go deeper into the customer side. Understand WHY customers buy, what emotional state they were in before, what triggered the switch, and how they describe this product to other people.

You are building a psychological profile of the buyer. Not a persona with a stock photo and a made-up name. A real understanding of the emotional journey from "I have a problem" to "I chose this product" to "I am telling other people about it".

Every finding must be grounded in actual review quotes. If you cannot find evidence for a section, mark it as "insufficient_data" rather than speculating.

TOTAL REVIEWS: ${input.dataQuality.reviewCount}

=== CUSTOMER REVIEWS ===
${reviewsBlock}

=== HOMEPAGE COPY (for doorman test comparison) ===
${homepageCopy}

---

SECTION 1: BEFORE STATE
What was life like before this product? Look for:
- Pain language: "We were drowning in...", "I was spending 20 hours a week on..."
- Emotional language: "frustrated", "stressed", "worried", "overwhelmed"
- Specific situations: "Every quarter when the audit came around..."
- Failed alternatives: "We tried [X] and [Y] before this..."

The before state reveals the real pain. The company often does not know what this pain feels like because they solve it from the inside.

SECTION 2: EMOTIONAL PAYOFF
What do customers FEEL after using the product? Not what it does. What they feel. Look for:
- Relief: "I finally...", "I no longer have to..."
- Confidence: "I know that...", "I trust that..."
- Pride: "My team...", "When I showed my boss..."
- Freedom: "I got my weekends back", "I stopped working overtime on..."

Identify the primary emotional payoff (most frequent) and secondary ones. This is the real value proposition.

SECTION 3: SWITCHING TRIGGER
What specifically caused them to buy? Not "they needed a better tool." What happened?
- Crisis: "We failed an audit", "We lost a client"
- Growth pain: "We outgrew our spreadsheet", "We hit 50 employees and everything broke"
- Mandate: "Our new CTO required...", "Regulations changed"
- Peer recommendation: "My colleague at [company] told me about..."

The switching trigger tells you WHEN customers are ready to buy.

SECTION 4: RECOMMENDATION LANGUAGE
How do customers describe this product to other people? Look for:
- One-line recommendations in reviews
- First sentences of reviews (often the most natural description)
- "I would describe this as..." language

Assess the tone:
- Urgent: "You need this now", "Do not wait"
- Casual: "It's pretty good for..."
- Evangelical: "This changed everything", "I tell everyone about this"
- Measured: "After 6 months, I can say it was worth it"

If the company's tagline sounds nothing like this, that is a positioning problem.

SECTION 5: OBJECTION OVERCOME
What hesitations did customers have before buying? Look for:
- "I was worried about...", "My concern was..."
- "The price seemed high but..."
- Cons sections mentioning initial doubts that were resolved

The primary objection is what the company needs to address on the website.

SECTION 6: THE DOORMAN TEST
Imagine describing this product to someone outside the industry.
- Take the website's homepage description. Would a non-expert understand why someone pays for this?
- Take the customer's most natural recommendation quote. Would a non-expert understand that?

If the customer description makes sense to a doorman but the website description does not, that is a positioning failure.

RESPOND WITH THIS EXACT JSON STRUCTURE:
{
  "beforeState": {
    "description": "Concise description of life before this product, grounded in review evidence",
    "evidence": [
      { "quote": "verbatim review quote", "source": "platform or URL" }
    ]
  },
  "emotionalPayoff": {
    "primary": "the main emotional outcome customers describe",
    "secondary": ["additional emotional outcomes"],
    "evidence": [
      { "quote": "verbatim review quote showing primary emotion", "source": "platform or URL" }
    ]
  },
  "switchingTrigger": {
    "description": "what specifically caused customers to switch",
    "pattern": "crisis | growth_pain | mandate | peer_recommendation | other",
    "evidence": [
      { "quote": "verbatim review quote about why they switched", "source": "platform or URL" }
    ]
  },
  "recommendationLanguage": {
    "phrases": ["exact phrase customers use to describe the product"],
    "tone": "urgent | casual | evangelical | measured",
    "evidence": [
      { "quote": "verbatim recommendation quote", "source": "platform or URL" }
    ]
  },
  "objectionOvercome": {
    "primary": "the main hesitation customers had",
    "evidence": [
      { "quote": "verbatim quote about initial doubt", "source": "platform or URL" }
    ]
  },
  "doormanTest": {
    "pass": false,
    "websiteDescription": "exact copy from homepage that a doorman would hear",
    "customerDescription": "exact customer quote that a doorman would hear",
    "explanation": "Why the doorman would or would not understand each version"
  },
  "buyingMotivations": ["motivation 1 grounded in evidence", "motivation 2"],
  "emotionalDrivers": ["driver 1", "driver 2"],
  "objections": ["objection 1", "objection 2"],
  "loyaltyFactors": ["factor 1", "factor 2"],
  "sentimentBreakdown": {
    "positive": 0,
    "neutral": 0,
    "negative": 0
  }
}`;
}
