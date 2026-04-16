'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageTypeCard from '@/components/comparisons/page-type-card';
import { PageTypeListItem } from '@/lib/types';

export default function ComparisonsPage() {
  const [pageTypes, setPageTypes] = useState<PageTypeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/comparisons');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `API error ${res.status}`);
      }
      const data = await res.json();
      setPageTypes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load comparisons');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page Type Comparisons</h1>
          <p className="mt-1 text-sm text-gray-500">
            Aggregate CrUX metrics across competitor page sets — track loading, stability, and interactivity by page type.
          </p>
        </div>
        <Link
          href="/comparisons/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + New comparison
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button onClick={load} className="mt-2 text-sm text-red-600 hover:underline">
            Retry
          </button>
        </div>
      ) : pageTypes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-gray-500 text-sm">No comparisons yet.</p>
          <Link
            href="/comparisons/new"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            Create your first page type comparison →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageTypes.map((pt) => (
            <PageTypeCard key={pt.id} pageType={pt} />
          ))}
        </div>
      )}
    </div>
  );
}
