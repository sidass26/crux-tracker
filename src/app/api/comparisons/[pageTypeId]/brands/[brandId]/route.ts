import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { transformCruxResponse, isCruxError } from '@/lib/crux';
import { METRIC_THRESHOLDS } from '@/lib/thresholds';
import { MetricKey, CruxApiResponse } from '@/lib/types';

type Params = { params: { pageTypeId: string; brandId: string } };

// GET /api/comparisons/[pageTypeId]/brands/[brandId]?formFactor=PHONE&metric=largest_contentful_paint
// Returns per-URL data for drill-down
export async function GET(request: NextRequest, { params }: Params) {
  const supabase = createServerClient();
  const formFactor = request.nextUrl.searchParams.get('formFactor') ?? 'PHONE';
  const metricKey = (request.nextUrl.searchParams.get('metric') ?? 'largest_contentful_paint') as MetricKey;

  const { data: brand, error: brandError } = await supabase
    .from('page_type_brands')
    .select('*')
    .eq('id', params.brandId)
    .eq('page_type_id', params.pageTypeId)
    .single();

  if (brandError || !brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  const { data: urls } = await supabase
    .from('page_type_urls')
    .select('id, url')
    .eq('page_type_brand_id', params.brandId)
    .order('created_at', { ascending: true });

  const urlList = urls ?? [];

  const drilldownUrls = await Promise.all(
    urlList.map(async (urlRow) => {
      const { data: snapshots } = await supabase
        .from('comparison_snapshots')
        .select('raw_json, fetched_at')
        .eq('page_type_url_id', urlRow.id)
        .eq('form_factor', formFactor)
        .order('fetched_at', { ascending: false })
        .limit(1);

      const snap = snapshots?.[0];
      if (!snap || isCruxError(snap.raw_json)) {
        return {
          id: urlRow.id,
          url: urlRow.url,
          latestP75: null,
          status: 'no-data' as const,
          weeklyP75: [],
          collectionDates: [],
        };
      }

      const transformed = transformCruxResponse(snap.raw_json as CruxApiResponse);
      const metricData = transformed[metricKey] ?? [];
      const weeklyP75 = metricData.map((p) => (typeof p.p75 === 'number' ? p.p75 : null));
      const collectionDates = metricData.map((p) => p.date);
      const latestP75 = weeklyP75.findLast((v) => v !== null) ?? null;

      let status: 'good' | 'needs-improvement' | 'poor' | 'no-data' = 'no-data';
      if (latestP75 !== null) {
        const threshold = METRIC_THRESHOLDS[metricKey];
        if (latestP75 < threshold.good) status = 'good';
        else if (latestP75 < threshold.poor) status = 'needs-improvement';
        else status = 'poor';
      }

      return {
        id: urlRow.id,
        url: urlRow.url,
        latestP75,
        status,
        weeklyP75,
        collectionDates,
      };
    })
  );

  // Sort worst first
  const sorted = drilldownUrls.sort((a, b) => {
    if (a.latestP75 === null) return 1;
    if (b.latestP75 === null) return -1;
    return b.latestP75 - a.latestP75;
  });

  return NextResponse.json({ brand, urls: sorted });
}

// PUT /api/comparisons/[pageTypeId]/brands/[brandId] — replace URLs for this brand
export async function PUT(request: NextRequest, { params }: Params) {
  const supabase = createServerClient();
  const { urls } = await request.json() as { urls: string[] };

  // Delete all existing URLs for this brand
  await supabase.from('page_type_urls').delete().eq('page_type_brand_id', params.brandId);

  const validUrls = (urls ?? [])
    .map((u: string) => u.trim())
    .filter((u: string) => u.length > 0)
    .map((url: string) => ({ page_type_brand_id: params.brandId, url }));

  if (validUrls.length > 0) {
    await supabase.from('page_type_urls').insert(validUrls);
  }

  return NextResponse.json({ ok: true, count: validUrls.length });
}

// DELETE /api/comparisons/[pageTypeId]/brands/[brandId]
export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('page_type_brands')
    .delete()
    .eq('id', params.brandId)
    .eq('page_type_id', params.pageTypeId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
