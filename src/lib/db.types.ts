// Auto-generated TypeScript types for the Supabase schema

export interface Category {
  id:         string;
  name:       string;
  slug:       string;
  created_at: string;
}

export interface Album {
  id:             string;
  title:          string;
  slug:           string;
  year:           string | null;
  category_id:    string | null;
  description:    string | null;
  cover_url:      string | null;
  background_url: string | null;
  is_public:      boolean;
  access_key:     string | null;
  sort_order:     number;
  created_at:     string;
  updated_at:     string;
  // joined
  category?:      Category | null;
  photos?:        AlbumPhoto[];
}

export interface AlbumPhoto {
  id:         string;
  album_id:   string;
  src:        string;
  width:      number;
  height:     number;
  alt:        string | null;
  sort_order: number;
  created_at: string;
}

export interface PortfolioPhoto {
  id:         string;
  src:        string;
  width:      number;
  height:     number;
  alt:        string | null;
  sort_order: number;
  created_at: string;
}
