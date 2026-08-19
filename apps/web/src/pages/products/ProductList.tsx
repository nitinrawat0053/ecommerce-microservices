import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Search, ShoppingCart, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Product {
  _id: string; name: string; description: string; price: number; stock: number; category: string; imageUrl?: string;
}

export default function ProductList() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [cartMsg, setCartMsg] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const res = await api.get('/products', { params });
      setProducts(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, search, category, minPrice, maxPrice]);

  const addToCart = async (productId: string) => {
    try {
      await api.post('/cart', { productId, quantity: 1 });
      setCartMsg('Added to cart!');
      setTimeout(() => setCartMsg(''), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        {isAdmin && <Link to="/admin/products/new" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">+ Add Product</Link>}
      </div>

      {cartMsg && <div className="p-3 bg-green-50 text-success text-sm rounded-lg">{cartMsg}</div>}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Footwear">Footwear</option>
            <option value="Clothing">Clothing</option>
            <option value="Home">Home</option>
            <option value="Sports">Sports</option>
          </select>
          <input type="number" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} placeholder="Min ₹" className="w-24 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="number" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} placeholder="Max ₹" className="w-24 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? <LoadingSpinner /> : products.length === 0 ? (
        <div className="text-center py-20 text-text-muted"><Package size={48} className="mx-auto mb-4 opacity-30" /><p>No products found</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => (
              <div key={p._id} className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-48 bg-surface-alt flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Package size={40} className="text-text-light" />}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-primary font-medium uppercase tracking-wide">{p.category}</p>
                    <Link to={`/products/${p._id}`} className="text-sm font-semibold text-text hover:text-primary line-clamp-1">{p.name}</Link>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-text">₹{p.price.toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/products/${p._id}`} className="flex-1 py-2 text-center border border-border rounded-lg text-sm font-medium text-text-muted hover:bg-surface-alt transition-colors">View</Link>
                    <button onClick={() => addToCart(p._id)} disabled={p.stock === 0} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-40 flex items-center justify-center gap-1">
                      <ShoppingCart size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 border border-border rounded-lg hover:bg-surface-alt disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 border border-border rounded-lg hover:bg-surface-alt disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
