import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { BRAND_COLORS } from '@/lib/thresholds';

// GET /api/comparisons — list all page types with counts
export async function GET() {
  const supabase = createServerClient();

  const { data: pageTypes, error } = await supabase
    .from('page_types')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch page types' }, { status: 500 });
  }

  // Enrich each page type with brand count, url count, last_fetched_at
  const enriched = await Promise.all(
    (pageTypes ?? []).map(async (pt) => {
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

      return {
        ...pt,
        brand_count: brandIds.length,
        url_count: urlCount,
        last_fetched_at: lastFetchedAt,
      };
    })
  );

  return NextResponse.json(enriched);
}

// POST /api/comparisons — create page type with brands and URLs
export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();

  const { name, description, brands } = body as {
    name: string;
    description?: string;
    brands: { brandName: string; urls: string[] }[];
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Insert page type
  const { data: pageType, error: ptError } = await supabase
    .from('page_types')
    .insert({ name: name.trim(), description: description?.trim() || null })
    .select()
    .single();

  if (ptError || !pageType) {
    return NextResponse.json({ error: 'Failed to create page type' }, { status: 500 });
  }

  // Insert brands and their URLs
  for (let i = 0; i < brands.length; i++) {
    const { brandName, urls } = brands[i];
    if (!brandName?.trim()) continue;

    const color = BRAND_COLORS[i % BRAND_COLORS.length];

    const { data: brand, error: brandError } = await supabase
      .from('page_type_brands')
      .insert({ page_type_id: pageType.id, brand_name: brandName.trim(), color })
      .select()
      .single();

    if (brandError || !brand) continue;

    const validUrls = urls
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .map((url) => ({ page_type_brand_id: brand.id, url }));

    if (validUrls.length > 0) {
      await supabase.from('page_type_urls').insert(validUrls);
    }
  }

  return NextResponse.json({ id: pageType.id }, { status: 201 });
}
