import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import EditComparisonClient from './edit-comparison-client';

export default async function EditComparisonPage({ params }: { params: { pageTypeId: string } }) {
  const supabase = createServerClient();

  const { data: pageType, error } = await supabase
    .from('page_types')
    .select('*')
    .eq('id', params.pageTypeId)
    .single();

  if (error || !pageType) notFound();

  const { data: brands } = await supabase
    .from('page_type_brands')
    .select('*')
    .eq('page_type_id', params.pageTypeId)
    .order('created_at', { ascending: true });

  const brandsWithUrls = await Promise.all(
    (brands ?? []).map(async (brand) => {
      const { data: urls } = await supabase
        .from('page_type_urls')
        .select('url')
        .eq('page_type_brand_id', brand.id)
        .order('created_at', { ascending: true });

      return {
        brandId: brand.id,
        brandName: brand.brand_name,
        urlsText: (urls ?? []).map((u) => u.url).join('\n'),
      };
    })
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit: {pageType.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update the page type name, description, and the URLs for each brand.
        </p>
      </div>
      <EditComparisonClient
        pageTypeId={params.pageTypeId}
        initialName={pageType.name}
        initialDescription={pageType.description ?? ''}
        initialBrands={brandsWithUrls}
      />
    </div>
  );
}
