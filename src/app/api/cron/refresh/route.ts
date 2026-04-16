import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { batchFetchCrux, buildWorkItems } from '@/lib/batch-fetch';
import { isCruxError } from '@/lib/crux';
import { FormFactor } from '@/lib/types';

// GET /api/cron/refresh
// Secured with CRON_SECRET header; refreshes stale URLs (>28 days) for all features.
// Trigger via Vercel Cron (vercel.json) or an external scheduler.

const FRESHNESS_DAYS = 28;
const formFactors: FormFactor[] = ['PHONE', 'DESKTOP'];

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createServerClient();
  const cutoff = new Date(Date.now() - FRESHNESS_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const results = { keywordGroups: { fetched: 0, noData: 0, errors: 0 }, comparisons: { fetched: 0, noData: 0, errors: 0 } };

  // ── 1. Keyword groups ─────────────────────────────────────────────────────
  const { data: groups } = await supabase.from('keyword_groups').select('id');

  for (const group of groups ?? []) {
    const { data: urls } = await supabase
      .from('tracked_urls')
      .select('id, url')
      .eq('keyword_group_id', group.id);

    if (!urls?.length) continue;

    const { data: freshSnapshots } = await supabase
      .from('crux_snapshots')
      .select('tracked_url_id, form_factor')
      .in('tracked_url_id', urls.map((u) => u.id))
      .gte('fetched_at', cutoff);

    const freshKeys = new Set((freshSnapshots ?? []).map((s) => `${s.tracked_url_id}:${s.form_factor}`));
    const workItems = buildWorkItems(urls, formFactors, freshKeys);
    if (!workItems.length) continue;

    const r = await batchFetchCrux(workItems, async (item, data) => {
      await supabase.from('crux_snapshots').insert({
        tracked_url_id: item.urlId,
        form_factor: item.formFactor,
        raw_json: data ?? { error: { code: 404, message: 'chrome ux report data not found' } },
      });
    });

    results.keywordGroups.fetched += r.fetched;
    results.keywordGroups.noData += r.noData;
    results.keywordGroups.errors += r.errors;
  }

  // ── 2. Comparisons ────────────────────────────────────────────────────────
  const { data: pageTypes } = await supabase.from('page_types').select('id');

  for (const pt of pageTypes ?? []) {
    const { data: brands } = await supabase
      .from('page_type_brands')
      .select('id')
      .eq('page_type_id', pt.id);

    const brandIds = (brands ?? []).map((b) => b.id);
    if (!brandIds.length) continue;

    const { data: urls } = await supabase
      .from('page_type_urls')
      .select('id, url')
      .in('page_type_brand_id', brandIds);

    if (!urls?.length) continue;

    const { data: freshSnapshots } = await supabase
      .from('comparison_snapshots')
      .select('page_type_url_id, form_factor')
      .in('page_type_url_id', urls.map((u) => u.id))
      .gte('fetched_at', cutoff);

    const freshKeys = new Set((freshSnapshots ?? []).map((s) => `${s.page_type_url_id}:${s.form_factor}`));
    const workItems = buildWorkItems(urls, formFactors, freshKeys);
    if (!workItems.length) continue;

    const r = await batchFetchCrux(workItems, async (item, data) => {
      const rawJson = data ?? { error: { code: 404, message: 'chrome ux report data not found' } };
      if (!isCruxError(rawJson)) {
        await supabase.from('comparison_snapshots').insert({
          page_type_url_id: item.urlId,
          form_factor: item.formFactor,
          raw_json: rawJson,
        });
      } else {
        await supabase.from('comparison_snapshots').insert({
          page_type_url_id: item.urlId,
          form_factor: item.formFactor,
          raw_json: rawJson,
        });
      }
    });

    results.comparisons.fetched += r.fetched;
    results.comparisons.noData += r.noData;
    results.comparisons.errors += r.errors;
  }

  return NextResponse.json({ ok: true, results });
}
