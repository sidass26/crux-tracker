'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormFactorToggle from '@/components/form-factor-toggle';
import { FormFactor, PageType } from '@/lib/types';

interface ComparisonHeaderProps {
  pageType: PageType;
  formFactor: FormFactor;
  onFormFactorChange: (ff: FormFactor) => void;
  onFetchStart: (jobId: string, total: number) => void;
  lastFetchedAt?: string | null;
}

export default function ComparisonHeader({
  pageType,
  formFactor,
  onFormFactorChange,
  onFetchStart,
  lastFetchedAt,
}: ComparisonHeaderProps) {
  const router = useRouter();
  const [fetching, setFetching] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRunNow() {
    setFetching(true);
    try {
      const res = await fetch(`/api/comparisons/${pageType.id}/fetch`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.jobId) {
        onFetchStart(data.jobId, data.total);
      }
    } finally {
      setFetching(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${pageType.name}" and all its data?`)) return;
    setDeleting(true);
    await fetch(`/api/comparisons/${pageType.id}`, { method: 'DELETE' });
    router.push('/comparisons');
    router.refresh();
  }

  const lastFetched = lastFetchedAt
    ? new Date(lastFetchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/comparisons" className="hover:text-blue-600 transition-colors">
              Comparisons
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{pageType.name}</span>
          </div>
          {pageType.description && (
            <p className="text-sm text-gray-500">{pageType.description}</p>
          )}
          {lastFetched && (
            <p className="text-xs text-gray-400 mt-1">Last fetched {lastFetched}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FormFactorToggle value={formFactor} onChange={onFormFactorChange} />
          <Link
            href={`/comparisons/${pageType.id}/edit`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleRunNow}
            disabled={fetching}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {fetching ? 'Starting…' : 'Run Now'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
