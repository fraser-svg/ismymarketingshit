declare module "app-store-scraper" {
  interface SearchOptions {
    term: string;
    num?: number;
  }
  interface ReviewOptions {
    appId: string | number;
    sort?: number;
    num?: number;
    page?: number;
  }
  interface AppResult {
    appId: string | number;
    title: string;
    [key: string]: unknown;
  }
  const sort: { RECENT: number; HELPFUL: number };
  function search(options: SearchOptions): Promise<AppResult[]>;
  function reviews(options: ReviewOptions): Promise<Record<string, unknown>[]>;
  export default { sort, search, reviews };
}

declare module "google-play-scraper" {
  interface SearchOptions {
    term: string;
    num?: number;
  }
  interface ReviewOptions {
    appId: string;
    sort?: number;
    num?: number;
  }
  interface AppResult {
    appId: string;
    title: string;
    [key: string]: unknown;
  }
  const sort: { NEWEST: number; RATING: number; HELPFULNESS: number };
  function search(options: SearchOptions): Promise<AppResult[]>;
  function reviews(
    options: ReviewOptions,
  ): Promise<Record<string, unknown>[] | { data: Record<string, unknown>[] }>;
  export default { sort, search, reviews };
}
