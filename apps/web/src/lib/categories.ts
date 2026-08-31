import { useEffect, useState } from 'react';
import api from '@/api/client';

/**
 * Centralised category source.
 *
 * Categories are managed once in the admin "Categories" page (backend `/categories`)
 * and surfaced here so the storefront filter, the product form and the admin/super
 * admin dashboards all stay in sync instead of each carrying its own hardcoded list.
 */

// Fallback list used while the API loads or if it's unreachable, so the UI still renders.
export const DEFAULT_CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports',
  'Books', 'Furniture', 'Kids & Baby', 'Pet Supplies', 'Auto',
];

// Tailwind classes used for category badges. Picked by index in the category list so
// the same category gets the same color everywhere.
const BADGE_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-pink-100 text-pink-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-rose-100 text-rose-700',
];

const toTitleCase = (str: string) => str.replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Loads the managed categories (backend `/categories`) as a title-cased list.
 * Falls back to DEFAULT_CATEGORIES on error so screens never break.
 */
export function useCategories() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/categories')
      .then((res) => {
        if (cancelled) return;
        const cats = res.data?.data || [];
        if (cats.length) {
          setCategories(cats.map((c: any) => toTitleCase(String(c.name || ''))));
        }
      })
      .catch(() => { /* keep defaults */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { categories, loading };
}

/**
 * Consistent badge color for a category, based on its position in the synced list.
 * Unmapped categories fall back to a neutral gray.
 */
export function getCategoryBadge(categories: string[], name = '') {
  const idx = categories.findIndex((c) => c.toLowerCase() === String(name).toLowerCase());
  if (idx === -1) return 'bg-gray-100 text-gray-700';
  return BADGE_COLORS[idx % BADGE_COLORS.length];
}
