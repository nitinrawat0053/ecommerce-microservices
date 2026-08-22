import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, ChevronRight, ArrowRight, Smartphone, Shirt, Home,
  BookOpen, Dumbbell, Heart, Armchair, Gem, Baby, Dog, Car,
  TrendingUp, Zap, ShoppingCart, Flame, Shield, Truck, RotateCcw,
  Headphones, Package
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import ProductCard from '@/components/ProductCard';

const BANNERS = [
  { title: 'Mega Electronics Sale', subtitle: 'Up to 75% off on laptops, smartwatches, headphones & more', gradient: 'from-blue-600 via-indigo-600 to-purple-700', cta: 'Shop Now', link: '/products?category=Electronics', icon: LaptopIcon },
  { title: 'Fashion Week Deals', subtitle: 'New arrivals at unbeatable prices — styles for everyone', gradient: 'from-rose-500 via-pink-500 to-fuchsia-600', cta: 'Explore', link: '/products?category=Fashion', icon: Shirt },
  { title: 'Home & Kitchen Fest', subtitle: 'Transform your space for less — curated essentials', gradient: 'from-emerald-500 via-teal-500 to-cyan-600', cta: 'Discover', link: '/products?category=Home & Kitchen', icon: Home },
];

function LaptopIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
    </svg>
  );
}

