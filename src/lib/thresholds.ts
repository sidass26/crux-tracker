import { MetricKey } from './types';

export interface MetricThreshold {
  good: number;
  poor: number;
  unit: string;
  label: string;
  shortLabel: string;
}

export const METRIC_THRESHOLDS: Record<MetricKey, MetricThreshold> = {
  experimental_time_to_first_byte: {
    good: 800,
    poor: 1800,
    unit: 'ms',
    label: 'Time to First Byte',
    shortLabel: 'TTFB',
  },
  first_contentful_paint: {
    good: 1800,
    poor: 3000,
    unit: 'ms',
    label: 'First Contentful Paint',
    shortLabel: 'FCP',
  },
  largest_contentful_paint: {
    good: 2500,
    poor: 4000,
    unit: 'ms',
    label: 'Largest Contentful Paint',
    shortLabel: 'LCP',
  },
  cumulative_layout_shift: {
    good: 0.1,
    poor: 0.25,
    unit: '',
    label: 'Cumulative Layout Shift',
    shortLabel: 'CLS',
  },
  interaction_to_next_paint: {
    good: 200,
    poor: 500,
    unit: 'ms',
    label: 'Interaction to Next Paint',
    shortLabel: 'INP',
  },
};

export const METRIC_ORDER: MetricKey[] = [
  'experimental_time_to_first_byte',
  'first_contentful_paint',
  'largest_contentful_paint',
  'cumulative_layout_shift',
  'interaction_to_next_paint',
];

export const BAND_COLORS = {
  good: '#0cce6b',
  needsImprovement: '#ffa400',
  poor: '#ff4e42',
} as const;

export function getP75Color(value: number | string | null, metricKey: MetricKey): string {
  if (value === null) return '#6b7280'; // gray
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '#6b7280';
  const threshold = METRIC_THRESHOLDS[metricKey];
  if (num < threshold.good) return BAND_COLORS.good;
  if (num < threshold.poor) return BAND_COLORS.needsImprovement;
  return BAND_COLORS.poor;
}

export const METRIC_CATEGORIES: {
  label: string;
  description: string;
  metrics: MetricKey[];
}[] = [
  {
    label: 'Loading Performance',
    description: 'How fast the page loads and first content appears — directly impacts bounce rates.',
    metrics: [
      'experimental_time_to_first_byte',
      'first_contentful_paint',
      'largest_contentful_paint',
    ],
  },
  {
    label: 'Visual Stability',
    description: 'How much the page layout shifts unexpectedly — affects user trust and ad clicks.',
    metrics: ['cumulative_layout_shift'],
  },
  {
    label: 'Interactivity',
    description: 'How quickly the page responds to user inputs like taps and clicks.',
    metrics: ['interaction_to_next_paint'],
  },
];

// 8 distinct brand colors (assigned in order when brands are created)
export const BRAND_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function formatP75(value: number | string | null, metricKey: MetricKey): string {
  if (value === null) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'N/A';
  const threshold = METRIC_THRESHOLDS[metricKey];
  if (metricKey === 'cumulative_layout_shift') {
    return num.toFixed(2);
  }
  if (threshold.unit === 'ms') {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}s` : `${Math.round(num)}ms`;
  }
  return String(num);
}
