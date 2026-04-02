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
