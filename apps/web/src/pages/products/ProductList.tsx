import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/ProductCard';
import {
  Search, ShoppingCart, ChevronLeft, ChevronRight, Package,
  ArrowRight, SlidersHorizontal, Star, X, Grid3X3, List
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  _id: string; name: string; description: string; price: number;
  stock: number; category: string; imageUrl?: string; createdAt?: string;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'Name: A → Z' },
];

const ALL_CATEGORIES = ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports', 'Books', 'Furniture', 'Kids & Baby', 'Pet Supplies', 'Auto'];

export default function ProductList() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (sort === 'price_asc') { params.sort = 'price'; params.order = 'asc'; }
      else if (sort === 'price_desc') { params.sort = 'price'; params.order = 'desc'; }
      else if (sort === 'name_asc') { params.sort = 'name'; params.order = 'asc'; }
      else { params.sort = 'createdAt'; params.order = 'desc'; }

      const res = await api.get('/products', { params });
      setProducts(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalCount(res.data.pagination?.totalOrders || (res.data.data || []).length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page, search, category, minPrice, maxPrice, sort]);

  const addToCart = async (product: Product) => {
    try {
      await api.post('/cart', { productId: product._id, quantity: 1 });
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb + Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-foreground">
            {category || 'All Products'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-0.5">
            {totalCount} product{totalCount !== 1 ? 's' : ''} found
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

      {/* Filters Bar */}
      <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl p-3 space-y-3">
        {/* Search + Category + Price */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." className="pl-9 h-9 text-sm" />
          </div>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="h-9 px-3 border border-gray-200 dark:border-border rounded-lg text-sm bg-white dark:bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <Input type="number" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} placeholder="Min ₹" className="w-20 h-9 text-sm" />
            <span className="text-gray-400">–</span>
            <Input type="number" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} placeholder="Max ₹" className="w-20 h-9 text-sm" />
          </div>
        </div>

        {/* Sort + Active Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Sort:</span>
            {SORT_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => { setSort(opt.value); setPage(1); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${sort === opt.value ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground hover:bg-gray-200'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          {(category || search || minPrice || maxPrice) && (
            <button onClick={() => { setCategory(''); setSearch(''); setMinPrice(''); setMaxPrice(''); setPage(1); }}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-1">No products found</h3>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mb-4">Try adjusting your filters or search</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => { setCategory(''); setSearch(''); setMinPrice(''); setMaxPrice(''); setPage(1); }}>Clear Filters</Button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}><ChevronLeft size={14} /></Button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={page === p ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(p)}>{p}</Button>
          ))}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}><ChevronRight size={14} /></Button>
        </div>
      )}
    </div>
  );
}
