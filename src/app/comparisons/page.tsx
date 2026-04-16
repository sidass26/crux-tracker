'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageTypeCard from '@/components/comparisons/page-type-card';
import { PageTypeListItem } from '@/lib/types';

export default function ComparisonsPage() {
  const [pageTypes, setPageTypes] = useState<PageTypeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/comparisons')
      .then((res) => res.json())
      .then(setPageTypes)
      .finally(() => setLoading(false));
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
