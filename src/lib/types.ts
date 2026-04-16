// Database row types
export interface KeywordGroup {
  id: string;
  name: string;
  created_at: string;
}

export interface TrackedUrl {
  id: string;
  keyword_group_id: string;
  brand_name: string;
  url: string;
  created_at: string;
}

export interface CruxSnapshot {
  id: string;
  tracked_url_id: string;
  form_factor: 'PHONE' | 'DESKTOP';
  fetched_at: string;
  raw_json: CruxApiResponse | CruxErrorResponse;
}

// CrUX API types
export interface CruxApiResponse {
  record: {
    key: {
      url?: string;
      origin?: string;
      formFactor?: string;
    };
    metrics: Record<string, CruxMetric>;
    collectionPeriods: CollectionPeriod[];
  };
}

export interface CruxErrorResponse {
  error: {
    code: number;
    message: string;
    status?: string;
  };
}

export interface CruxMetric {
  histogramTimeseries: HistogramBucket[];
  percentilesTimeseries: {
    p75s: (number | null)[];
  };
}

export interface HistogramBucket {
  start: number;
  end?: number;
  densities: (number | string | null)[];
}

export interface CollectionPeriod {
  firstDate: { year: number; month: number; day: number };
  lastDate: { year: number; month: number; day: number };
}

// Chart data types
export type MetricKey =
  | 'experimental_time_to_first_byte'
  | 'first_contentful_paint'
  | 'largest_contentful_paint'
  | 'cumulative_layout_shift'
  | 'interaction_to_next_paint';

export interface ChartDataPoint {
  date: string;
  good: number;
  needsImprovement: number;
  poor: number;
  p75: number | string | null;
}

export interface UrlMetricData {
  trackedUrl: TrackedUrl;
  fetchedAt: string | null;
  noData: boolean;
  metrics: Record<MetricKey, ChartDataPoint[]> | null;
}

// API response types
export interface GroupListItem extends KeywordGroup {
  url_count: number;
  last_fetched_at: string | null;
}

export interface FetchResult {
  fetched: number;
  noData: number;
  errors: number;
}

export type FormFactor = 'PHONE' | 'DESKTOP';

// ── Comparison feature ────────────────────────────────────────────────────────

export interface PageType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface PageTypeBrand {
  id: string;
  page_type_id: string;
  brand_name: string;
  color: string | null;
  created_at: string;
}

export interface PageTypeUrl {
  id: string;
  page_type_brand_id: string;
  url: string;
  created_at: string;
}

export interface ComparisonSnapshot {
  id: string;
  page_type_url_id: string;
  form_factor: FormFactor;
  fetched_at: string;
  raw_json: CruxApiResponse | CruxErrorResponse;
}

// One weekly data point for an aggregate brand line
export interface AggregateDataPoint {
  date: string;
  p75Avg: number | null;
  urlCount: number;    // URLs that contributed a non-null p75 this week
  totalUrls: number;   // Total URLs in the brand group
}

export interface BrandAggregateData {
  brandId: string;
  brandName: string;
  brandColor: string;
  urlCount: number;
  metrics: Record<MetricKey, AggregateDataPoint[]>;
}

export interface ComparisonDetailResponse {
  pageType: PageType;
  brands: BrandAggregateData[];
  collectionDates: string[];
}

// List item for /comparisons page
export interface PageTypeListItem extends PageType {
  brand_count: number;
  url_count: number;
  last_fetched_at: string | null;
}

// Fetch job progress (in-memory, returned by polling endpoint)
export interface FetchJobStatus {
  jobId: string;
  status: 'running' | 'complete' | 'error';
  completed: number;
  total: number;
  fetched: number;
  noData: number;
  errors: number;
}

// Drill-down: per-URL data for a brand
export interface DrilldownUrl {
  id: string;
  url: string;
  latestP75: number | null;
  status: 'good' | 'needs-improvement' | 'poor' | 'no-data';
  weeklyP75: (number | null)[];
  collectionDates: string[];
}
