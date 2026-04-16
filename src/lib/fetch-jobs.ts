import { FetchJobStatus } from './types';

// In-memory job store (scoped to the Next.js server process)
// Jobs are kept for 1 hour then pruned
const jobs = new Map<string, FetchJobStatus & { createdAt: number }>();

const JOB_TTL_MS = 60 * 60 * 1000; // 1 hour

export function createJob(jobId: string, total: number): void {
  prune();
  jobs.set(jobId, {
    jobId,
    status: 'running',
    completed: 0,
    total,
    fetched: 0,
    noData: 0,
    errors: 0,
    createdAt: Date.now(),
  });
}

export function updateJob(jobId: string, updates: Partial<FetchJobStatus>): void {
  const job = jobs.get(jobId);
  if (job) jobs.set(jobId, { ...job, ...updates });
}

export function getJob(jobId: string): FetchJobStatus | null {
  const job = jobs.get(jobId);
  if (!job) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt: _createdAt, ...status } = job;
  return status;
}

function prune() {
  const cutoff = Date.now() - JOB_TTL_MS;
  Array.from(jobs.entries()).forEach(([id, job]) => {
    if (job.createdAt < cutoff) jobs.delete(id);
  });
}
