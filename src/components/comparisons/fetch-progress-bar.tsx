'use client';

import { useEffect, useRef, useState } from 'react';
import { FetchJobStatus } from '@/lib/types';

interface FetchProgressBarProps {
  pageTypeId: string;
  jobId: string;
  onComplete: () => void;
}

export default function FetchProgressBar({ pageTypeId, jobId, onComplete }: FetchProgressBarProps) {
  const [status, setStatus] = useState<FetchJobStatus | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/comparisons/${pageTypeId}/fetch-status?jobId=${jobId}`);
        if (!res.ok) return;
        const data: FetchJobStatus = await res.json();
        setStatus(data);

        if (data.status === 'complete' || data.status === 'error') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (data.status === 'complete') {
            setTimeout(onComplete, 800); // brief pause before refreshing
          }
        }
      } catch {
        // ignore transient errors
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pageTypeId, jobId, onComplete]);

  if (!status) return null;

  const pct = status.total > 0 ? Math.round((status.completed / status.total) * 100) : 0;
  const isError = status.status === 'error';
  const isDone = status.status === 'complete';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {isError
            ? 'Fetch failed'
            : isDone
            ? 'Fetch complete'
            : `Fetching CrUX data… ${status.completed}/${status.total}`}
        </span>
        <span className="text-sm text-gray-500">
          {isDone && (
            <>
              {status.fetched} fetched · {status.noData} no data · {status.errors} errors
            </>
          )}
          {!isDone && !isError && `${pct}%`}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isError ? 'bg-red-500' : isDone ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${isError ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}
