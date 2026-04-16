import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { transformCruxResponse, isCruxError } from '@/lib/crux';
import { METRIC_ORDER } from '@/lib/thresholds';
import { MetricKey, AggregateDataPoint, BrandAggregateData, CruxApiResponse } from '@/lib/types';

type Params = { params: { pageTypeId: string } };

// GET /api/comparisons/[pageTypeId]?formFactor=PHONE|DESKTOP
export async function GET(request: NextRequest, { params }: Params) {
  const supabase = createServerClient();
  const formFactor = request.nextUrl.searchParams.get('formFactor') ?? 'PHONE';

  const { data: pageType, error: ptError } = await supabase
    .from('page_types')
    .select('*')
    .eq('id', params.pageTypeId)
    .single();

  if (ptError || !pageType) {
    return NextResponse.json({ error: 'Page type not found' }, { status: 404 });
  }

  const { data: brands, error: brandsError } = await supabase
    .from('page_type_brands')
    .select('*')
    .eq('page_type_id', params.pageTypeId)
    .order('created_at', { ascending: true });

  if (brandsError) {
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }

  const brandAggregates: BrandAggregateData[] = [];
  let sharedDates: string[] = [];

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

    // Get latest snapshot per URL for this form factor (subquery via ordering)
    // We fetch all snapshots and deduplicate to latest per URL in JS
    const { data: allSnapshots } = await supabase
      .from('comparison_snapshots')
      .select('page_type_url_id, fetched_at, raw_json')
      .in('page_type_url_id', urlIds)
      .eq('form_factor', formFactor)
      .order('fetched_at', { ascending: false });

    // Deduplicate: keep only latest snapshot per URL
    const latestByUrl = new Map<string, { raw_json: CruxApiResponse }>();
    for (const snap of allSnapshots ?? []) {
      if (!latestByUrl.has(snap.page_type_url_id)) {
        latestByUrl.set(snap.page_type_url_id, snap as { raw_json: CruxApiResponse });
      }
    }

    // Transform each snapshot
    const transformedList: ReturnType<typeof transformCruxResponse>[] = [];
    Array.from(latestByUrl.values()).forEach((snap) => {
      if (!isCruxError(snap.raw_json)) {
        const t = transformCruxResponse(snap.raw_json as CruxApiResponse);
        transformedList.push(t);
        if (sharedDates.length === 0 && transformedList.length === 1) {
          sharedDates = t[METRIC_ORDER[0]]?.map((p) => p.date) ?? [];
        }
      }
    });

    const weekCount = sharedDates.length || 40;

    // Aggregate per metric
    const metrics = {} as Record<MetricKey, AggregateDataPoint[]>;
    for (const metricKey of METRIC_ORDER) {
      const points: AggregateDataPoint[] = [];
      for (let weekIdx = 0; weekIdx < weekCount; weekIdx++) {
        const date = sharedDates[weekIdx] ?? `Week ${weekIdx + 1}`;
        const values: number[] = [];

        for (const transformed of transformedList) {
          const p75 = transformed[metricKey]?.[weekIdx]?.p75 ?? null;
          if (p75 !== null && typeof p75 === 'number' && !isNaN(p75)) {
            values.push(p75);
          }
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

  return NextResponse.json({
    pageType,
    brands: brandAggregates,
    collectionDates: sharedDates,
  });
}

// PUT /api/comparisons/[pageTypeId] — update name/description
export async function PUT(request: NextRequest, { params }: Params) {
  const supabase = createServerClient();
  const { name, description } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('page_types')
    .update({ name: name.trim(), description: description?.trim() || null })
    .eq('id', params.pageTypeId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/comparisons/[pageTypeId]
export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('page_types')
    .delete()
    .eq('id', params.pageTypeId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