/* ─── Product Carousel ─── */
function ProductCarousel({ title, icon: Icon, products, loading, viewAllLink }: {
  title: string; icon: any; products: any[]; loading: boolean; viewAllLink?: string;
}) {
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
  }, [updateScroll, products]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-200 dark:bg-muted rounded animate-pulse" />
          <div className="h-5 w-36 bg-gray-200 dark:bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="min-w-[200px] h-80 bg-gray-100 dark:bg-muted/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  if (products.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Icon size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-foreground">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {viewAllLink && (
            <Link to={viewAllLink} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          )}
          <div className="flex items-center gap-1.5">
            <button onClick={() => scroll('left')} disabled={!canScrollLeft}
              className="h-8 w-8 rounded-full border border-gray-200 dark:border-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-muted disabled:opacity-20 transition-all">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => scroll('right')} disabled={!canScrollRight}
              className="h-8 w-8 rounded-full border border-gray-200 dark:border-border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-muted disabled:opacity-20 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}>
        {products.map((p) => (
          <div key={p._id} className="flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
            <ProductCard product={p} compact />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══ MAIN DASHBOARD ═══ */
export default function Dashboard() {
  const { isAdmin } = useAuth();
  if (isAdmin) return <AdminDashboard />;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    api.get('/products?limit=200').then(r => setProducts(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBannerIndex(p => (p + 1) % BANNERS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const getByCategory = (cat: string) =>
    products.filter(p => p.category?.toLowerCase().includes(cat.toLowerCase()) || p.name?.toLowerCase().includes(cat.toLowerCase())).slice(0, 15);
  const trending = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15);
  const bestSellers = [...products].sort((a, b) => (b.stock || 0) - (a.stock || 0)).slice(0, 15);
  const electronics = getByCategory('electronic');
  const fashion = getByCategory('fashion');
  const homeKitchen = getByCategory('home');

  return (
    <div className="space-y-8">
      {/* ═══ HERO BANNER ═══ */}
      <section className="relative rounded-3xl overflow-hidden h-[220px] sm:h-[280px] md:h-[340px]">
        {BANNERS.map((b, i) => (
          <div key={i} className={`absolute inset-0 transition-all duration-700 ease-in-out ${i === bannerIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'}`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${b.gradient}`} />
            <div className="absolute -right-20 -top-20 w-[300px] h-[300px] rounded-full bg-white/5" />
            <div className="absolute -right-10 top-1/2 w-[200px] h-[200px] rounded-full bg-white/5" />
            <div className="absolute left-1/3 -bottom-10 w-[150px] h-[150px] rounded-full bg-white/5" />
            <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-2xl">
              <span className="inline-block w-fit text-white/60 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Limited Time Offer</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-[1.1] drop-shadow-lg">{b.title}</h2>
              <p className="text-white/75 text-sm md:text-base mt-2.5 max-w-md leading-relaxed">{b.subtitle}</p>
              <Link to={b.link} className="mt-4">
                <Button className="bg-white text-gray-900 hover:bg-gray-100 font-bold shadow-xl px-6 py-2.5 h-auto text-sm rounded-xl">
                  {b.cta} <ArrowRight size={15} className="ml-2" />
                </Button>
              </Link>
            </div>
            <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 hidden md:flex h-32 w-32 rounded-3xl bg-white/10 backdrop-blur-sm items-center justify-center">
              <b.icon size={56} className="text-white/30" />
            </div>
          </div>
        ))}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => setBannerIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === bannerIndex ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`} />
          ))}
        </div>
        <button onClick={() => setBannerIndex(p => (p - 1 + BANNERS.length) % BANNERS.length)}
          className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-lg">
          <ChevronLeft size={20} />
        </button>
        <button onClick={() => setBannerIndex(p => (p + 1) % BANNERS.length)}
          className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-lg">
          <ChevronRight size={20} />
        </button>
      </section>

      {/* ═══ TRUST BADGES ═══ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Truck, label: 'Free Shipping', desc: 'Orders over ₹999', color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
          { icon: Shield, label: 'Secure Payment', desc: '100% protected', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
          { icon: RotateCcw, label: 'Easy Returns', desc: '7-day policy', color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' },
          { icon: Headphones, label: '24/7 Support', desc: 'Always here', color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 py-3 px-1">
            <div className={`h-10 w-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
              <item.icon size={18} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-gray-900 dark:text-foreground leading-tight">{item.label}</p>
              <p className="text-[10px] text-gray-400 dark:text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ═══ FLASH DEALS ═══ */}
      <section className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-5 md:p-6 flex items-center justify-between overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute right-20 bottom-0 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Flame size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-black text-white">Flash Deals</h3>
            <p className="text-white/75 text-sm">Get up to 50% off on all products!</p>
          </div>
        </div>
        <Link to="/products" className="relative z-10">
          <Button className="bg-white text-orange-600 hover:bg-gray-100 font-bold shadow-xl px-5 h-auto py-2.5 text-sm rounded-xl">
            Shop Now <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </Link>
      </section>

      {/* ═══ TRENDING PRODUCTS ═══ */}
      <ProductCarousel title="Trending Now" icon={TrendingUp} products={trending} loading={loading} viewAllLink="/products" />

      {/* ═══ CATEGORY-BASED SECTIONS ═══ */}
      {electronics.length > 0 && (
        <ProductCarousel title="Electronics" icon={Zap} products={electronics} loading={loading} viewAllLink="/products?category=Electronics" />
      )}
      {fashion.length > 0 && (
        <ProductCarousel title="Fashion" icon={Heart} products={fashion} loading={loading} viewAllLink="/products?category=Fashion" />
      )}
      {homeKitchen.length > 0 && (
        <ProductCarousel title="Home & Kitchen" icon={Home} products={homeKitchen} loading={loading} viewAllLink="/products?category=Home & Kitchen" />
      )}

      {/* ═══ BEST SELLERS ═══ */}
      <ProductCarousel title="Best Sellers" icon={Flame} products={bestSellers} loading={loading} viewAllLink="/products" />

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-8 md:p-10 text-center overflow-hidden">
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute right-10 -bottom-10 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <h3 className="text-xl md:text-2xl font-black text-white">Explore Our Full Collection</h3>
          <p className="text-white/60 text-sm mt-1.5">{products.length}+ products waiting for you</p>
          <Link to="/products" className="mt-4 inline-block">
            <Button className="bg-white text-blue-600 hover:bg-gray-100 font-bold shadow-xl px-6 py-2.5 h-auto text-sm rounded-xl">
              Browse All Products <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
