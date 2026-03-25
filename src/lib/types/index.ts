/** A single piece of scraped content with provenance tracking. */
export interface SourceRecord {
  url: string;
  content: string;
  scrapedAt: string;
  source: "website" | "review" | "news" | "tech";
  /** Optional selector or section label for traceability. */
  selector?: string;
}

/** Quality assessment of the scraped data. */
export interface DataQuality {
  valid: boolean;
  confidence: "high" | "medium" | "low";
  pageCount: number;
  reviewCount: number;
  issues: string[];
}

/** Input bundle passed to Claude analysis steps. */
export interface AnalysisInput {
  company: {
    domain: string;
    name?: string;
    industry?: string;
  };
  pages: SourceRecord[];
  reviews: SourceRecord[];
  extras: {
    techStack: string[];
    newsArticles: SourceRecord[];
    archiveSnapshots?: Array<{
      url: string;
      timestamp: string;
      archiveUrl: string;
    }>;
  };
  dataQuality: DataQuality;
}

/** A single voice gap between company narrative and customer perception. */
export interface VoiceGap {
  theme: string;
  companyMessage: string;
  customerPerception: string;
  severity: "critical" | "major" | "minor";
  evidence: {
    companySource: string;
    customerSource: string;
  };
}

/** Result of the narrative gap analysis step. */
export interface NarrativeGapResult {
  mirrorLine: string;
  customerThemes: string[];
  companyThemes: string[];
  gaps: VoiceGap[];
  confidence: "high" | "medium" | "low";
}

/** Result of the customer psychology analysis step. */
export interface CustomerPsychResult {
  buyingMotivations: string[];
  emotionalDrivers: string[];
  objections: string[];
  loyaltyFactors: string[];
  /** Raw review sentiment distribution. */
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

/** A section within the compiled report. */
export interface ReportSection {
  title: string;
  content: string;
  /** Source references for anti-hallucination traceability. */
  citations: string[];
}

/** The final compiled report ready for rendering. */
export interface CompiledReport {
  mirrorLine: string;
  sections: ReportSection[];
  score: number;
  generatedAt: string;
  domain: string;
  narrativeGap: NarrativeGapResult;
  customerPsych: CustomerPsychResult | null;
  /** Optional metadata about data sources used in the analysis. */
  dataSources?: {
    pageCount: number;
    reviewCount: number;
    hnDiscussionCount: number;
    archiveSnapshotCount: number;
  };
}

/** Extended source record with verification metadata. */
export interface VerifiedSourceRecord extends SourceRecord {
  platform: string;
  contentHash: string;
  charCount: number;
  status: "verified" | "partial" | "failed";
}

/** Result of the scrape verification gate. */
export interface ScrapeVerificationResult {
  valid: boolean;
  confidence: "high" | "medium" | "low";
  issues: string[];
  verifiedPages: VerifiedSourceRecord[];
  verifiedReviews: VerifiedSourceRecord[];
}

/** A scraped page with inferred type information. */
export interface ScrapedPage {
  url: string;
  type: "homepage" | "about" | "pricing" | "features" | "blog" | "other";
  content: string;
  sourceRecord: SourceRecord;
}

/** Cloudflare crawl job status response. */
export interface CrawlStatus {
  status: "pending" | "running" | "completed" | "failed";
  finished: number;
  total: number;
}

/** A single result record from a Cloudflare crawl. */
export interface CrawlResultRecord {
  url: string;
  markdown: string;
  status: number;
}

/** Report verification result. */
export interface ReportVerification {
  valid: boolean;
  issues: string[];
  /** When true, hallucinated quotes exceed threshold and the report must be regenerated. */
  shouldRerun?: boolean;
}

/** Persisted job status in Redis. */
export interface JobStatus {
  status: "queued" | "running" | "completed" | "failed";
  domain: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
  reportUrl?: string;
  error?: string;
  /** Current pipeline step for progress tracking. */
  currentStep?: string;
}

/** The Inngest event payload for the analysis pipeline. */
export interface PipelineEvent {
  name: "analysis/requested";
  data: {
    domain: string;
    email: string;
    jobId: string;
  };
}
