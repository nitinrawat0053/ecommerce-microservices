import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import AiShoppingAssistant from '@/components/AiShoppingAssistant';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingCart, ShoppingBag, CreditCard,
  LogOut, Menu, X, ChevronDown, ChevronRight, ArrowRight, Moon, Sun,
  Search, UserCircle, User, ClipboardList, BellRing, Heart, Settings,
  Smartphone, Shirt, Home, Sparkles, BarChart3,
  Dumbbell, BookOpen, Armchair, Baby, Dog, Car,
  Truck, Star, LayoutGrid, Layers, Headphones, Mail,
  ShieldCheck, Package, BadgeCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

const CATEGORIES = [
  { name: 'Electronics', icon: Smartphone, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/15 dark:text-blue-400', hoverColor: 'hover:bg-blue-50/70 dark:hover:bg-blue-500/10' },
  { name: 'Fashion', icon: Shirt, color: 'text-pink-600 bg-pink-50 dark:bg-pink-500/15 dark:text-pink-400', hoverColor: 'hover:bg-pink-50/70 dark:hover:bg-pink-500/10' },
  { name: 'Home & Kitchen', icon: Home, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-400', hoverColor: 'hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10' },
  { name: 'Beauty', icon: Sparkles, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/15 dark:text-purple-400', hoverColor: 'hover:bg-purple-50/70 dark:hover:bg-purple-500/10' },
  { name: 'Sports', icon: Dumbbell, color: 'text-orange-600 bg-orange-50 dark:bg-orange-500/15 dark:text-orange-400', hoverColor: 'hover:bg-orange-50/70 dark:hover:bg-orange-500/10' },
  { name: 'Books', icon: BookOpen, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-400', hoverColor: 'hover:bg-amber-50/70 dark:hover:bg-amber-500/10' },
  { name: 'Furniture', icon: Armchair, color: 'text-teal-600 bg-teal-50 dark:bg-teal-500/15 dark:text-teal-400', hoverColor: 'hover:bg-teal-50/70 dark:hover:bg-teal-500/10' },
  { name: 'Kids & Baby', icon: Baby, color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/15 dark:text-rose-400', hoverColor: 'hover:bg-rose-50/70 dark:hover:bg-rose-500/10' },
  { name: 'Pet Supplies', icon: Dog, color: 'text-lime-600 bg-lime-50 dark:bg-lime-500/15 dark:text-lime-400', hoverColor: 'hover:bg-lime-50/70 dark:hover:bg-lime-500/10' },
  { name: 'Auto', icon: Car, color: 'text-slate-600 bg-slate-100 dark:bg-slate-500/15 dark:text-slate-400', hoverColor: 'hover:bg-slate-100/80 dark:hover:bg-slate-500/10' },
];

export default function CustomerLayout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [search, setSearch] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeCategory = new URLSearchParams(location.search).get('category') || '';
  const isAllActive = (location.pathname === '/' || location.pathname === '/products') && !activeCategory;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      searchInputRef.current?.blur();
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    toast.success('Thanks for subscribing to ShopMicro updates!');
    setNewsletterEmail('');
  };

  return (
    <div
      className="relative min-h-screen dark:bg-background flex flex-col"
      style={{
        background:
          'linear-gradient(155deg, #F3F4FE 0%, #EEF0FD 36%, #F6F7FF 68%, #ECEBFC 100%)',
      }}
    >
      {/* Subtle flowing lavender, blue & white wave background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden dark:opacity-[0.04]" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 65% 45% at 15% 22%, rgba(255, 255, 255, 0.72) 0%, transparent 72%), radial-gradient(ellipse 60% 45% at 88% 72%, rgba(219, 224, 254, 0.55) 0%, transparent 74%)',
          }}
        />
        <svg
          viewBox="0 0 1600 1000"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="page-wave-a" x1="0%" y1="0%" x2="100%" y2="40%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#E4E7FD" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#DDDDFC" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id="page-wave-b" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#DFE8FF" stopOpacity="0.42" />
              <stop offset="55%" stopColor="#ECEBFD" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.58" />
            </linearGradient>
            <linearGradient id="page-wave-c" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E5E4FA" stopOpacity="0.48" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.52" />
              <stop offset="100%" stopColor="#DFE8FE" stopOpacity="0.42" />
            </linearGradient>
          </defs>
          <path
            d="M-50,150 C260,85 520,275 860,245 C1180,215 1350,85 1650,145 L1650,420 C1340,340 1060,445 730,415 C420,385 190,260 -50,335 Z"
            fill="url(#page-wave-a)"
          />
          <path
            d="M-50,455 C280,535 560,395 920,445 C1240,490 1420,385 1650,425 L1650,695 C1330,635 1030,725 690,670 C360,615 160,685 -50,625 Z"
            fill="url(#page-wave-b)"
          />
          <path
            d="M-50,745 C260,680 570,835 940,780 C1230,735 1430,835 1650,775 L1650,1020 L-50,1020 Z"
            fill="url(#page-wave-c)"
          />
        </svg>
      </div>

      {/* ═══ ANNOUNCEMENT BAR ═══ */}
      <div className="relative z-20 bg-gradient-to-r from-[#3b2f9e] via-[#4f46e5] to-[#6d28d9] dark:from-indigo-950 dark:via-indigo-900 dark:to-purple-950 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={13} className="text-amber-300 shrink-0" />
            <span className="font-medium tracking-[0.01em] truncate">
              Welcome to ShopMicro — Your one-stop shop for everything!
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3.5 shrink-0 font-medium text-white/95">
            <span className="flex items-center gap-1.5">
              <Truck size={13} className="text-sky-200 shrink-0" />
              Free shipping on orders over ₹999
            </span>
            <span className="hidden lg:inline-block h-3.5 w-px bg-white/25" aria-hidden="true" />
            <span className="hidden lg:flex items-center gap-1.5">
              <Star size={12} className="text-amber-300 fill-amber-300 shrink-0" />
              Get up to 40% off on select brands
            </span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN HEADER ═══ */}
      <header
        className={cn(
          'bg-white/95 dark:bg-card/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/70 dark:border-border transition-shadow duration-200',
          scrolled
            ? 'shadow-[0_8px_28px_-8px_rgba(15,23,42,0.12)]'
            : 'shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]'
        )}
      >
        <div className="max-w-7xl mx-auto px-4">
          {/* Primary Row */}
          <div className="flex items-center justify-between gap-2.5 lg:gap-6 h-16">
            {/* Left: Mobile Menu Trigger + Brand Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                className="lg:hidden h-9 w-9 rounded-xl text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={20} />
              </Button>

              <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-500/25 group-hover:shadow-md group-hover:shadow-indigo-500/30 group-hover:scale-[1.03] transition-all duration-200">
                  <ShoppingBag size={18} strokeWidth={2.2} className="text-white" />
                </div>
                <span className="text-lg sm:text-[21px] font-extrabold text-slate-900 dark:text-foreground tracking-tight">
                  Shop<span className="text-blue-600 dark:text-blue-400">Micro</span>
                </span>
              </Link>
            </div>

            {/* Center: Prominent Rounded Search Bar (Tablet & Desktop) */}
            <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-[540px] lg:max-w-[600px] mx-auto">
              <div className="relative flex items-center group">
                <Search
                  size={17}
                  className="absolute left-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for products, brands and more..."
                  aria-label="Search for products, brands and more"
                  className="w-full h-10.5 pl-11 pr-10 bg-slate-100/80 dark:bg-muted/80 hover:bg-slate-100 dark:hover:bg-muted focus:bg-white dark:focus:bg-card border border-slate-200/80 dark:border-border rounded-full text-[13.5px] text-slate-800 dark:text-foreground placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                    className="absolute right-3.5 h-5 w-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 dark:hover:bg-muted-foreground/20 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </form>

            {/* Right: Wishlist, Theme Toggle, Profile Dropdown, Cart */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Wishlist */}
              <Link
                to="/wishlist"
                aria-label="My Wishlist"
                className="relative h-9.5 w-9.5 rounded-full flex items-center justify-center text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <Heart size={19} strokeWidth={2.1} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-card">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="h-9.5 w-9.5 rounded-full hidden sm:flex items-center justify-center text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-muted hover:text-indigo-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
              >
                {darkMode ? <Sun size={18} strokeWidth={2.1} /> : <Moon size={18} strokeWidth={2.1} />}
              </button>

              {/* User Profile Dropdown (or Login button for guests) */}
              {user ? (
                <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Account menu"
                      className="flex items-center gap-2 rounded-full pl-1 pr-1.5 md:pr-2.5 py-1 hover:bg-slate-100/90 dark:hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-[13.5px] font-bold text-slate-950 dark:text-white hidden md:block max-w-[100px] truncate">
                        {user?.name}
                      </span>
                      <ChevronDown
                        size={14}
                        strokeWidth={2.3}
                        className={cn(
                          'text-slate-700 dark:text-slate-200 hidden md:block transition-transform duration-200',
                          userMenuOpen && 'rotate-180'
                        )}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-60 p-2 rounded-2xl border border-slate-100 dark:border-border bg-white dark:bg-popover shadow-[0_14px_40px_-8px_rgba(15,23,42,0.16)]"
                    align="end"
                    sideOffset={10}
                  >
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-border mb-1.5">
                      <p className="text-[13.5px] font-bold text-slate-900 dark:text-foreground truncate">
                        {user?.name}
                      </p>
                      <p className="text-[11.5px] text-slate-500 dark:text-muted-foreground truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      {isAdmin && (
                        <Link
                          to="/"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-600 dark:text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-muted hover:text-indigo-700 dark:hover:text-foreground transition-colors"
                        >
                          <BarChart3 size={15} /> Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-600 dark:text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-muted hover:text-indigo-700 dark:hover:text-foreground transition-colors"
                      >
                        <UserCircle size={15} /> My Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-600 dark:text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-muted hover:text-indigo-700 dark:hover:text-foreground transition-colors"
                      >
                        <ClipboardList size={15} /> My Orders
                      </Link>
                      <Link
                        to="/payments"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-600 dark:text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-muted hover:text-indigo-700 dark:hover:text-foreground transition-colors"
                      >
                        <CreditCard size={15} /> Payments
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-600 dark:text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-muted hover:text-indigo-700 dark:hover:text-foreground transition-colors"
                      >
                        <Heart size={15} /> My Wishlist
                      </Link>
                      <Link
                        to="/profile/notifications"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-600 dark:text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-muted hover:text-indigo-700 dark:hover:text-foreground transition-colors"
                      >
                        <BellRing size={15} />
                        <span>Notifications</span>
                        <span className="ml-auto h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" aria-hidden="true" />
                      </Link>
                      <div className="border-t border-slate-100 dark:border-border my-1.5 pt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-colors cursor-pointer"
                        >
                          <LogOut size={15} /> Sign Out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 md:pr-3 py-1 hover:bg-slate-100 dark:hover:bg-muted transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                    <UserCircle size={17} />
                  </div>
                  <span className="text-[13.5px] font-bold text-slate-950 dark:text-white hidden md:block">
                    Login
                  </span>
                </Link>
              )}

              {/* Cart */}
              <Link
                to="/cart"
                aria-label="Shopping Cart"
                className="relative flex items-center gap-2 rounded-full px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-muted transition-colors group"
              >
                <div className="relative flex items-center justify-center">
                  <ShoppingCart
                    size={20}
                    strokeWidth={2.3}
                    className="text-slate-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                  />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-card shadow-xs">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[13.5px] font-bold text-slate-950 dark:text-white hidden md:block">
                  Cart
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="relative flex items-center group">
              <Search
                size={16}
                className="absolute left-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for products, brands and more..."
                aria-label="Search for products, brands and more"
                className="w-full h-10 pl-10 pr-9 bg-slate-100/80 dark:bg-muted/80 focus:bg-white dark:focus:bg-card border border-slate-200/80 dark:border-border rounded-full text-sm text-slate-800 dark:text-foreground placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 h-5 w-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </form>

          {/* ═══ CATEGORY NAVIGATION ═══ */}
          <nav
            aria-label="Product categories"
            className="flex items-center gap-1 xl:gap-1.5 border-t border-slate-100 dark:border-border -mx-4 px-4 py-2 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            <Link
              to="/products"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-bold whitespace-nowrap rounded-full border transition-all duration-200 shrink-0',
                isAllActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-500/30 shadow-2xs'
                  : 'border-transparent text-slate-800 dark:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-muted hover:text-slate-950 dark:hover:text-white'
              )}
            >
              <span
                className={cn(
                  'h-5 w-5 rounded-md flex items-center justify-center transition-colors',
                  isAllActive
                    ? 'bg-indigo-100/80 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                    : 'bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-200'
                )}
              >
                <LayoutGrid size={12} />
              </span>
              <span>All</span>
            </Link>

            {CATEGORIES.map((cat) => {
              const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className={cn(
                    'flex items-center gap-1.5 px-2 xl:px-2.5 py-1.5 text-[12px] font-bold whitespace-nowrap rounded-full border transition-all duration-200 shrink-0',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-500/30 shadow-2xs'
                      : cn(
                          'border-transparent text-slate-800 dark:text-slate-100 hover:text-slate-950 dark:hover:text-white',
                          cat.hoverColor
                        )
                  )}
                >
                  <span
                    className={cn(
                      'h-5 w-5 rounded-md flex items-center justify-center transition-transform duration-200',
                      cat.color
                    )}
                  >
                    <Icon size={12} />
                  </span>
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ═══ MOBILE MENU ═══ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[300px] bg-white dark:bg-card shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-border">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-xs">
                  <ShoppingBag size={16} className="text-white" />
                </div>
                <span className="font-extrabold text-slate-900 dark:text-foreground tracking-tight">
                  Shop<span className="text-blue-600 dark:text-blue-400">Micro</span>
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  onClick={() => setDarkMode(!darkMode)}
                  className="h-8 w-8 rounded-lg"
                >
                  {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 rounded-lg"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>

            {user && (
              <div className="px-4 py-3 bg-slate-50/80 dark:bg-muted/40 border-b border-slate-100 dark:border-border flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 py-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                Home
              </Link>
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors',
                  isAllActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-muted'
                )}
              >
                All Products
              </Link>
              <div className="px-4 py-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Categories
              </div>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();
                return (
                  <Link
                    key={cat.name}
                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 text-sm font-bold transition-colors',
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-muted hover:text-slate-950 dark:hover:text-white'
                    )}
                  >
                    <div className={cn('h-6 w-6 rounded-md flex items-center justify-center', cat.color)}>
                      <Icon size={13} />
                    </div>
                    {cat.name}
                  </Link>
                );
              })}
              <div className="border-t border-slate-100 dark:border-border my-2" />
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                <UserCircle size={16} /> My Profile
              </Link>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                <ClipboardList size={16} /> My Orders
              </Link>
              <Link
                to="/payments"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                <CreditCard size={16} /> Payments
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                <Heart size={16} /> My Wishlist
              </Link>
              <Link
                to="/profile/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                <BellRing size={16} /> Notifications
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted transition-colors"
                >
                  <Settings size={16} /> Manage Products
                </Link>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-slate-100 dark:border-border">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 rounded-xl transition-opacity"
                >
                  <UserCircle size={16} /> Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="relative z-10 flex-1">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <Outlet />
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer
        className="relative z-10 overflow-hidden text-slate-300 mt-auto border-t border-indigo-400/15"
        style={{
          background:
            'linear-gradient(110deg, #171642 0%, #101731 46%, #121536 74%, #241447 100%)',
        }}
      >
        {/* Top-left indigo glow & top-right violet aurora wave */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 38% 55% at 6% 12%, rgba(92, 68, 214, 0.38) 0%, transparent 72%), radial-gradient(ellipse 40% 60% at 94% 16%, rgba(162, 42, 208, 0.42) 0%, transparent 72%)',
          }}
          aria-hidden="true"
        />
        <svg
          viewBox="0 0 1600 420"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="footer-wave-l" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6D28D9" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="footer-wave-r" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333EA" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#3B0764" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M-20,310 C180,340 310,400 540,425 L-20,425 Z"
            fill="url(#footer-wave-l)"
          />
          <path
            d="M1060,-10 C1230,90 1420,120 1620,185 L1620,-10 Z"
            fill="url(#footer-wave-r)"
          />
        </svg>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-11 pb-6">
          {/* 5-Column Top Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.35fr_1.5fr_0.95fr_0.95fr_1.55fr] gap-8 lg:gap-7">
            {/* Column 1: Brand + Tagline + Social Icons */}
            <div className="space-y-4">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#6D28D9] via-[#5B32E8] to-[#3B52E8] flex items-center justify-center shadow-[0_6px_16px_rgba(91,50,232,0.45)]">
                  <ShoppingBag size={18} strokeWidth={2.2} className="text-white" />
                </div>
                <span className="text-[20px] font-extrabold text-white tracking-tight">
                  Shop<span className="text-[#3B82F6]">Micro</span>
                </span>
              </Link>
              <p className="text-[13px] text-slate-300/80 leading-relaxed max-w-[240px]">
                Your one-stop destination for everything you need. Quality products, fast delivery, and great prices.
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                {[
                  {
                    label: 'LinkedIn',
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                        <path d="M6.94 8.5H3.56V19.5H6.94V8.5ZM5.25 3.5C4.14 3.5 3.25 4.39 3.25 5.5C3.25 6.6 4.14 7.5 5.25 7.5C6.35 7.5 7.25 6.6 7.25 5.5C7.25 4.39 6.35 3.5 5.25 3.5ZM20.44 13.02C20.44 9.88 18.76 8.22 16.16 8.22C14.37 8.22 13.48 9.2 13.02 9.93V8.5H9.65C9.7 9.48 9.65 19.5 9.65 19.5H13.02V13.36C13.02 13.02 13.05 12.69 13.15 12.45C13.42 11.78 14.03 11.09 15.07 11.09C16.41 11.09 17.06 12.11 17.06 13.6V19.5H20.44V13.02Z" />
                      </svg>
                    ),
                  },
                  {
                    label: 'GitHub',
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                        <path d="M12 2C6.48 2 2 6.58 2 12.23C2 16.75 4.87 20.58 8.84 21.93C9.34 22.02 9.52 21.71 9.52 21.44C9.52 21.2 9.51 20.39 9.51 19.53C7 20 6.35 18.9 6.15 18.33C6.04 18.04 5.55 17.15 5.12 16.91C4.77 16.72 4.27 16.24 5.11 16.23C5.9 16.22 6.47 16.98 6.66 17.29C7.57 18.85 9.02 18.41 9.6 18.14C9.69 17.47 9.95 17.01 10.24 16.75C8.02 16.49 5.69 15.61 5.69 11.71C5.69 10.6 6.08 9.68 6.72 8.97C6.62 8.71 6.27 7.66 6.82 6.25C6.82 6.25 7.66 5.98 9.57 7.3C10.37 7.07 11.22 6.96 12.07 6.96C12.92 6.96 13.77 7.07 14.57 7.3C16.48 5.97 17.32 6.25 17.32 6.25C17.87 7.66 17.52 8.71 17.42 8.97C18.06 9.68 18.45 10.59 18.45 11.71C18.45 15.62 16.11 16.49 13.88 16.75C14.25 17.07 14.57 17.69 14.57 18.66C14.57 20.04 14.56 21.15 14.56 21.44C14.56 21.71 14.74 22.03 15.25 21.93C19.14 20.58 22 16.74 22 12.23C22 6.58 17.52 2 12 2Z" />
                      </svg>
                    ),
                  },
                  {
                    label: 'X',
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                        <path d="M18.24 3H21.55L14.32 11.26L22.82 22.5H16.17L10.96 15.68L4.99 22.5H1.68L9.41 13.66L1.25 3H8.07L12.78 9.23L18.24 3ZM17.08 20.52H18.92L7.08 4.88H5.11L17.08 20.52Z" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Instagram',
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="5" />
                        <circle cx="12" cy="12" r="4" />
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                      </svg>
                    ),
                  },
                  {
                    label: 'YouTube',
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                        <path d="M21.58 7.19C21.35 6.33 20.67 5.65 19.81 5.42C18.25 5 12 5 12 5C12 5 5.75 5 4.19 5.42C3.33 5.65 2.65 6.33 2.42 7.19C2 8.75 2 12 2 12C2 12 2 15.25 2.42 16.81C2.65 17.67 3.33 18.35 4.19 18.58C5.75 19 12 19 12 19C12 19 18.25 19 19.81 18.58C20.67 18.35 21.35 17.67 21.58 16.81C22 15.25 22 12 22 12C22 12 22 8.75 21.58 7.19ZM10 15V9L15.2 12L10 15Z" />
                      </svg>
                    ),
                  },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#top"
                    onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    aria-label={social.label}
                    className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/85 hover:text-white transition-colors"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Categories (2 vertical sub-columns for all 10 categories) */}
            <div>
              <h4 className="flex items-center gap-2 font-bold text-white text-[15px] mb-3.5">
                <Layers size={16} className="text-[#A78BFA]" />
                Categories
              </h4>
              <div className="grid grid-flow-col grid-rows-5 gap-x-5 gap-y-2">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.name}
                    to={`/products?category=${encodeURIComponent(c.name)}`}
                    className="inline-flex items-center gap-1.5 text-[13px] text-slate-300/85 hover:text-white transition-colors truncate"
                  >
                    <ChevronRight size={12} className="text-indigo-300/75 shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Column 3: Account */}
            <div>
              <h4 className="flex items-center gap-2 font-bold text-white text-[15px] mb-3.5">
                <User size={16} className="text-[#A78BFA]" />
                Account
              </h4>
              <ul className="space-y-2">
                {[
                  { label: 'My Profile', to: '/profile' },
                  { label: 'My Orders', to: '/orders' },
                  { label: 'Cart', to: '/cart' },
                  { label: 'Payments', to: '/payments' },
                  { label: 'Wishlist', to: '/wishlist' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="inline-flex items-center gap-1.5 text-[13px] text-slate-300/85 hover:text-white transition-colors"
                    >
                      <ChevronRight size={12} className="text-indigo-300/75 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Support */}
            <div>
              <h4 className="flex items-center gap-2 font-bold text-white text-[15px] mb-3.5">
                <Headphones size={16} className="text-[#A78BFA]" />
                Support
              </h4>
              <ul className="space-y-2">
                {['Help Center', 'Return Policy', 'Shipping Info', 'Contact Us', 'FAQs'].map((item) => (
                  <li key={item}>
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-300/85 hover:text-white transition-colors cursor-default whitespace-nowrap">
                      <ChevronRight size={12} className="text-indigo-300/75 shrink-0" />
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 5: Stay Updated Newsletter */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Mail size={16} className="text-[#A78BFA] shrink-0" />
                <h4 className="font-bold text-white text-[15px]">Stay Updated</h4>
                <svg viewBox="0 0 22 18" className="w-4 h-4 text-[#C4B5FD] -mt-2 shrink-0" fill="none" aria-hidden="true">
                  <path d="M4 13L7 4M11 13L17 8M12 16L19 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[12.5px] text-slate-300/80 leading-snug mb-3.5">
                Get the latest deals, new arrivals and exclusive offers.
              </p>
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex items-center rounded-full bg-[#24284E]/90 border border-white/20 focus-within:border-purple-400/70 overflow-hidden p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]"
              >
                <Mail size={14} className="text-slate-300/75 ml-2.5 mr-2 shrink-0" />
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Enter your email address"
                  className="flex-1 min-w-0 bg-transparent text-xs text-white placeholder:text-slate-300/65 focus:outline-none py-1.5 pr-2"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="h-8 w-10 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:opacity-95 text-white flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(139,92,246,0.45)] cursor-pointer transition-opacity"
                >
                  <ArrowRight size={15} />
                </button>
              </form>
            </div>
          </div>

          {/* Middle Trust Strip Pill Bar */}
          <div className="mt-8 rounded-2xl lg:rounded-full bg-[#121840]/85 border border-[#3E4678]/80 px-5 py-3.5 lg:px-8 shadow-[0_10px_28px_rgba(6,8,30,0.38)]">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[
                { icon: Truck, title: 'Fast & Reliable Delivery', desc: 'Across India' },
                { icon: ShieldCheck, title: 'Secure Payments', desc: '100% Safe & Encrypted' },
                { icon: Package, title: 'Easy Returns', desc: 'Hassle-free Process' },
                { icon: BadgeCheck, title: 'Genuine Products', desc: 'Assured Quality' },
              ].map((badge) => (
                <div key={badge.title} className="flex items-center gap-3">
                  <badge.icon size={22} strokeWidth={1.8} className="text-[#C4B5FD] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-white leading-snug">{badge.title}</p>
                    <p className="text-[11px] text-slate-300/75 leading-snug mt-0.5">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Copyright & Payment Badges */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-300/75">© 2026 ShopMicro. All rights reserved.</p>
            <div className="flex items-center gap-2.5">
              <span className="hidden sm:inline-block h-4 w-px bg-white/15 mr-1" aria-hidden="true" />
              <span className="h-6 px-2.5 rounded bg-white text-[#1A1F71] text-[11px] font-black italic tracking-tight flex items-center justify-center shadow-sm">
                VISA
              </span>
              <span className="h-6 px-2 rounded bg-white flex items-center justify-center shadow-sm" aria-label="Mastercard">
                <span className="relative flex items-center">
                  <span className="h-3.5 w-3.5 rounded-full bg-[#EB001B] inline-block" />
                  <span className="h-3.5 w-3.5 rounded-full bg-[#F79E1B]/90 -ml-1.5 inline-block" />
                </span>
              </span>
              <span className="h-6 px-2 rounded bg-white text-[#1D357A] text-[10px] font-extrabold tracking-tight flex items-center gap-0.5 shadow-sm">
                RuPay
                <span className="inline-block w-1.5 h-2.5 bg-gradient-to-b from-[#F97316] via-[#FFFFFF] to-[#16A34A] rounded-r-sm ml-0.5" />
              </span>
              <span className="h-6 px-2 rounded bg-white text-[#334155] text-[10px] font-black tracking-tight flex items-center gap-0.5 shadow-sm">
                UPI
                <span className="text-[#F97316] font-black text-[11px] leading-none">›</span>
                <span className="text-[#16A34A] font-black text-[11px] leading-none -ml-0.5">›</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ══ AI Shopping Assistant (floating robot + chat widget) ══ */}
      <AiShoppingAssistant />
    </div>
  );
}
