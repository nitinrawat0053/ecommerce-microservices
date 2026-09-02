import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingCart, CreditCard, Store,
  LogOut, Menu, X, ChevronDown, Moon, Sun,
  Search, UserCircle, ClipboardList, BellRing, Heart, Settings,
  Smartphone, Shirt, Home, Sparkles, BarChart3,
  Dumbbell, BookOpen, Armchair, Baby, Dog, Car
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
  { name: 'Electronics', icon: Smartphone, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400', hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-500/20' },
  { name: 'Fashion', icon: Shirt, color: 'text-pink-600 bg-pink-50 dark:bg-pink-500/10 dark:text-pink-400', hoverColor: 'hover:bg-pink-100 dark:hover:bg-pink-500/20' },
  { name: 'Home & Kitchen', icon: Home, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400', hoverColor: 'hover:bg-emerald-100 dark:hover:bg-emerald-500/20' },
  { name: 'Beauty', icon: Sparkles, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400', hoverColor: 'hover:bg-purple-100 dark:hover:bg-purple-500/20' },
  { name: 'Sports', icon: Dumbbell, color: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400', hoverColor: 'hover:bg-orange-100 dark:hover:bg-orange-500/20' },
  { name: 'Books', icon: BookOpen, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400', hoverColor: 'hover:bg-amber-100 dark:hover:bg-amber-500/20' },
  { name: 'Furniture', icon: Armchair, color: 'text-teal-600 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-400', hoverColor: 'hover:bg-teal-100 dark:hover:bg-teal-500/20' },
  { name: 'Kids & Baby', icon: Baby, color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400', hoverColor: 'hover:bg-rose-100 dark:hover:bg-rose-500/20' },
  { name: 'Pet Supplies', icon: Dog, color: 'text-lime-600 bg-lime-50 dark:bg-lime-500/10 dark:text-lime-400', hoverColor: 'hover:bg-lime-100 dark:hover:bg-lime-500/20' },
  { name: 'Auto', icon: Car, color: 'text-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400', hoverColor: 'hover:bg-slate-100 dark:hover:bg-slate-500/20' },
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

  useEffect(() => {
    const root = document.documentElement;
    darkMode ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      {/* ═══ TOP BAR ═══ */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white text-xs py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Welcome to ShopMicro — Your one-stop shop!</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Free shipping on orders over ₹999</span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN HEADER ═══ */}
      <header className={cn(
        "bg-white dark:bg-card sticky top-0 z-50 border-b transition-shadow duration-200",
        scrolled ? "shadow-md" : "shadow-sm"
      )}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 h-14 md:h-16">
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 shrink-0" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </Button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Store size={16} className="text-white" />
              </div>
              <span className="text-lg font-extrabold text-gray-900 dark:text-foreground tracking-tight hidden sm:block">
                Shop<span className="text-blue-600">Micro</span>
              </span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for Products, Brands and More"
                  className="w-full h-10 md:h-11 pl-10 pr-4 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              {/* Wishlist */}
              <Link to="/wishlist" className="relative flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-muted rounded-lg px-2 py-1.5 transition-colors">
                <Heart size={18} className="text-gray-700 dark:text-foreground" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Dark mode toggle */}
              <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="h-9 w-9 hidden sm:flex">
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </Button>

              {/* User menu (or Login button for guests) */}
              {user ? (
              <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-muted rounded-lg px-2 py-1.5 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-foreground hidden md:block max-w-[100px] truncate">{user?.name}</span>
                    <ChevronDown size={14} className="text-gray-400 hidden md:block" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-1.5" align="end" sideOffset={8}>
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-sm font-semibold truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <div className="space-y-0.5">
                    {isAdmin && (
                      <Link to="/" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                        <BarChart3 size={15} /> Admin Dashboard
                      </Link>
                    )}
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                      <UserCircle size={15} /> My Profile
                    </Link>
                    <Link to="/orders" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                      <ClipboardList size={15} /> My Orders
                    </Link>
                    <Link to="/payments" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                      <CreditCard size={15} /> Payments
                    </Link>
                    <Link to="/wishlist" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                      <Heart size={15} /> My Wishlist
                    </Link>
                    <Link to="/profile/notifications" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
                      <BellRing size={15} /> Notifications
                    </Link>
                    <div className="border-t border-border my-1 pt-1">
                      <button onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-colors">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              ) : (
              <Link to="/login" className="flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-muted rounded-lg px-2 py-1.5 transition-colors">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  <UserCircle size={16} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-foreground hidden md:block">Login</span>
              </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-muted rounded-lg px-2 py-1.5 transition-colors">
                <ShoppingCart size={20} className="text-gray-700 dark:text-foreground" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-foreground hidden md:block">Cart</span>
              </Link>
            </div>
          </div>

          {/* ═══ CATEGORY NAV ═══ */}
          <nav className="hidden lg:flex items-center gap-1.5 border-t border-gray-100 dark:border-border -mx-4 px-4 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map((cat) => {
              const isActive = location.search.includes(encodeURIComponent(cat.name));
              const Icon = cat.icon;
              return (
                <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-[12px] font-semibold whitespace-nowrap rounded-lg transition-all duration-200",
                    isActive
                      ? `${cat.color} ring-1 ring-current/20 shadow-sm`
                      : `text-gray-600 dark:text-muted-foreground ${cat.hoverColor}`
                  )}>
                  <div className={cn(
                    "h-6 w-6 rounded-md flex items-center justify-center transition-all",
                    isActive ? 'bg-white/80 dark:bg-black/20 shadow-sm' : cat.color
                  )}>
                    <Icon size={13} />
                  </div>
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[300px] bg-white dark:bg-card shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Store size={16} className="text-white" />
                </div>
                <span className="font-bold">ShopMicro</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}><X size={20} /></Button>
            </div>
            <ScrollArea className="flex-1 py-2">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                Home
              </Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                All Products
              </Link>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</div>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link key={cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`} onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", cat.color)}>
                      <Icon size={13} />
                    </div>
                    {cat.name}
                  </Link>
                );
              })}
              <div className="border-t my-2" />
              <Link to="/orders" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                <ClipboardList size={16} /> My Orders
              </Link>
              <Link to="/payments" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                <CreditCard size={16} /> Payments
              </Link>
              <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                <Heart size={16} /> My Wishlist
              </Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                <UserCircle size={16} /> Profile
              </Link>
              {isAdmin && (
                <Link to="/admin/products" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                  <Settings size={16} /> Manage Products
                </Link>
              )}
            </ScrollArea>
            <div className="p-4 border-t">
              <button onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                <LogOut size={16} /> Sign Out
              </button>
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
    </div>
  );
}
