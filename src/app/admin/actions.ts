'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

/** Service role client — bypasses RLS for key verification */
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Generates a 6-character access code mixing lowercase, uppercase,
 * digits and special characters. 64-char alphabet → no modulo bias.
 */
function generateAccessCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#!$';
  const bytes = randomBytes(6);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

// ── CATEGORIES ────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name     = (formData.get('name') as string).trim();
  const slug     = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { error } = await supabase.from('categories').insert({ name, slug });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/categories');
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();
  const name     = (formData.get('name') as string).trim();
  const slug     = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { error } = await supabase.from('categories').update({ name, slug }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/categories');
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/categories');
}

// ── ALBUMS ─────────────────────────────────────────────────────

export async function createAlbum(formData: FormData) {
  const supabase    = await createClient();
  const title       = (formData.get('title') as string).trim();
  const slug        = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const year        = (formData.get('year') as string) || null;
  const location    = (formData.get('location') as string) || null;
  const category_id = (formData.get('category_id') as string) || null;
  const description = (formData.get('description') as string) || null;
  const cover_url   = (formData.get('cover_url') as string) || null;
  const bg_url      = (formData.get('background_url') as string) || null;
  const is_public   = formData.get('is_public') === 'true';
  const access_key  = is_public ? null : generateAccessCode();

  const { data, error } = await supabase
    .from('albums')
    .insert({ title, slug, year, location, category_id, description, cover_url, background_url: bg_url, is_public, access_key })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/admin/albums');
  revalidatePath('/albums');
  redirect(`/admin/albums/${data.id}`);
}

export async function updateAlbum(id: string, formData: FormData) {
  const supabase    = await createClient();
  const title       = (formData.get('title') as string).trim();
  const year        = (formData.get('year') as string) || null;
  const location    = (formData.get('location') as string) || null;
  const category_id = (formData.get('category_id') as string) || null;
  const description = (formData.get('description') as string) || null;
  const cover_url   = (formData.get('cover_url') as string) || null;
  const bg_url      = (formData.get('background_url') as string) || null;
  const is_public   = formData.get('is_public') === 'true';

  // Fetch current to preserve/generate access_key
  const { data: current } = await supabase.from('albums').select('access_key').eq('id', id).single();
  const access_key = is_public ? null : (current?.access_key ?? generateAccessCode());

  const { error } = await supabase
    .from('albums')
    .update({ title, year, location, category_id, description, cover_url, background_url: bg_url, is_public, access_key })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/albums');
  revalidatePath('/albums');
}

export async function deleteAlbum(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('albums').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/albums');
  revalidatePath('/albums');
  redirect('/admin/albums');
}

/**
 * Persists a new sort order for albums.
 * `orderedIds` is the full list of album IDs in the desired display order (first = shown first).
 * Each album receives sort_order = n - index (so first item has highest sort_order,
 * matching the existing `ORDER BY sort_order DESC`).
 */
export async function reorderAlbums(orderedIds: string[]) {
  const supabase = await createClient();
  const n = orderedIds.length;
  const results = await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from('albums').update({ sort_order: n - idx }).eq('id', id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePath('/admin/albums');
  revalidatePath('/albums');
}

export async function regenerateAccessKey(id: string) {
  const supabase   = await createClient();
  const access_key = generateAccessCode();
  const { error }  = await supabase.from('albums').update({ access_key }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/albums/${id}`);
}

// ── ALBUM PHOTOS ───────────────────────────────────────────────

export async function addAlbumPhoto(album_id: string, formData: FormData) {
  const supabase = await createClient();
  const src      = (formData.get('src') as string).trim();
  const alt      = (formData.get('alt') as string) || null;
  const width    = parseInt(formData.get('width') as string) || 1200;
  const height   = parseInt(formData.get('height') as string) || 800;

  const { error } = await supabase.from('album_photos').insert({ album_id, src, alt, width, height });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/albums/${album_id}`);
}

export async function saveAlbumPhoto(album_id: string, src: string, width: number, height: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('album_photos').insert({ album_id, src, width, height });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/albums/${album_id}`);
  revalidatePath(`/albums`);
}

export async function deleteAlbumPhoto(id: string, album_id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('album_photos').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/albums/${album_id}`);
}

/**
 * Persists a new sort order for album photos.
 * `orderedIds` is the full list of photo IDs in the desired display order.
 * Each photo receives sort_order = its index in that array.
 */
export async function reorderAlbumPhotos(albumId: string, orderedIds: string[]) {
  const supabase = await createClient();
  const updates  = orderedIds.map((id, idx) => ({ id, sort_order: idx }));
  const { error } = await supabase
    .from('album_photos')
    .upsert(updates, { onConflict: 'id' });
  if (error) throw new Error(error.message);
  // Revalidate the public album page so visitors see the new order immediately.
  revalidatePath('/albums');
}

// ── PORTFOLIO ─────────────────────────────────────────────────

export async function addPortfolioPhoto(formData: FormData) {
  const supabase = await createClient();
  const src      = (formData.get('src') as string).trim();
  const alt      = (formData.get('alt') as string) || null;
  const width    = parseInt(formData.get('width') as string) || 1200;
  const height   = parseInt(formData.get('height') as string) || 800;
  const { error } = await supabase.from('portfolio_photos').insert({ src, alt, width, height });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
}

export async function savePortfolioPhoto(src: string, width: number, height: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('portfolio_photos').insert({ src, width, height });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
}

export async function deletePortfolioPhoto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('portfolio_photos').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
}

// ── UPLOAD ────────────────────────────────────────────────────

export async function uploadFile(bucket: string, file: File): Promise<string> {
  const supabase = await createClient();
  const ext      = file.name.split('.').pop();
  const path     = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ── ALBUM ACCESS KEY VERIFICATION ────────────────────────────

export async function verifyAlbumKey(slug: string, key: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data: album } = await supabase
    .from('albums')
    .select('access_key')
    .eq('slug', slug)
    .single();

  if (!album || album.access_key !== key) return false;

  const cookieStore = await cookies();
  cookieStore.set(`album-access-${slug}`, key, {
    httpOnly: true,
    sameSite: 'lax',
    path:     `/albums/${slug}`,
    maxAge:   60 * 60 * 24 * 30,
  });
  return true;
}

// ── CLIENT KEY LOOKUP ─────────────────────────────────────

export async function findAlbumByKey(key: string): Promise<{ slug: string; title: string } | null> {
  const supabase = createServiceClient();
  const { data: album } = await supabase
    .from('albums')
    .select('slug, title, access_key')
    .eq('access_key', key.trim())
    .eq('is_public', false)
    .single();

  if (!album) return null;

  const cookieStore = await cookies();
  cookieStore.set(`album-access-${album.slug}`, album.access_key, {
    httpOnly: true,
    sameSite: 'lax',
    path:     `/albums/${album.slug}`,
    maxAge:   60 * 60 * 24 * 30,
  });
  return { slug: album.slug, title: album.title };
}
