import Link from 'next/link';
import { PageTypeListItem } from '@/lib/types';

interface PageTypeCardProps {
  pageType: PageTypeListItem;
}

export default function PageTypeCard({ pageType }: PageTypeCardProps) {
  const lastFetched = pageType.last_fetched_at
    ? new Date(pageType.last_fetched_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Link href={`/comparisons/${pageType.id}`} className="block group">
      <div className="rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-400 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {pageType.name}
            </h3>
            {pageType.description && (
              <p className="mt-1 text-sm text-gray-500">{pageType.description}</p>
            )}
          </div>
          <span className="text-gray-400 group-hover:text-blue-400 text-lg transition-colors">
            →
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span>
            <strong className="text-gray-900">{pageType.brand_count}</strong> brand
            {pageType.brand_count !== 1 ? 's' : ''}
          </span>
          <span className="text-gray-300">·</span>
          <span>
            <strong className="text-gray-900">{pageType.url_count}</strong> URL
            {pageType.url_count !== 1 ? 's' : ''}
          </span>
          <span className="text-gray-300">·</span>
          <span>
            {lastFetched ? `Last fetched ${lastFetched}` : 'Never fetched'}
          </span>
        </div>
      </div>
    </Link>
  );
}
