import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, ShoppingCart, ChevronLeft, ChevronRight, Package, 
  ArrowRight, Check, SlidersHorizontal, Grid3X3, List
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

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
  { value: 'name_desc', label: 'Name: Z → A' },
];

export default function ProductList() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [cartItem, setCartItem] = useState<{ name: string } | null>(null);
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
      else if (sort === 'name_desc') { params.sort = 'name'; params.order = 'desc'; }
      else { params.sort = 'createdAt'; params.order = 'desc'; }

      const res = await api.get('/products', { params });
      let data = res.data.data || [];
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalCount(res.data.pagination?.totalOrders || data.length);

      if (sort === 'newest' && data.length > 0 && data[0].createdAt) {
        data = [...data].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
      }

      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, search, category, minPrice, maxPrice, sort]);

  const addToCart = async (product: Product) => {
    try {
      await api.post('/cart', { productId: product._id, quantity: 1 });
      toast.success(`${product.name} added to cart`);
      setCartItem({ name: product.name });
      setTimeout(() => setCartItem(null), 4000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalCount} products available</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-md p-0.5">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
              <Grid3X3 size={14} />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
              <List size={14} />
            </Button>
          </div>
          {isAdmin && (
            <Link to="/admin/products/new">
              <Button size="sm">+ Add Product</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Cart Success Toast */}
      {cartItem && (
        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg dark:bg-emerald-500/10 dark:border-emerald-500/20">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
            <p className="text-sm font-medium">
              <span className="font-semibold">{cartItem.name}</span> added to cart
            </p>
          </div>
          <Link to="/cart">
            <Button size="sm" variant="outline" className="h-8">
              View Cart <ArrowRight size={12} />
            </Button>
          </Link>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                placeholder="Search products..." 
                className="pl-9"
              />
            </div>
            <select 
              value={category} 
              onChange={(e) => { setCategory(e.target.value); setPage(1); }} 
              className="h-9 px-3 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Footwear">Footwear</option>
              <option value="Clothing">Clothing</option>
              <option value="Home">Home</option>
              <option value="Sports">Sports</option>
            </select>
            <div className="flex items-center gap-1.5">
              <Input type="number" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} placeholder="Min ₹" className="w-20 h-9" />
              <span className="text-muted-foreground">–</span>
              <Input type="number" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} placeholder="Max ₹" className="w-20 h-9" />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Sort:</span>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={sort === opt.value ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => { setSort(opt.value); setPage(1); }}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-[4/3] rounded-t-xl" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Package size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">No products found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters or search</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((p) => (
                <Card key={p._id} className="overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <Package size={32} className="text-muted-foreground/20" />
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{p.category}</p>
                      <Link to={`/products/${p._id}`} className="text-sm font-semibold hover:underline line-clamp-1 mt-0.5 block">
                        {p.name}
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">₹{p.price.toLocaleString()}</span>
                      <Badge variant={p.stock > 0 ? 'success' : 'destructive'} className="text-[10px]">
                        {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/products/${p._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">View</Button>
                      </Link>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => addToCart(p)} 
                        disabled={p.stock === 0}
                      >
                        <ShoppingCart size={14} /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((p) => (
                <Card key={p._id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={24} className="text-muted-foreground/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{p.category}</p>
                      <Link to={`/products/${p._id}`} className="text-sm font-semibold hover:underline">{p.name}</Link>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{p.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">₹{p.price.toLocaleString()}</p>
                      <Badge variant={p.stock > 0 ? 'success' : 'destructive'} className="text-[10px]">
                        {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                      </Badge>
                    </div>
                    <Button size="sm" onClick={() => addToCart(p)} disabled={p.stock === 0} className="shrink-0">
                      <ShoppingCart size={14} /> Add
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-4">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                <ChevronLeft size={16} />
              </Button>
              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-muted-foreground">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'outline'}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                )
              )}
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
