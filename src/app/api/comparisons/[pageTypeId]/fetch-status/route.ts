import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/fetch-jobs';

// GET /api/comparisons/[pageTypeId]/fetch-status?jobId=xxx
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 });
  }

  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}
