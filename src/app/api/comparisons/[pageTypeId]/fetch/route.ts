import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { batchFetchCrux, buildWorkItems } from '@/lib/batch-fetch';
import { createJob, updateJob } from '@/lib/fetch-jobs';
import { FormFactor } from '@/lib/types';

const FRESHNESS_DAYS = 28;

type Params = { params: { pageTypeId: string } };

export async function POST(_request: NextRequest, { params }: Params) {
  const supabase = createServerClient();

  // Get all brands + URLs for this page type
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

  // Find URLs already fresh (snapshot within 28 days)
  const cutoff = new Date(Date.now() - FRESHNESS_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: freshSnapshots } = await supabase
    .from('comparison_snapshots')
    .select('page_type_url_id, form_factor')
    .in('page_type_url_id', urlList.map((u) => u.id))
    .gte('fetched_at', cutoff);

  const freshKeys = new Set((freshSnapshots ?? []).map((s) => `${s.page_type_url_id}:${s.form_factor}`));

  const formFactors: FormFactor[] = ['PHONE', 'DESKTOP'];
  const workItems = buildWorkItems(urlList, formFactors, freshKeys);

  const jobId = crypto.randomUUID();
  createJob(jobId, workItems.length);

  if (workItems.length === 0) {
    updateJob(jobId, { status: 'complete', completed: 0, total: 0 });
    return NextResponse.json({ jobId, skipped: urlList.length * 2, message: 'All URLs are fresh' });
  }

  // Run in background (fire and forget — Next.js keeps the server alive)
  void (async () => {
    try {
      const result = await batchFetchCrux(
        workItems,
        async (item, data) => {
          const rawJson = data ?? { error: { code: 404, message: 'chrome ux report data not found' } };
          await supabase.from('comparison_snapshots').insert({
            page_type_url_id: item.urlId,
            form_factor: item.formFactor,
            raw_json: rawJson as object,
          });
        },
        (progress) => {
          updateJob(jobId, {
            completed: progress.completed,
            fetched: progress.fetched,
            noData: progress.noData,
            errors: progress.errors,
          });
        }
      );

      updateJob(jobId, {
        status: 'complete',
        completed: workItems.length,
        fetched: result.fetched,
        noData: result.noData,
        errors: result.errors,
      });
    } catch {
      updateJob(jobId, { status: 'error' });
    }
  })();

  return NextResponse.json({ jobId, total: workItems.length, skipped: urlList.length * 2 - workItems.length });
}
