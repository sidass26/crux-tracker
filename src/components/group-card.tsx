'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GroupListItem } from '@/lib/types';

export default function GroupCard({ group, onRefresh }: { group: GroupListItem; onRefresh?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRunNow(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    try {
      await fetch(`/api/groups/${group.id}/fetch`, { method: 'POST' });
      onRefresh?.();
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={() => router.push(`/groups/${group.id}`)}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{group.name}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {group.url_count} URL{group.url_count !== 1 ? 's' : ''}
          </p>
          {group.last_fetched_at && (
            <p className="mt-1 text-xs text-gray-400">
              Last fetched: {new Date(group.last_fetched_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <button
          onClick={handleRunNow}
          disabled={loading}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Running...' : 'Run Now'}
        </button>
      </div>
    </div>
  );
}
