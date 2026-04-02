import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { fetchCruxHistory } from '@/lib/crux';
import { FormFactor, FetchResult } from '@/lib/types';

// POST /api/groups/[groupId]/fetch — "Run Now"
export async function POST(
  _request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const supabase = createServerClient();

  // Get all tracked URLs for this group
  const { data: trackedUrls, error } = await supabase
    .from('tracked_urls')
    .select('*')
    .eq('keyword_group_id', params.groupId);

  if (error || !trackedUrls) {
    return NextResponse.json({ error: 'Failed to get URLs' }, { status: 500 });
  }

  if (trackedUrls.length === 0) {
    return NextResponse.json({ error: 'No URLs in this group' }, { status: 400 });
  }

  const formFactors: FormFactor[] = ['PHONE', 'DESKTOP'];
  const result: FetchResult = { fetched: 0, noData: 0, errors: 0 };

  // Fetch CrUX data for each URL × form factor
  const fetchPromises = trackedUrls.flatMap((trackedUrl: { id: string; url: string }) =>
    formFactors.map(async (formFactor) => {
      try {
        const cruxResponse = await fetchCruxHistory(trackedUrl.url, formFactor);

        const rawJson = cruxResponse || { error: { code: 404, message: 'chrome ux report data not found' } };

        await supabase.from('crux_snapshots').insert({
          tracked_url_id: trackedUrl.id,
          form_factor: formFactor,
          raw_json: rawJson,
        });

        if (cruxResponse) {
          result.fetched++;
        } else {
          result.noData++;
        }
      } catch (err) {
        console.error(`CrUX fetch failed for ${trackedUrl.url} (${formFactor}):`, err);
        result.errors++;
      }
    })
  );

  await Promise.allSettled(fetchPromises);

  return NextResponse.json(result);
}
