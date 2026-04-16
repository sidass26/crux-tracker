'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DrilldownUrl, FormFactor, MetricKey } from '@/lib/types';
import { METRIC_THRESHOLDS } from '@/lib/thresholds';
import DrilldownTable from './drilldown-table';

interface BrandDrilldownModalProps {
  pageTypeId: string;
  brandId: string;
  brandName: string;
  metricKey: MetricKey;
  formFactor: FormFactor;
  onClose: () => void;
}

export default function BrandDrilldownModal({
  pageTypeId,
  brandId,
  brandName,
  metricKey,
  formFactor,
  onClose,
}: BrandDrilldownModalProps) {
  const [urls, setUrls] = useState<DrilldownUrl[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/comparisons/${pageTypeId}/brands/${brandId}?formFactor=${formFactor}&metric=${metricKey}`
        );
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setUrls(data.urls);
      } catch {
        setError('Failed to load URL data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pageTypeId, brandId, formFactor, metricKey]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const metricLabel = METRIC_THRESHOLDS[metricKey].label;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl mx-0 sm:mx-4">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">
              {brandName} — {metricLabel}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Individual URLs sorted worst first ·{' '}
              {formFactor === 'PHONE' ? 'Mobile' : 'Desktop'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/comparisons/${pageTypeId}/brands/${brandId}?metric=${metricKey}&formFactor=${formFactor}`}
              className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              target="_blank"
            >
              Open full page →
            </Link>
            <button
              onClick={onClose}
              className="ml-2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5">
          {loading && (
            <div className="py-10 text-center text-sm text-gray-500">Loading…</div>
          )}
          {error && (
            <div className="py-10 text-center text-sm text-red-500">{error}</div>
          )}
          {!loading && !error && urls && (
            <DrilldownTable urls={urls} metricKey={metricKey} />
          )}
        </div>
      </div>
    </div>
  );
}
