import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, ChevronRight, ArrowRight, Home,
  Heart,
  TrendingUp, Zap, Flame, Shield, Truck, RotateCcw,
  Headphones
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import ProductCard from '@/components/ProductCard';

const BANNERS = [
  { title: 'Mega Electronics Sale', subtitle: 'Up to 75% off on laptops, smartwatches, headphones & more', gradient: 'from-blue-600 via-indigo-600 to-purple-700', cta: 'Shop Now', link: '/products?category=Electronics', discount: 'Up to 75% OFF', showProducts: true, productsVariant: 'electronics', noDiscountPill: true },
  { title: 'Fashion Week Deals', subtitle: 'New arrivals at unbeatable prices — styles for everyone', gradient: 'from-purple-600 via-pink-500 to-blue-500', cta: 'Shop Now', link: '/products?category=Fashion', discount: 'Up to 50% OFF', showProducts: true, noDiscountPill: true },
  { title: 'Home & Kitchen Fest', subtitle: 'Transform your space for less — curated essentials', gradient: 'from-emerald-500 via-teal-500 to-cyan-600', cta: 'Discover', link: '/products?category=Home & Kitchen', discount: 'Up to 60% OFF', showProducts: true, productsVariant: 'homeKitchen' },
];

// Four real product PNGs (transparent backgrounds) showcased on the right
// side of the Fashion Week Deals hero banner. Each product sits on its own
// separate white pedestal with ZERO overlap — every product is fully visible.
// Layout (measured bounding boxes):
//   Dress  — tallest, center of product cluster (aspect 0.557)
//   Handbag — upper-right on elevated pedestal (aspect 1.101)
//   Sunglasses — front-center-left on short pedestal (aspect 2.108)
//   Sneakers — front-right on low pedestal (aspect 1.136)
// Decorative glow ring behind products for premium neon arch effect.
function BannerProducts() {
  const DRESS_URL = '/banners/fashion-dress.png';
  const BAG_URL = '/banners/fashion-handbag.png';
  const SHOES_URL = '/banners/fashion-sneakers.png';
  const GLASSES_URL = '/banners/fashion-sunglasses.png';

  return (
    <div className="relative h-full w-full hidden md:block" aria-hidden="true">

      {/* ─── Decorative neon glow ring (behind everything) ─── */}
      <div
        className="absolute left-[30%] top-[6%] w-[280px] h-[300px] rounded-full z-[0] border-[2px] border-white/20"
        style={{ boxShadow: '0 0 60px 10px rgba(255,255,255,0.10), inset 0 0 40px 6px rgba(255,255,255,0.06)' }}
      />

      {/* ─── White pedestal podiums (one per product) ─── */}
      {/* Dress pedestal — tallest, center */}
      <div className="absolute bottom-0 left-[25%] w-[126px] h-[120px] z-[1]">
        <div className="w-full h-full rounded-t-2xl bg-gradient-to-b from-white via-white to-gray-100 shadow-[0_12px_50px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]" />
      </div>
      {/* Handbag pedestal — tall, upper-right */}
      <div className="absolute bottom-0 right-[10%] w-[120px] h-[165px] z-[1]">
        <div className="w-full h-full rounded-t-2xl bg-gradient-to-b from-white via-white to-gray-100 shadow-[0_10px_44px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]" />
      </div>
      {/* Sunglasses pedestal — short, front-center-left */}
      <div className="absolute bottom-0 left-[22%] w-[118px] h-[56px] z-[1]">
        <div className="w-full h-full rounded-t-2xl bg-gradient-to-b from-white via-white to-gray-100 shadow-[0_8px_36px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]" />
      </div>
      {/* Sneakers pedestal — low, front-right */}
      <div className="absolute bottom-0 right-[22%] w-[124px] h-[54px] z-[1]">
        <div className="w-full h-full rounded-t-2xl bg-gradient-to-b from-white via-white to-gray-100 shadow-[0_8px_36px_rgba(0,0,0,0.13),inset_0_1px_0_rgba(255,255,255,0.9)]" />
      </div>

      {/* ─── Dress (tallest, center of cluster) — z-2 ─── */}
      <div
        className="absolute left-[25%] bottom-[118px] w-[126px] h-[226px] z-[2]"
        style={{ filter: 'drop-shadow(0 16px 30px rgba(200,80,130,0.28))' }}
      >
        <img
          src={DRESS_URL}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ─── Handbag (upper-right on elevated pedestal) — z-3 ─── */}
      <div
        className="absolute right-[10%] bottom-[162px] w-[100px] h-[91px] z-[3]"
        style={{ filter: 'drop-shadow(0 10px 18px rgba(200,80,130,0.22))' }}
      >
        <img
          src={BAG_URL}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ─── Sunglasses (front-center-left, short pedestal) — z-4 ─── */}
      <div
        className="absolute left-[23%] bottom-[52px] w-[120px] h-[57px] z-[4]"
        style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.20))' }}
      >
        <img
          src={GLASSES_URL}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ─── Sneakers (front-right, low pedestal) — z-5 ─── */}
      <div
        className="absolute right-[22%] bottom-[26px] w-[118px] h-[104px] z-[5]"
        style={{ filter: 'drop-shadow(0 12px 22px rgba(0,0,0,0.24))' }}
      >
        <img
          src={SHOES_URL}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ─── "Up to 50% OFF" Badge (top-right corner, clear of all products) ─── */}
      <div className="absolute top-[6%] right-[1%] z-[6]">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/80 flex flex-col items-center min-w-[90px]">
          <span className="text-gray-500 text-[11px] font-semibold tracking-wide">Up to</span>
          <span className="text-4xl font-black text-pink-500 leading-none mt-0.5">50%</span>
          <span className="text-gray-600 text-xs font-bold tracking-widest mt-1">OFF</span>
        </div>
      </div>

    </div>
  );
}

