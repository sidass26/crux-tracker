import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/groups — list all groups with url count and last fetched date
export async function GET() {
  const supabase = createServerClient();

  const { data: groups, error } = await supabase
    .from('keyword_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // For each group, get URL count and last fetched date
  const groupIds = groups.map((g: { id: string }) => g.id);

  const { data: urls } = await supabase
    .from('tracked_urls')
    .select('id, keyword_group_id')
    .in('keyword_group_id', groupIds.length > 0 ? groupIds : ['__none__']);

  const { data: snapshots } = await supabase
    .from('crux_snapshots')
    .select('tracked_url_id, fetched_at')
    .order('fetched_at', { ascending: false });

  // Build lookup maps
  const urlsByGroup = new Map<string, string[]>();
  for (const url of urls || []) {
    const list = urlsByGroup.get(url.keyword_group_id) || [];
    list.push(url.id);
    urlsByGroup.set(url.keyword_group_id, list);
  }

  const latestFetchByUrl = new Map<string, string>();
  for (const snap of snapshots || []) {
    if (!latestFetchByUrl.has(snap.tracked_url_id)) {
      latestFetchByUrl.set(snap.tracked_url_id, snap.fetched_at);
    }
  }

  const result = groups.map((group: { id: string }) => {
    const groupUrlIds = urlsByGroup.get(group.id) || [];
    let lastFetchedAt: string | null = null;
    for (const urlId of groupUrlIds) {
      const fetched = latestFetchByUrl.get(urlId);
      if (fetched && (!lastFetchedAt || fetched > lastFetchedAt)) {
        lastFetchedAt = fetched;
      }
    }
    return {
      ...group,
      url_count: groupUrlIds.length,
      last_fetched_at: lastFetchedAt,
    };
  });

  return NextResponse.json(result);
}

// POST /api/groups — create a group with tracked URLs
export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();
  const { name, urls } = body as {
    name: string;
    urls: { brand_name: string; url: string }[];
  };

  if (!name || !urls || urls.length === 0) {
    return NextResponse.json({ error: 'Name and at least one URL required' }, { status: 400 });
  }

  const { data: group, error: groupError } = await supabase
    .from('keyword_groups')
    .insert({ name })
    .select()
    .single();

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 });
  }

  const urlRows = urls.map((u) => ({
    keyword_group_id: group.id,
    brand_name: u.brand_name,
    url: u.url,
  }));

  const { data: trackedUrls, error: urlError } = await supabase
    .from('tracked_urls')
    .insert(urlRows)
    .select();

  if (urlError) {
    return NextResponse.json({ error: urlError.message }, { status: 500 });
  }

  return NextResponse.json({ ...group, tracked_urls: trackedUrls }, { status: 201 });
}
