import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import WishlistButton from '@/components/WishlistButton';
import ProductCard from '@/components/ProductCard';
import {
  ShoppingCart, Package, Check, Minus, Plus,
  Star, Truck, Shield, RotateCcw, ChevronRight, ChevronLeft, Sparkles, XCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import StockBadge from '@/components/StockBadge';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [adding, setAdding] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScroll);
    updateScroll();
    return () => el.removeEventListener('scroll', updateScroll);
  }, [updateScroll, recommendations]);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(async (r) => {
        const prod = r.data.data;
        setProduct(prod);
        // Fetch recommendations
        try {
          setRecLoading(true);
          const res = await api.get(`/products?limit=200`);
          const all = (res.data.data || []).filter((p: any) => p._id !== id);
          // 1. Same category, in stock first
          const sameCat = all.filter((p: any) => p.category?.toLowerCase() === prod.category?.toLowerCase());
          const sameCatInStock = sameCat.filter((p: any) => p.stock > 0);
          const sameCatOutOfStock = sameCat.filter((p: any) => p.stock === 0);
          // 2. Other products, in stock first
          const others = all.filter((p: any) => p.category?.toLowerCase() !== prod.category?.toLowerCase());
          const othersInStock = others.filter((p: any) => p.stock > 0);
          const othersOutOfStock = others.filter((p: any) => p.stock === 0);
          // Combine: same category first, then others, in-stock prioritized
          const combined = [...sameCatInStock, ...othersInStock, ...sameCatOutOfStock, ...othersOutOfStock];
          // Deduplicate by _id
          const seen = new Set<string>();
          const unique = combined.filter((p: any) => {
            if (seen.has(p._id)) return false;
            seen.add(p._id);
            return true;
          });
          setRecommendations(unique.slice(0, 12));
        } catch { /* ignore */ }
        finally { setRecLoading(false); }
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const addToCart = async () => {
    setAdding(true);
    try {
      await api.post('/cart', { productId: id, quantity });
      toast.success(`Added ${quantity} item(s) to cart`);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 4000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally { setAdding(false); }
  };

  const buyNow = async () => {
    await addToCart();
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-4 w-48" />
        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl overflow-hidden">
          <div className="md:flex">
            <Skeleton className="md:w-1/2 aspect-square" />
            <div className="md:w-1/2 p-8 space-y-4">
              <Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-3/4" /><Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-28" /><Skeleton className="h-11 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!product) return null;

  const discount = product.price > 500 ? Math.floor(Math.random() * 35) + 10 : 0;
  const fakeOriginal = discount > 0 ? Math.round(product.price / (1 - discount / 100)) : 0;
  const rating = (4 + Math.random()).toFixed(1);
  const reviews = Math.floor(Math.random() * 500) + 10;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-muted-foreground">
        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
        <ChevronRight size={12} />
        {product.category && (
          <>
            <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-blue-600 transition-colors capitalize">{product.category}</Link>
            <ChevronRight size={12} />
          </>
        )}
        <span className="text-gray-900 dark:text-foreground font-medium truncate">{product.name}</span>
      </div>

      {/* Main Product */}
      <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl overflow-hidden">
        <div className="md:flex">
          {/* Image */}
          <div className="md:w-1/2 bg-gray-50 dark:bg-muted flex items-center justify-center p-8 min-h-[300px] md:min-h-[450px] relative">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="max-w-full max-h-[400px] object-contain" />
            ) : (
              <Package size={80} className="text-gray-200 dark:text-muted-foreground/30" />
            )}
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-lg shadow">{discount}% off</span>
            )}
            <div className="absolute top-4 right-4 z-10">
              <WishlistButton product={product} size="lg" />
            </div>
          </div>

          {/* Info */}
          <div className="md:w-1/2 p-6 md:p-8 space-y-5">
            <div>
              <p className="text-xs text-gray-400 dark:text-muted-foreground uppercase tracking-wider font-medium">{product.category}</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-foreground mt-1">{product.name}</h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-500 text-white text-sm font-bold px-2 py-0.5 rounded">
                <Star size={14} className="fill-white" /> {rating}
              </div>
              <span className="text-sm text-gray-500 dark:text-muted-foreground">{reviews} ratings</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-foreground">₹{product.price.toLocaleString()}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-gray-400 dark:text-muted-foreground line-through">₹{fakeOriginal.toLocaleString()}</span>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-0 text-sm">{discount}% off</Badge>
                </>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed">{product.description}</p>

            <Separator />

            {/* Stock */}
            <StockBadge stock={product.stock} size="lg" />

            {/* Quantity */}
            {product.stock > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-foreground">Quantity</label>
              <div className="flex items-center border border-gray-200 dark:border-border rounded-lg w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-muted rounded-l-lg transition-colors">
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-sm font-bold border-x border-gray-200 dark:border-border h-10 flex items-center justify-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="h-10 w-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-muted rounded-r-lg transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {product.stock > 0 ? (
                <>
                  <Button size="lg" className="flex-1 h-12 font-bold text-sm bg-blue-600 hover:bg-blue-700" onClick={addToCart} disabled={adding}>
                    {adding ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : addedToCart ? (
                      <><Check size={16} className="mr-2" /> Added to Cart</>
                    ) : (
                      <><ShoppingCart size={16} className="mr-2" /> Add to Cart</>
                    )}
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 h-12 font-bold text-sm" onClick={buyNow}>
                    Buy Now
                  </Button>
                </>
              ) : (
                <Button size="lg" className="flex-1 h-12 font-bold text-sm bg-gray-400 cursor-not-allowed" disabled>
                  <XCircle size={16} className="mr-2" /> Out of Stock
                </Button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck, label: 'Free Delivery' },
                { icon: Shield, label: 'Secure Payment' },
                { icon: RotateCcw, label: 'Easy Returns' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1 text-center">
                  <item.icon size={18} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-[10px] font-medium text-gray-500 dark:text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RECOMMENDED FOR YOU ═══ */}
      {(recLoading || recommendations.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-foreground">Recommended for You</h2>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">Based on {product.category} category</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                View All →
              </Link>
              <div className="flex items-center gap-1.5">
                <button onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })} disabled={!canScrollLeft}
                  className="h-8 w-8 rounded-full border border-gray-200 dark:border-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-muted disabled:opacity-20 transition-all">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })} disabled={!canScrollRight}
                  className="h-8 w-8 rounded-full border border-gray-200 dark:border-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-muted disabled:opacity-20 transition-all">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {recLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="min-w-[200px] h-72 bg-gray-100 dark:bg-muted/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}>
              {recommendations.map((rp: any) => (
                <div key={rp._id} className="flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                  <ProductCard product={rp} compact />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
