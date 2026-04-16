import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { batchFetchCrux, buildWorkItems } from '@/lib/batch-fetch';
import { FormFactor } from '@/lib/types';

// Allow up to 5 minutes for large URL sets
export const maxDuration = 300;

const FRESHNESS_DAYS = 28;

type Params = { params: { pageTypeId: string } };

export async function POST(_request: NextRequest, { params }: Params) {
  const supabase = createServerClient();

  const { data: brands } = await supabase
    .from('page_type_brands')
    .select('id')
    .eq('page_type_id', params.pageTypeId);

  const brandIds = (brands ?? []).map((b) => b.id);
  if (brandIds.length === 0) {
    return NextResponse.json({ error: 'No brands in this page type' }, { status: 400 });
  }

  const { data: urls } = await supabase
    .from('page_type_urls')
    .select('id, url')
    .in('page_type_brand_id', brandIds);

  const urlList = urls ?? [];
  if (urlList.length === 0) {
    return NextResponse.json({ error: 'No URLs in this page type' }, { status: 400 });
  }

  // Skip URLs already fetched within 28 days
  const cutoff = new Date(Date.now() - FRESHNESS_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: freshSnapshots } = await supabase
    .from('comparison_snapshots')
    .select('page_type_url_id, form_factor')
    .in('page_type_url_id', urlList.map((u) => u.id))
    .gte('fetched_at', cutoff);

  const freshKeys = new Set((freshSnapshots ?? []).map((s) => `${s.page_type_url_id}:${s.form_factor}`));
  const formFactors: FormFactor[] = ['PHONE', 'DESKTOP'];
  const workItems = buildWorkItems(urlList, formFactors, freshKeys);

  if (workItems.length === 0) {
    return NextResponse.json({ fetched: 0, noData: 0, errors: 0, skipped: urlList.length * 2 });
  }

  // Run synchronously so Vercel doesn't kill the function before writes complete
  const result = await batchFetchCrux(workItems, async (item, data) => {
    await supabase.from('comparison_snapshots').insert({
      page_type_url_id: item.urlId,
      form_factor: item.formFactor,
      raw_json: (data ?? { error: { code: 404, message: 'chrome ux report data not found' } }) as object,
    });
  });

  return NextResponse.json({
    ...result,
    total: workItems.length,
    skipped: urlList.length * 2 - workItems.length,
  });
}
