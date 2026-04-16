import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import PageTypeCard from '@/components/comparisons/page-type-card';
import { PageTypeListItem } from '@/lib/types';

async function getPageTypes(): Promise<PageTypeListItem[]> {
  const supabase = createServerClient();

  const { data: pageTypes } = await supabase
    .from('page_types')
    .select('*')
    .order('created_at', { ascending: false });

  if (!pageTypes?.length) return [];

  const enriched = await Promise.all(
    pageTypes.map(async (pt) => {
      const { data: brands } = await supabase
        .from('page_type_brands')
        .select('id')
        .eq('page_type_id', pt.id);

      const brandIds = (brands ?? []).map((b) => b.id);
      let urlCount = 0;
      let lastFetchedAt: string | null = null;

      if (brandIds.length > 0) {
        const { data: urls } = await supabase
          .from('page_type_urls')
          .select('id')
          .in('page_type_brand_id', brandIds);

        urlCount = (urls ?? []).length;
        const urlIds = (urls ?? []).map((u) => u.id);

        if (urlIds.length > 0) {
          const { data: snapshots } = await supabase
            .from('comparison_snapshots')
            .select('fetched_at')
            .in('page_type_url_id', urlIds)
            .order('fetched_at', { ascending: false })
            .limit(1);

          lastFetchedAt = snapshots?.[0]?.fetched_at ?? null;
        }
      }

      return { ...pt, brand_count: brandIds.length, url_count: urlCount, last_fetched_at: lastFetchedAt };
    })
  );

  return enriched;
}

export default async function ComparisonsPage() {
  const pageTypes = await getPageTypes();

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

      {pageTypes.length === 0 ? (
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
