import {
  CruxApiResponse,
  CruxErrorResponse,
  MetricKey,
  ChartDataPoint,
  FormFactor,
} from './types';

const CRUX_API_URL = 'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord';

const METRICS: MetricKey[] = [
  'experimental_time_to_first_byte',
  'first_contentful_paint',
  'largest_contentful_paint',
  'cumulative_layout_shift',
  'interaction_to_next_paint',
];

export async function fetchCruxHistory(
  url: string,
  formFactor: FormFactor
): Promise<CruxApiResponse | null> {
  const apiKey = process.env.CRUX_API_KEY;
  if (!apiKey) throw new Error('CRUX_API_KEY not set');

  const response = await fetch(`${CRUX_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      formFactor,
      metrics: METRICS,
    }),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`CrUX API error ${response.status}: ${JSON.stringify(error)}`);
  }

  return response.json();
}

function sanitizeDensity(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === 'NaN' || value === '') return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
}

function formatDate(date: { year: number; month: number; day: number }): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.month - 1]} ${date.day}`;
}

export function isCruxError(
  json: CruxApiResponse | CruxErrorResponse
): json is CruxErrorResponse {
  return 'error' in json;
}

export function transformCruxResponse(
  response: CruxApiResponse
): Record<MetricKey, ChartDataPoint[]> {
  const { metrics, collectionPeriods } = response.record;
  const result = {} as Record<MetricKey, ChartDataPoint[]>;

  for (const metricKey of METRICS) {
    const metric = metrics[metricKey];
    if (!metric) {
      result[metricKey] = [];
      continue;
    }

    const { histogramTimeseries, percentilesTimeseries } = metric;
    const points: ChartDataPoint[] = [];

    for (let i = 0; i < collectionPeriods.length; i++) {
      const date = formatDate(collectionPeriods[i].lastDate);
      const good = sanitizeDensity(histogramTimeseries[0]?.densities[i]);
      const needsImprovement = sanitizeDensity(histogramTimeseries[1]?.densities[i]);
      const poor = sanitizeDensity(histogramTimeseries[2]?.densities[i]);
      const p75 = percentilesTimeseries.p75s[i] ?? null;

      points.push({ date, good, needsImprovement, poor, p75 });
    }

    result[metricKey] = points;
  }

  return result;
}
