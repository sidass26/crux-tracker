'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormFactor, KeywordGroup, UrlMetricData } from '@/lib/types';
import FormFactorToggle from '@/components/form-factor-toggle';
import ComparisonGrid from '@/components/comparison-grid';

interface GroupDetailResponse {
  group: KeywordGroup;
  urls: UrlMetricData[];
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [formFactor, setFormFactor] = useState<FormFactor>('PHONE');
  const [data, setData] = useState<GroupDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/groups/${groupId}?formFactor=${formFactor}`);
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId, formFactor]);

  async function handleRunNow() {
    setFetching(true);
    setFetchStatus(null);
    try {
      const fetchRes = await fetch(`/api/groups/${groupId}/fetch`, { method: 'POST' });
      const result = await fetchRes.json();
      if (!fetchRes.ok) {
        setFetchStatus(`Error: ${result.error || 'Fetch failed'}`);
      } else {
        const parts = [];
        if (result.fetched > 0) parts.push(`${result.fetched} fetched`);
        if (result.noData > 0) parts.push(`${result.noData} no data`);
        if (result.errors > 0) parts.push(`${result.errors} errors`);
        setFetchStatus(parts.join(', '));
      }
      // Reload chart data
      const res = await fetch(`/api/groups/${groupId}?formFactor=${formFactor}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      setFetchStatus(`Network error: ${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      setFetching(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this keyword group and all its data?')) return;
    await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
    router.push('/');
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-64 bg-gray-50 rounded-lg animate-pulse mt-6" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-red-600">Failed to load group.</div>;
  }

  return (
    <div>
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        &larr; Back to dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.group.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data.urls.length} URL{data.urls.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FormFactorToggle value={formFactor} onChange={setFormFactor} />
          <button
            onClick={handleRunNow}
            disabled={fetching}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {fetching ? 'Fetching...' : 'Run Now'}
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {fetchStatus && (
        <div className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
          fetchStatus.startsWith('Error') || fetchStatus.includes('error')
            ? 'bg-red-50 text-red-700'
            : 'bg-green-50 text-green-700'
        }`}>
          {fetchStatus}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <ComparisonGrid urls={data.urls} />
      </div>
    </div>
  );
}
