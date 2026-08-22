import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import {
  Search, ShoppingCart, ChevronLeft, ChevronRight, Package,
  SlidersHorizontal, X, Grid3X3, List
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  _id: string; name: string; description: string; price: number;
  stock: number; category: string; imageUrl?: string; createdAt?: string;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'Name: A → Z' },
];

const ALL_CATEGORIES = ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports', 'Books', 'Furniture', 'Kids & Baby', 'Pet Supplies', 'Auto'];

export default function ProductList() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // ═══ SINGLE SOURCE OF TRUTH: URL query params ═══
  const selectedCategory = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = (searchParams.get('sort') as SortOption) || 'newest';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Local UI state only for inputs (not synced to URL until committed)
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localMinPrice, setLocalMinPrice] = useState(minPriceParam);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPriceParam);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sync local input state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setLocalSearch(searchParams.get('search') || '');
    setLocalMinPrice(searchParams.get('minPrice') || '');
    setLocalMaxPrice(searchParams.get('maxPrice') || '');
  }, [searchParams]);

  // Helper: update URL params (single source of truth writes)
  const updateParams = (updates: Record<string, string>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      });
      // Reset to page 1 when filters change (unless just changing page)
      if (!('page' in updates)) {
        next.delete('page');
      }
      return next;
    }, { replace: true });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setLocalSearch('');
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setSearchParams({}, { replace: true });
  };

  // ═══ FETCH PRODUCTS ═══
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: any = { page: pageParam, limit: 12 };
    if (selectedCategory) params.category = selectedCategory;
    if (searchQuery) params.search = searchQuery;
    if (minPriceParam) params.minPrice = minPriceParam;
    if (maxPriceParam) params.maxPrice = maxPriceParam;
    if (sortBy === 'price_asc') { params.sort = 'price'; params.order = 'asc'; }
    else if (sortBy === 'price_desc') { params.sort = 'price'; params.order = 'desc'; }
    else if (sortBy === 'name_asc') { params.sort = 'name'; params.order = 'asc'; }
    else { params.sort = 'createdAt'; params.order = 'desc'; }

    api.get('/products', { params }).then((r) => {
      if (cancelled) return;
      setProducts(r.data.data || []);
      setTotalPages(r.data.pagination?.totalPages || 1);
      setTotalCount(r.data.pagination?.totalOrders || (r.data.data || []).length);
    }).catch(() => {
      if (!cancelled) { setProducts([]); setTotalCount(0); }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [pageParam, selectedCategory, searchQuery, minPriceParam, maxPriceParam, sortBy]);

  const addToCart = async (product: Product) => {
    try {
      await api.post('/cart', { productId: product._id, quantity: 1 });
    } catch (err: any) {
      console.error(err);
    }
  };

  const hasActiveFilters = !!(selectedCategory || searchQuery || minPriceParam || maxPriceParam);

  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-foreground">
            {selectedCategory || 'All Products'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-0.5">
            {totalCount} product{totalCount !== 1 ? 's' : ''} found
            {selectedCategory && <span className="text-gray-400"> in <span className="font-medium text-gray-600 dark:text-foreground">{selectedCategory}</span></span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 dark:border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-muted' : ''}`}><Grid3X3 size={14} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-muted' : ''}`}><List size={14} /></button>
          </div>
          {isAdmin && <Link to="/admin/products/new"><Button size="sm">+ Add</Button></Link>}
        </div>
      </div>

      {/* ═══ FILTERS BAR ═══ */}
      <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl p-3 space-y-3">
        {/* Search + Category Dropdown + Price Range */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  updateParams({ search: localSearch.trim() });
                }
              }}
              onBlur={() => {
                // Commit search on blur if changed
                if (localSearch !== searchQuery) {
                  updateParams({ search: localSearch.trim() });
                }
              }}
              placeholder="Search products..."
              className="w-full h-9 pl-9 pr-4 border border-gray-200 dark:border-border rounded-lg text-sm bg-white dark:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Category Dropdown — derives value from URL, writes back to URL */}
          <select
            value={selectedCategory}
            onChange={(e) => updateParams({ category: e.target.value })}
            className="h-9 px-3 border border-gray-200 dark:border-border rounded-lg text-sm bg-white dark:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Price Range */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              onBlur={() => {
                if (localMinPrice !== minPriceParam) updateParams({ minPrice: localMinPrice });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  updateParams({ minPrice: localMinPrice });
                }
              }}
              placeholder="Min ₹"
              className="w-20 h-9 px-2 border border-gray-200 dark:border-border rounded-lg text-sm bg-white dark:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              onBlur={() => {
                if (localMaxPrice !== maxPriceParam) updateParams({ maxPrice: localMaxPrice });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  updateParams({ maxPrice: localMaxPrice });
                }
              }}
              placeholder="Max ₹"
              className="w-20 h-9 px-2 border border-gray-200 dark:border-border rounded-lg text-sm bg-white dark:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Sort + Active Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Sort:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParams({ sort: opt.value === 'newest' ? '' : opt.value })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  sortBy === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* ═══ PRODUCTS GRID ═══ */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl py-20 text-center">
          <Package size={48} className="mx-auto mb-4 text-gray-200 dark:text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-1">
            {selectedCategory ? `No products found in ${selectedCategory}` : 'No products found'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mb-4">Try adjusting your filters or search</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={clearAllFilters}>Clear Filters</Button>
            <Link to="/"><Button>Browse All</Button></Link>
          </div>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p._id} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-gray-50 dark:bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" /> : <Package size={24} className="text-gray-200" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">{p.category}</p>
                  <Link to={`/products/${p._id}`} className="text-sm font-semibold hover:text-blue-600 truncate block">{p.name}</Link>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{p.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold">₹{p.price.toLocaleString()}</p>
                  <p className={`text-[10px] font-medium ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                  </p>
                </div>
                <Button size="sm" onClick={() => addToCart(p)} disabled={p.stock === 0} className="shrink-0"><ShoppingCart size={12} /></Button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ═══ PAGINATION ═══ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => updateParams({ page: String(Math.max(1, pageParam - 1)) })}
            disabled={pageParam <= 1}>
            <ChevronLeft size={14} />
          </Button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={pageParam === p ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs"
              onClick={() => updateParams({ page: String(p) })}>
              {p}
            </Button>
          ))}
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => updateParams({ page: String(Math.min(totalPages, pageParam + 1)) })}
            disabled={pageParam >= totalPages}>
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
