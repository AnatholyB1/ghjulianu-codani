import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAdminClient } from '@/lib/server/supabaseAdmin';
import { buildSubscribersCsv, exportFilename, type ExportRow } from '@/lib/newsletter/csv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** NWS-05: confirmed subscribers only, UTF-8 BOM, `;`, formula-injection safe. Admin session required. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const db = getAdminClient();
  const rows: ExportRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('subscribers')
      .select('email,status,lang,source,consent_at,consent_text_version')
      .eq('status', 'confirmed')
      .order('email', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error('[admin/newsletter/export] failed:', error.code ?? error.message);
      return NextResponse.json({ error: 'server' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
    rows.push(...((data ?? []) as ExportRow[]));
    if (!data || data.length < PAGE) break;
  }

  const body = buildSubscribersCsv(rows);
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${exportFilename()}"`,
      'Cache-Control': 'no-store',
    },
  });
}
