import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { transformCruxResponse, isCruxError } from '@/lib/crux';
import { CruxApiResponse, CruxErrorResponse, UrlMetricData, FormFactor } from '@/lib/types';

// GET /api/groups/[groupId]?formFactor=PHONE — group detail with chart data
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const supabase = createServerClient();
  const formFactor = (request.nextUrl.searchParams.get('formFactor') || 'PHONE') as FormFactor;

  // Get group
  const { data: group, error: groupError } = await supabase
    .from('keyword_groups')
    .select('*')
    .eq('id', params.groupId)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  // Get tracked URLs
  const { data: trackedUrls } = await supabase
    .from('tracked_urls')
    .select('*')
    .eq('keyword_group_id', params.groupId)
    .order('created_at', { ascending: true });

  if (!trackedUrls || trackedUrls.length === 0) {
    return NextResponse.json({ group, urls: [] });
  }

  // Get latest snapshots for each URL + form factor
  const urlIds = trackedUrls.map((u: { id: string }) => u.id);
  const { data: snapshots } = await supabase
    .from('crux_snapshots')
    .select('*')
    .in('tracked_url_id', urlIds)
    .eq('form_factor', formFactor)
    .order('fetched_at', { ascending: false });

  // Deduplicate: keep only the latest snapshot per tracked_url_id
  const latestByUrl = new Map<string, { fetched_at: string; raw_json: CruxApiResponse | CruxErrorResponse }>();
  for (const snap of snapshots || []) {
    if (!latestByUrl.has(snap.tracked_url_id)) {
      latestByUrl.set(snap.tracked_url_id, snap);
    }
  }

  // Build response
  const urls: UrlMetricData[] = trackedUrls.map((trackedUrl: { id: string; keyword_group_id: string; brand_name: string; url: string; created_at: string }) => {
    const snapshot = latestByUrl.get(trackedUrl.id);
    if (!snapshot) {
      return { trackedUrl, fetchedAt: null, noData: false, metrics: null };
    }

    const rawJson = snapshot.raw_json;
    if (isCruxError(rawJson)) {
      return { trackedUrl, fetchedAt: snapshot.fetched_at, noData: true, metrics: null };
    }

    const metrics = transformCruxResponse(rawJson);
    return { trackedUrl, fetchedAt: snapshot.fetched_at, noData: false, metrics };
  });

  return NextResponse.json({ group, urls });
}

// DELETE /api/groups/[groupId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('keyword_groups')
    .delete()
    .eq('id', params.groupId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
