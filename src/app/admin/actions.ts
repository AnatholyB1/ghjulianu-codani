'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

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
  const category_id = (formData.get('category_id') as string) || null;
  const description = (formData.get('description') as string) || null;
  const cover_url   = (formData.get('cover_url') as string) || null;
  const bg_url      = (formData.get('background_url') as string) || null;
  const is_public   = formData.get('is_public') === 'true';
  const access_key  = is_public ? null : randomBytes(6).toString('hex');

  const { data, error } = await supabase
    .from('albums')
    .insert({ title, slug, year, category_id, description, cover_url, background_url: bg_url, is_public, access_key })
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
  const category_id = (formData.get('category_id') as string) || null;
  const description = (formData.get('description') as string) || null;
  const cover_url   = (formData.get('cover_url') as string) || null;
  const bg_url      = (formData.get('background_url') as string) || null;
  const is_public   = formData.get('is_public') === 'true';

  // Fetch current to preserve/generate access_key
  const { data: current } = await supabase.from('albums').select('access_key').eq('id', id).single();
  const access_key = is_public ? null : (current?.access_key ?? randomBytes(6).toString('hex'));

  const { error } = await supabase
    .from('albums')
    .update({ title, year, category_id, description, cover_url, background_url: bg_url, is_public, access_key })
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

export async function regenerateAccessKey(id: string) {
  const supabase   = await createClient();
  const access_key = randomBytes(6).toString('hex');
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
  const supabase = await createClient();
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
    maxAge:   60 * 60 * 24 * 30, // 30 days
  });
  return true;
}
