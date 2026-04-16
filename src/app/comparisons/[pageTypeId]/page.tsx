import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { ComparisonDetailResponse } from '@/lib/types';
import { METRIC_ORDER } from '@/lib/thresholds';
import { transformCruxResponse, isCruxError } from '@/lib/crux';
import { CruxApiResponse, MetricKey, AggregateDataPoint, BrandAggregateData } from '@/lib/types';
import ComparisonDetailClient from './comparison-detail-client';

async function getComparisonData(pageTypeId: string): Promise<{
  data: ComparisonDetailResponse;
  lastFetchedAt: string | null;
} | null> {
  const supabase = createServerClient();

  const { data: pageType, error } = await supabase
    .from('page_types')
    .select('*')
    .eq('id', pageTypeId)
    .single();

  if (error || !pageType) return null;

  const { data: brands } = await supabase
    .from('page_type_brands')
    .select('*')
    .eq('page_type_id', pageTypeId)
    .order('created_at', { ascending: true });

  const brandAggregates: BrandAggregateData[] = [];
  let sharedDates: string[] = [];
  let lastFetchedAt: string | null = null;

  for (const brand of brands ?? []) {
    const { data: urls } = await supabase
      .from('page_type_urls')
      .select('id, url')
      .eq('page_type_brand_id', brand.id);

    const urlList = urls ?? [];
    const urlCount = urlList.length;

    if (urlCount === 0) {
      brandAggregates.push({
        brandId: brand.id,
        brandName: brand.brand_name,
        brandColor: brand.color ?? '#6b7280',
        urlCount: 0,
        metrics: Object.fromEntries(METRIC_ORDER.map((m) => [m, []])) as unknown as Record<MetricKey, AggregateDataPoint[]>,
      });
      continue;
    }

    const urlIds = urlList.map((u) => u.id);

    const { data: allSnapshots } = await supabase
      .from('comparison_snapshots')
      .select('page_type_url_id, fetched_at, raw_json')
      .in('page_type_url_id', urlIds)
      .eq('form_factor', 'PHONE')
      .order('fetched_at', { ascending: false });

    // Track last fetched
    if (allSnapshots?.[0]?.fetched_at) {
      if (!lastFetchedAt || allSnapshots[0].fetched_at > lastFetchedAt) {
        lastFetchedAt = allSnapshots[0].fetched_at;
      }
    }

    // Deduplicate to latest snapshot per URL
    const latestByUrl = new Map<string, { raw_json: unknown; fetched_at: string }>();
    for (const snap of allSnapshots ?? []) {
      if (!latestByUrl.has(snap.page_type_url_id)) {
        latestByUrl.set(snap.page_type_url_id, snap);
      }
    }

    const transformedList: ReturnType<typeof transformCruxResponse>[] = [];
    Array.from(latestByUrl.values()).forEach((snap) => {
      if (!isCruxError(snap.raw_json as Parameters<typeof isCruxError>[0])) {
        const t = transformCruxResponse(snap.raw_json as CruxApiResponse);
        transformedList.push(t);
        if (sharedDates.length === 0) {
          sharedDates = t[METRIC_ORDER[0]]?.map((p) => p.date) ?? [];
        }
      }
    });

    const weekCount = sharedDates.length || 0;
    const metrics = {} as Record<MetricKey, AggregateDataPoint[]>;

    for (const metricKey of METRIC_ORDER) {
      const points: AggregateDataPoint[] = [];
      for (let weekIdx = 0; weekIdx < weekCount; weekIdx++) {
        const date = sharedDates[weekIdx] ?? `Week ${weekIdx + 1}`;
        const values: number[] = [];
        for (const t of transformedList) {
          const p75 = t[metricKey]?.[weekIdx]?.p75 ?? null;
          if (typeof p75 === 'number' && !isNaN(p75)) values.push(p75);
        }
        points.push({
          date,
          p75Avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
          urlCount: values.length,
          totalUrls: urlCount,
        });
      }
      metrics[metricKey] = points;
    }

    brandAggregates.push({
      brandId: brand.id,
      brandName: brand.brand_name,
      brandColor: brand.color ?? '#6b7280',
      urlCount,
      metrics,
    });
  }

  return {
    data: { pageType, brands: brandAggregates, collectionDates: sharedDates },
    lastFetchedAt,
  };
}

export default async function ComparisonDetailPage({
  params,
}: {
  params: { pageTypeId: string };
}) {
  const result = await getComparisonData(params.pageTypeId);
  if (!result) notFound();

  return (
    <ComparisonDetailClient
      initialData={result.data}
      pageTypeId={params.pageTypeId}
      lastFetchedAt={result.lastFetchedAt}
    />
  );
}