// Four real product PNGs (transparent backgrounds) showcased on the right
// side of the Home & Kitchen Fest hero banner. Each <img> preserves its native
// alpha channel and is scaled with object-contain — no rectangular cards, no
// background colors, no blend modes — so every product sits directly on the
// banner gradient, anchored on white pedestal platforms like the Fashion
// banner. Front-to-back: platforms → plant (back-left) → pot (main hero) →
// utensils (right) → plates & bowls (foreground below the pot).
function HomeKitchenProducts() {
  const POT_URL = '/banners/home-kitchen-pot.png';
  const PLATES_URL = '/banners/home-kitchen-plates.png';
  const UTENSILS_URL = '/banners/home-kitchen-utensils.png';
  const PLANT_URL = '/banners/home-kitchen-plant.png';

  return (
    <div className="relative h-full w-full hidden md:block" aria-hidden="true">

      {/* ─── White pedestal platforms (rearmost) ─── */}
      {/* Plant platform (far left) */}
      <div className="absolute bottom-0 left-[1%] w-[116px] h-[88px] z-[1]">
        <div className="w-full h-full rounded-t-2xl bg-gradient-to-b from-white via-white to-gray-100 shadow-[0_10px_44px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]" />
      </div>
      {/* Main platform — under the pot and plates (center) */}
      <div className="absolute bottom-0 left-[18%] w-[270px] h-[96px] z-[1]">
        <div className="w-full h-full rounded-t-2xl bg-gradient-to-b from-white via-white to-gray-100 shadow-[0_12px_50px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]" />
      </div>
      {/* Utensils platform (right) */}
      <div className="absolute bottom-0 right-0 w-[102px] h-[88px] z-[1]">
        <div className="w-full h-full rounded-t-2xl bg-gradient-to-b from-white via-white to-gray-100 shadow-[0_8px_36px_rgba(0,0,0,0.13),inset_0_1px_0_rgba(255,255,255,0.9)]" />
      </div>

      {/* ─── Plant (back layer, slightly behind/next to the plates) ─── */}
      <div
        className="absolute left-[1%] bottom-[86px] w-[114px] h-[114px] z-[2]"
        style={{ filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.16))' }}
      >
        <img
          src={PLANT_URL}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ─── Cooking pot (MAIN hero product — largest, upper-right/center) ─── */}
      <div
        className="absolute left-[36%] bottom-[94px] w-[172px] h-[215px] z-[3]"
        style={{ filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.22))' }}
      >
        <img
          src={POT_URL}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ─── Wooden utensils (standing vertically beside the pot, right) ─── */}
      <div
        className="absolute right-[1%] bottom-[86px] w-[90px] h-[188px] z-[4]"
        style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.18))' }}
      >
        <img
          src={UTENSILS_URL}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ─── Plates & bowls (foreground, positioned below the pot) ─── */}
      <div
        className="absolute left-[18%] bottom-[52px] w-[172px] h-[172px] z-[5]"
        style={{ filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.2))' }}
      >
        <img
          src={PLATES_URL}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

    </div>
  );
}

