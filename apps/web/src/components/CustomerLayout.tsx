import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import AiShoppingAssistant from '@/components/AiShoppingAssistant';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingCart, ShoppingBag, CreditCard, Store,
  LogOut, Menu, X, ChevronDown, Moon, Sun,
  Search, UserCircle, ClipboardList, BellRing, Heart, Settings,
  Smartphone, Shirt, Home, Sparkles, BarChart3,
  Dumbbell, BookOpen, Armchair, Baby, Dog, Car,
  Truck, Star, LayoutGrid
} from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-[#f7f7fc] dark:bg-background flex flex-col">
      {/* ═══ ANNOUNCEMENT BAR ═══ */}
      <div className="bg-gradient-to-r from-[#3b2f9e] via-[#4f46e5] to-[#6d28d9] dark:from-indigo-950 dark:via-indigo-900 dark:to-purple-950 text-white text-xs">
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
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <Outlet />
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Store size={16} className="text-white" />
                </div>
                <span className="text-lg font-extrabold text-white">Shop<span className="text-blue-400">Micro</span></span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">Your one-stop destination for everything you need. Quality products, fast delivery, great prices.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Categories</h4>
              <ul className="space-y-2">
                {CATEGORIES.slice(0, 5).map(c => (
                  <li key={c.name}><Link to={`/products?category=${encodeURIComponent(c.name)}`} className="text-sm text-gray-400 hover:text-white transition-colors">{c.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Account</h4>
              <ul className="space-y-2">
                <li><Link to="/profile" className="text-sm text-gray-400 hover:text-white transition-colors">My Profile</Link></li>
                <li><Link to="/orders" className="text-sm text-gray-400 hover:text-white transition-colors">My Orders</Link></li>
                <li><Link to="/cart" className="text-sm text-gray-400 hover:text-white transition-colors">Cart</Link></li>
                <li><Link to="/payments" className="text-sm text-gray-400 hover:text-white transition-colors">Payments</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Support</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-gray-400">Help Center</span></li>
                <li><span className="text-sm text-gray-400">Return Policy</span></li>
                <li><span className="text-sm text-gray-400">Shipping Info</span></li>
                <li><span className="text-sm text-gray-400">Contact Us</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center">
            <p className="text-sm text-gray-500">© 2026 ShopMicro. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ══ AI Shopping Assistant (floating robot + chat widget) ══ */}
      <AiShoppingAssistant />
    </div>
  );
}
