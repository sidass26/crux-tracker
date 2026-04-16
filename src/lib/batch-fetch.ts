import { fetchCruxHistory } from './crux';
import { FormFactor } from './types';

export interface BatchWorkItem {
  urlId: string;
  url: string;
  formFactor: FormFactor;
}

export interface BatchResult {
  fetched: number;
  noData: number;
  errors: number;
}

export interface FetchProgress extends BatchResult {
  completed: number;
  total: number;
}

// Max ~40 concurrent requests per batch; 5s gap between batches keeps us well under 500 RPM
const BATCH_SIZE = 40;
const BATCH_DELAY_MS = 5000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Batch-fetch CrUX history for a list of work items.
 * Calls onProgress after each item completes so callers can track progress.
 * Returns each result via onResult so the caller can persist to DB.
 */
export async function batchFetchCrux(
  items: BatchWorkItem[],
  onResult: (item: BatchWorkItem, data: Awaited<ReturnType<typeof fetchCruxHistory>>) => Promise<void>,
  onProgress?: (progress: FetchProgress) => void
): Promise<BatchResult> {
  const totals: BatchResult = { fetched: 0, noData: 0, errors: 0 };
  let completed = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (item) => {
        try {
          const data = await fetchCruxHistory(item.url, item.formFactor);
          await onResult(item, data);
          if (data) totals.fetched++;
          else totals.noData++;
        } catch {
          totals.errors++;
        } finally {
          completed++;
          onProgress?.({ ...totals, completed, total: items.length });
        }
      })
    );

    // Delay between batches (not after the last one)
    if (i + BATCH_SIZE < items.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  return totals;
}

/**
 * Build the list of work items for a page type, skipping URLs
 * that already have a fresh snapshot (within 28 days).
 */
export function buildWorkItems(
  urls: { id: string; url: string }[],
  formFactors: FormFactor[],
  freshUrlIds: Set<string> // urlId+formFactor keys that are fresh
): BatchWorkItem[] {
  const items: BatchWorkItem[] = [];
  for (const u of urls) {
    for (const ff of formFactors) {
      const key = `${u.id}:${ff}`;
      if (!freshUrlIds.has(key)) {
        items.push({ urlId: u.id, url: u.url, formFactor: ff });
      }
    }
  }
  return items;
}
