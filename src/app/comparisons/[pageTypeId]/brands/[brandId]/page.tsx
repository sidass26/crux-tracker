import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { transformCruxResponse, isCruxError } from '@/lib/crux';
import { METRIC_THRESHOLDS, METRIC_ORDER } from '@/lib/thresholds';
import { MetricKey, CruxApiResponse, FormFactor, DrilldownUrl } from '@/lib/types';
import DrilldownTable from '@/components/comparisons/drilldown-table';
import FormFactorToggleWrapper from './form-factor-toggle-wrapper';

async function getBrandData(
  pageTypeId: string,
  brandId: string,
  formFactor: FormFactor,
  metricKey: MetricKey
) {
  const supabase = createServerClient();

  const { data: brand, error } = await supabase
    .from('page_type_brands')
    .select('*, page_types(name)')
    .eq('id', brandId)
    .eq('page_type_id', pageTypeId)
    .single();

  if (error || !brand) return null;

  const { data: urlRows } = await supabase
    .from('page_type_urls')
    .select('id, url')
    .eq('page_type_brand_id', brandId)
    .order('created_at', { ascending: true });

  const drilldownUrls: DrilldownUrl[] = await Promise.all(
    (urlRows ?? []).map(async (urlRow) => {
      const { data: snapshots } = await supabase
        .from('comparison_snapshots')
        .select('raw_json, fetched_at')
        .eq('page_type_url_id', urlRow.id)
        .eq('form_factor', formFactor)
        .order('fetched_at', { ascending: false })
        .limit(1);

      const snap = snapshots?.[0];
      if (!snap || isCruxError(snap.raw_json as Parameters<typeof isCruxError>[0])) {
        return { id: urlRow.id, url: urlRow.url, latestP75: null, status: 'no-data' as const, weeklyP75: [], collectionDates: [] };
      }

      const transformed = transformCruxResponse(snap.raw_json as CruxApiResponse);
      const metricData = transformed[metricKey] ?? [];
      const weeklyP75 = metricData.map((p) => (typeof p.p75 === 'number' ? p.p75 : null));
      const collectionDates = metricData.map((p) => p.date);
      const latestP75 = [...weeklyP75].reverse().find((v) => v !== null) ?? null;

      let status: DrilldownUrl['status'] = 'no-data';
      if (latestP75 !== null) {
        const t = METRIC_THRESHOLDS[metricKey];
        if (latestP75 < t.good) status = 'good';
        else if (latestP75 < t.poor) status = 'needs-improvement';
        else status = 'poor';
      }

      return { id: urlRow.id, url: urlRow.url, latestP75, status, weeklyP75, collectionDates };
    })
  );

  const sorted = drilldownUrls.sort((a, b) => {
    if (a.latestP75 === null) return 1;
    if (b.latestP75 === null) return -1;
    return b.latestP75 - a.latestP75;
  });

  return { brand, drilldownUrls: sorted };
}

export default async function BrandDrilldownPage({
  params,
  searchParams,
}: {
  params: { pageTypeId: string; brandId: string };
  searchParams: { metric?: string; formFactor?: string };
}) {
  const formFactor = (searchParams.formFactor as FormFactor) ?? 'PHONE';
  const metricKey = (searchParams.metric as MetricKey) ?? 'largest_contentful_paint';

  const result = await getBrandData(params.pageTypeId, params.brandId, formFactor, metricKey);
  if (!result) notFound();

  const { brand, drilldownUrls } = result;
  const pageTypeName = (brand.page_types as { name: string } | null)?.name ?? 'Comparison';
  const metricLabel = METRIC_THRESHOLDS[metricKey].label;

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/comparisons" className="hover:text-blue-600">Comparisons</Link>
        <span>/</span>
        <Link href={`/comparisons/${params.pageTypeId}`} className="hover:text-blue-600">{pageTypeName}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{brand.brand_name}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{brand.brand_name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {drilldownUrls.length} URL{drilldownUrls.length !== 1 ? 's' : ''} · {pageTypeName}
          </p>
        </div>
        <FormFactorToggleWrapper
          pageTypeId={params.pageTypeId}
          brandId={params.brandId}
          metricKey={metricKey}
          formFactor={formFactor}
        />
      </div>

      {/* Metric tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {METRIC_ORDER.map((mk) => (
          <Link
            key={mk}
            href={`/comparisons/${params.pageTypeId}/brands/${params.brandId}?metric=${mk}&formFactor=${formFactor}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mk === metricKey
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {METRIC_THRESHOLDS[mk].shortLabel}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-800 mb-4">{metricLabel} — individual URLs</h2>
        {drilldownUrls.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No URLs found.</p>
        ) : (
          <DrilldownTable urls={drilldownUrls} metricKey={metricKey} />
        )}
      </div>
    </div>
  );
}