// Three real product PNGs (transparent backgrounds) showcased on the right
// side of the Mega Electronics Sale hero banner. Same design system as the
// Fashion banner: every <img> preserves its native alpha channel and uses
// object-contain — no rectangular cards, no background colors, no blend modes —
// so each product sits directly on the blue→purple gradient, anchored on white
// pedestal platforms. Front-to-back/layer order: platforms → laptop (main hero,
// center-right) → headphones (right) → smartwatch (foreground below the laptop)
// with a stacked "Up to 75% OFF" badge kept clear on the far right.
function ElectronicsProducts() {
  const LAPTOP_URL = '/banners/electronics-laptop.png';
  const HEADPHONES_URL = '/banners/electronics-headphones.png';
  const SMARTWATCH_URL = '/banners/electronics-smartwatch.png';

  return (
    <div className="relative h-full w-full hidden md:block" aria-hidden="true">

      {/* ─── White pedestal platforms (rearmost) ─── */}
      {/* Smartwatch platform (front-left) */}
      <div className="absolute bottom-0 left-[10%] w-[140px] h-[72px] z-[1]">
        <div className="w-full h-full rounded-t-2xl bg-gradient-to-b from-white via-white to-gray-100 shadow-[0_10px_44px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]" />
      </div>
      {/* Laptop platform (center, main) */}
      <div className="absolute bottom-0 left-[26%] w-[300px] h-[100px] z-[1]">
        <div className="w-full h-full rounded-t-2xl bg-gradient-to-b from-white via-white to-gray-100 shadow-[0_12px_50px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.9)]" />
      </div>
      {/* Headphones platform (right) */}
      <div className="absolute bottom-0 right-0 w-[130px] h-[74px] z-[1]">
        <div className="w-full h-full rounded-t-2xl bg-gradient-to-b from-white via-white to-gray-100 shadow-[0_8px_36px_rgba(0,0,0,0.13),inset_0_1px_0_rgba(255,255,255,0.9)]" />
      </div>

      {/* ─── Laptop (MAIN hero product — largest, center-right, slightly behind) ─── */}
      <div
        className="absolute left-[28%] bottom-[96px] w-[235px] h-[157px] z-[3]"
        style={{ filter: 'drop-shadow(0 16px 28px rgba(0,0,0,0.26))' }}
      >
        <img
          src={LAPTOP_URL}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ─── Headphones (right of the laptop, kept clear of the badge) ─── */}
      <div
        className="absolute right-[1%] bottom-[40px] w-[118px] h-[118px] z-[4]"
        style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.18))' }}
      >
        <img
          src={HEADPHONES_URL}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ─── Smartwatch (foreground, in front/below the laptop — face fully visible) ─── */}
      <div
        className="absolute left-[16%] bottom-[40px] w-[104px] h-[118px] z-[5]"
        style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.16))' }}
      >
        <img
          src={SMARTWATCH_URL}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* ─── "Up to 75% OFF" Badge (far right, no overlap with products) ─── */}
      <div className="absolute top-[18%] right-[1%] z-[5]">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/80 flex flex-col items-center min-w-[90px]">
          <span className="text-gray-500 text-[11px] font-semibold tracking-wide">Up to</span>
          <span className="text-4xl font-black text-indigo-600 leading-none mt-0.5">75%</span>
          <span className="text-gray-600 text-xs font-bold tracking-widest mt-1">OFF</span>
        </div>
      </div>

    </div>
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
      <section className="relative rounded-3xl overflow-hidden h-[240px] sm:h-[300px] md:h-[360px]">
        {BANNERS.map((b, i) => (
          <div key={i} className={`absolute inset-0 transition-all duration-700 ease-in-out ${i === bannerIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'}`}>
            <div className={`absolute inset-0 bg-gradient-to-r ${b.gradient}`} />
            {/* decorative glow circles */}
            <div className="absolute -right-20 -top-20 w-[320px] h-[320px] rounded-full bg-white/5" />
            <div className="absolute -right-10 top-1/2 w-[200px] h-[200px] rounded-full bg-white/5" />
            <div className="absolute left-1/3 -bottom-10 w-[150px] h-[150px] rounded-full bg-white/5" />

            <div className="relative z-10 h-full flex items-center justify-between px-8 md:px-16">
              {/* left: copy */}
              <div className="max-w-lg">
                <span className="inline-flex items-center gap-2 text-white/80 text-[11px] font-bold uppercase tracking-[0.2em] mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Limited Time Offer
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-black text-white tracking-tight leading-[1.08] drop-shadow-lg">{b.title}</h2>
                <p className="text-white/80 text-sm md:text-base mt-2.5 max-w-md leading-relaxed">{b.subtitle}</p>
                <Link to={b.link} className="mt-5 inline-block">
                  <Button className="group bg-white text-gray-900 hover:bg-gray-100 font-bold shadow-xl px-6 py-2.5 h-auto text-sm rounded-xl">
                    {b.cta} <ArrowRight size={15} className="ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              {/* right: discount badge + product imagery */}
              <div className="hidden md:block relative flex-1 h-full max-w-[30rem]">
                {b.showProducts ? (
                  b.productsVariant === 'homeKitchen' ? <HomeKitchenProducts /> :
                  b.productsVariant === 'electronics' ? <ElectronicsProducts /> :
                  <BannerProducts />
                ) : (
                  <div className="absolute inset-y-0 right-0 flex items-center justify-center">
                    <span className="text-6xl lg:text-7xl font-black text-white/25 select-none drop-shadow-lg">{b.discount}</span>
                  </div>
                )}
                {!b.noDiscountPill && (
                  <span className="absolute top-6 right-2 lg:top-10 lg:right-6 bg-white/90 text-gray-900 text-xs lg:text-sm font-extrabold px-3 lg:px-4 py-2 rounded-full shadow-xl">
                    {b.discount}
                  </span>
                )}
              </div>
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
