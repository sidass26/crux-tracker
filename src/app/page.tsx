import { createServerClient } from '@/lib/supabase/server';
import GroupCard from '@/components/group-card';
import Link from 'next/link';
import { GroupListItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-700">Supabase not configured</h2>
        <p className="mt-2 text-gray-500">Add your Supabase URL and keys to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">.env.local</code> to get started.</p>
      </div>
    );
  }

  const supabase = createServerClient();

  const { data: groups } = await supabase
    .from('keyword_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-700">No keyword groups yet</h2>
        <p className="mt-2 text-gray-500">Create your first group to start tracking CrUX data.</p>
        <Link
          href="/groups/new"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Keyword Group
        </Link>
      </div>
    );
  }

  // Get URL counts and last fetched dates
  const groupIds = groups.map((g: { id: string }) => g.id);

  const { data: urls } = await supabase
    .from('tracked_urls')
    .select('id, keyword_group_id')
    .in('keyword_group_id', groupIds);

  const urlIds = (urls || []).map((u: { id: string }) => u.id);

  const { data: snapshots } = urlIds.length > 0
    ? await supabase
        .from('crux_snapshots')
        .select('tracked_url_id, fetched_at')
        .in('tracked_url_id', urlIds)
        .order('fetched_at', { ascending: false })
    : { data: [] };

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

  const enrichedGroups: GroupListItem[] = groups.map((group: { id: string; name: string; created_at: string }) => {
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Keyword Groups</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enrichedGroups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
