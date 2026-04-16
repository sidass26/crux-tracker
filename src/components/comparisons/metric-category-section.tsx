'use client';

import { BrandAggregateData, MetricKey } from '@/lib/types';
import { METRIC_THRESHOLDS } from '@/lib/thresholds';
import AggregateLineChart from './aggregate-line-chart';

interface MetricCategorySectionProps {
  label: string;
  description: string;
  metrics: MetricKey[];
  brands: BrandAggregateData[];
  onBrandClick: (brandId: string, brandName: string, metricKey: MetricKey) => void;
}

export default function MetricCategorySection({
  label,
  description,
  metrics,
  brands,
  onBrandClick,
}: MetricCategorySectionProps) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <div className={`grid gap-6 ${metrics.length === 1 ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
        {metrics.map((metricKey) => {
          const threshold = METRIC_THRESHOLDS[metricKey];
          return (
            <div key={metricKey} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">{threshold.label}</h3>
                  <p className="text-xs text-gray-400">
                    Good &lt; {threshold.unit === 'ms' && threshold.good >= 1000
                      ? `${threshold.good / 1000}s`
                      : `${threshold.good}${threshold.unit}`}
                    {' · '}
                    Poor &gt; {threshold.unit === 'ms' && threshold.poor >= 1000
                      ? `${threshold.poor / 1000}s`
                      : `${threshold.poor}${threshold.unit}`}
                  </p>
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  p75 avg
                </span>
              </div>
              <AggregateLineChart
                metricKey={metricKey}
                brands={brands}
                onBrandClick={(brandId, brandName) => onBrandClick(brandId, brandName, metricKey)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
