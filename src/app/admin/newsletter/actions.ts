'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getAdminClient } from '@/lib/server/supabaseAdmin';

export interface DeleteResult {
  ok: boolean;
  error?: 'unauthorized' | 'invalid' | 'not_found' | 'suppressed' | 'server';
}

/** Admin session check (proxy.ts guards pages, server actions must check themselves too). */
async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

/**
 * NWS-04 right to erasure. Removes the address from `subscribers`, from `download_requests` (by email) and the
 * `events` rows tied to those requests (events carry no email, only request_id). Service role, server only.
 * A `suppressed` subscriber cannot be deleted: the row is what keeps a bounced / complaining address from
 * being mailed again.
 */
export async function deleteSubscriber(id: string): Promise<DeleteResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'unauthorized' };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: 'invalid' };

  try {
    const db = getAdminClient();
    const { data: sub, error: e0 } = await db.from('subscribers').select('id,email,status').eq('id', id).maybeSingle();
    if (e0) throw e0;
    if (!sub) return { ok: false, error: 'not_found' };
    if (sub.status === 'suppressed') return { ok: false, error: 'suppressed' };

    const email = String(sub.email).toLowerCase();
    const { data: reqs, error: e1 } = await db.from('download_requests').select('id').eq('email', email);
    if (e1) throw e1;
    const reqIds = (reqs ?? []).map((r) => r.id as string);
    if (reqIds.length > 0) {
      const { error } = await db.from('events').delete().in('request_id', reqIds);
      if (error) throw error;
      const { error: e3 } = await db.from('download_requests').delete().eq('email', email);
      if (e3) throw e3;
    }
    const { error: e4 } = await db.from('subscribers').delete().eq('id', id);
    if (e4) throw e4;

    revalidatePath('/admin/newsletter');
    return { ok: true };
  } catch (e) {
    console.error('[admin/newsletter] delete failed:', e instanceof Error ? e.message : e);
    return { ok: false, error: 'server' };
  }
}
