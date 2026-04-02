import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// DELETE /api/urls/[urlId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { urlId: string } }
) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('tracked_urls')
    .delete()
    .eq('id', params.urlId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
