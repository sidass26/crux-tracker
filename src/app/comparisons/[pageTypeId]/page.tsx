'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ComparisonDetailResponse, FormFactor, MetricKey } from '@/lib/types';
import { METRIC_CATEGORIES } from '@/lib/thresholds';
import ComparisonHeader from '@/components/comparisons/comparison-header';
import MetricCategorySection from '@/components/comparisons/metric-category-section';
import FetchProgressBar from '@/components/comparisons/fetch-progress-bar';
import BrandDrilldownModal from '@/components/comparisons/brand-drilldown-modal';

export default function ComparisonDetailPage() {
  const { pageTypeId } = useParams<{ pageTypeId: string }>();

  const [data, setData] = useState<ComparisonDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [formFactor, setFormFactor] = useState<FormFactor>('PHONE');
  const [activeJob, setActiveJob] = useState<{ jobId: string; total: number } | null>(null);
  const [drilldown, setDrilldown] = useState<{
    brandId: string;
    brandName: string;
    metricKey: MetricKey;
  } | null>(null);

  const loadData = useCallback(async (ff: FormFactor) => {
    const res = await fetch(`/api/comparisons/${pageTypeId}?formFactor=${ff}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [pageTypeId]);

  useEffect(() => {
    loadData(formFactor);
  }, [loadData, formFactor]);

  function handleFormFactorChange(ff: FormFactor) {
    setFormFactor(ff);
    loadData(ff);
  }

  function handleFetchStart(jobId: string, total: number) {
    setActiveJob({ jobId, total });
  }

  const handleFetchComplete = useCallback(() => {
    setActiveJob(null);
    loadData(formFactor);
  }, [formFactor, loadData]);

  if (loading || !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 h-64" />
          ))}
        </div>
      </div>
    );
  }

  // Find last fetched date across all brands
  const lastFetchedAt: string | null = null;

  return (
    <>
      <ComparisonHeader
        pageType={data.pageType}
        formFactor={formFactor}
        onFormFactorChange={handleFormFactorChange}
        onFetchStart={handleFetchStart}
        lastFetchedAt={lastFetchedAt}
      />

      {activeJob && (
        <FetchProgressBar
          pageTypeId={pageTypeId}
          jobId={activeJob.jobId}
          onComplete={handleFetchComplete}
        />
      )}

      {data.brands.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-500 text-sm">No brands configured. Edit this comparison to add brands.</p>
        </div>
      ) : data.brands.every((b) => b.urlCount === 0) ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-500 text-sm">No URLs added yet.</p>
        </div>
      ) : data.collectionDates.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 py-16 text-center">
          <p className="text-gray-700 font-medium">No CrUX data yet</p>
          <p className="text-sm text-gray-500 mt-1">Click &quot;Run Now&quot; to fetch data for all URLs.</p>
        </div>
      ) : (
        METRIC_CATEGORIES.map((category) => (
          <MetricCategorySection
            key={category.label}
            label={category.label}
            description={category.description}
            metrics={category.metrics as MetricKey[]}
            brands={data.brands}
            onBrandClick={(brandId, brandName, metricKey) =>
              setDrilldown({ brandId, brandName, metricKey })
            }
          />
        ))
      )}

      {drilldown && (
        <BrandDrilldownModal
          pageTypeId={pageTypeId}
          brandId={drilldown.brandId}
          brandName={drilldown.brandName}
          metricKey={drilldown.metricKey}
          formFactor={formFactor}
          onClose={() => setDrilldown(null)}
        />
      )}
    </>
  );
}
