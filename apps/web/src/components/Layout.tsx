import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingCart, Package, CreditCard, User, LayoutDashboard,
  LogOut, Menu, Store, ChevronLeft, Bell, Moon, Sun,
  UserCircle, ClipboardList, BellRing, BarChart3, Shield,
  Users, ShieldCheck, ShoppingBag, Tag, BarChart2,
  Activity, Settings, PackageCheck, AlertTriangle, PackageX, Check
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface StockAlert { productId: string; name: string; stock: number; type: 'low' | 'out'; }

export default function Layout() {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const fetchStockAlerts = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/products?limit=100');
      setStockAlerts((res.data.data || []).filter((p: any) => p.stock <= 5).map((p: any) => ({ productId: p._id, name: p.name, stock: p.stock, type: p.stock === 0 ? 'out' : 'low' })));
    } catch {}
  }, [isAdmin]);

  useEffect(() => { fetchStockAlerts(); }, [fetchStockAlerts]);
  useEffect(() => { if (!isAdmin) return; const i = setInterval(fetchStockAlerts, 60000); return () => clearInterval(i); }, [isAdmin, fetchStockAlerts]);

  const activeAlerts = stockAlerts.filter(a => !dismissed.has(a.productId));
  const unreadCount = activeAlerts.length;
  const isActive = (p: string) => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p);

  const sidebarWidth = sidebarCollapsed ? 'w-[72px]' : 'w-[260px]';

  const superAdminSections = [
    { title: 'SUPER ADMIN', items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { title: 'USERS & ACCESS', items: [{ to: '/admin/users', label: 'Users', icon: Users }, { to: '#', label: 'Roles & Permissions', icon: ShieldCheck }] },
    { title: 'COMMERCE', items: [{ to: '/orders', label: 'Orders', icon: ShoppingBag }, { to: '/admin/products', label: 'Products', icon: Package }, { to: '#', label: 'Categories', icon: Tag }, { to: '#', label: 'Brands', icon: Tag }] },
    { title: 'INSIGHTS', items: [{ to: '#', label: 'Analytics', icon: BarChart2 }, { to: '#', label: 'Activity Logs', icon: Activity }] },
    { title: 'SYSTEM', items: [{ to: '#', label: 'Settings', icon: Settings }] },
  ];

  const adminNavItems = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/cart', label: 'Cart', icon: ShoppingCart },
    { to: '/orders', label: 'Orders', icon: Package },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out",
        sidebarWidth,
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn("h-16 flex items-center border-b border-gray-200 dark:border-gray-800 shrink-0", sidebarCollapsed ? "justify-center px-2" : "px-5")}>
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <Store size={16} className="text-white" />
            </div>
            {!sidebarCollapsed && <span className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">ShopMicro</span>}
          </Link>
        </div>

        <ScrollArea className="flex-1 px-2 py-4">
          {isSuperAdmin ? (
            <div className="space-y-6">
              {superAdminSections.map((section, si) => (
                <div key={si}>
                  {!sidebarCollapsed && <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{section.title}</p>}
                  <div className="space-y-0.5">
                    {section.items.map(({ to, label, icon: Icon }) => {
                      const active = isActive(to);
                      return (
                        <Link key={label} to={to} onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                            sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                            active ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )} title={sidebarCollapsed ? label : undefined}>
                          <Icon size={18} className="shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">{label}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {!sidebarCollapsed && <p className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Menu</p>}
              {adminNavItems.map(({ to, label, icon: Icon }) => {
                const active = isActive(to);
                return (
                  <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                      sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                      active ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )} title={sidebarCollapsed ? label : undefined}>
                    <Icon size={18} className="shrink-0" />
                    {!sidebarCollapsed && <>{label}{active && <span className="ml-auto"><ChevronLeft size={14} className="-rotate-90" /></span>}</>}
                  </Link>
                );
              })}
              {isAdmin && (
                <>
                  {!sidebarCollapsed && <p className="px-3 py-1 mt-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Admin</p>}
                  <Link to="/admin/dashboard" onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                      sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                      location.pathname.startsWith('/admin/dashboard') ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                    )} title={sidebarCollapsed ? 'Dashboard' : undefined}>
                    <BarChart3 size={18} className="shrink-0" />{!sidebarCollapsed && 'Dashboard'}
                  </Link>
                  <Link to="/admin/products" onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                      sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                      location.pathname.startsWith('/admin/products') ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                    )} title={sidebarCollapsed ? 'Manage Products' : undefined}>
                    <Settings size={18} className="shrink-0" />{!sidebarCollapsed && 'Manage Products'}
                  </Link>
                  {isSuperAdmin && (
                    <Link to="/admin/users" onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                        sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                        location.pathname.startsWith('/admin/users') ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                      )} title={sidebarCollapsed ? 'User Management' : undefined}>
                      <Shield size={18} className="shrink-0" />{!sidebarCollapsed && 'User Management'}
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Version badge */}
        {isSuperAdmin && !sidebarCollapsed && (
          <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-500">
              <Package size={14} /><span>ShopMicro v1.0.0</span>
            </div>
          </div>
        )}

        {/* User Section */}
        <div className={cn("border-t border-gray-200 dark:border-gray-800 shrink-0", sidebarCollapsed ? "p-2" : "p-4")}>
          <div className={cn("flex items-center", sidebarCollapsed ? "justify-center" : "gap-3")}>
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <Button variant="ghost" size="icon" onClick={logout} className="shrink-0 h-8 w-8 text-gray-400 hover:text-red-500">
                <LogOut size={16} />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center px-4 lg:px-6 gap-3 shrink-0">
          {/* Sidebar Toggle */}
          <Button variant="ghost" size="icon" onClick={() => {
            if (window.innerWidth < 1024) {
              setSidebarOpen(!sidebarOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }} className="h-9 w-9 shrink-0">
            {sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </Button>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input type="text" placeholder="Search for users, orders, products and more..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Notification Bell */}
            {isAdmin ? (
              <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b"><div className="flex items-center justify-between"><h4 className="font-semibold text-sm">Stock Alerts</h4><Badge variant="destructive" className="text-[10px]">{unreadCount}</Badge></div></div>
                  <ScrollArea className="max-h-80">
                    {activeAlerts.length === 0 ? (
                      <div className="p-6 text-center"><PackageCheck size={32} className="mx-auto mb-2 text-emerald-500/50" /><p className="text-sm text-gray-500">All products well stocked</p></div>
                    ) : activeAlerts.map((alert) => (
                      <div key={alert.productId} className="p-3 hover:bg-gray-50 flex items-center gap-3 border-b">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", alert.type === 'out' ? "bg-red-100" : "bg-amber-100")}>
                          {alert.type === 'out' ? <PackageX size={14} className="text-red-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
                        </div>
                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{alert.name}</p><p className={cn("text-xs font-medium", alert.type === 'out' ? "text-red-500" : "text-amber-600")}>{alert.type === 'out' ? 'Out of stock' : `Only ${alert.stock} left`}</p></div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDismissed(prev => new Set([...prev, alert.productId]))}><Check size={12} /></Button>
                      </div>
                    ))}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9"><Bell size={18} /></Button>
            )}

            {/* Dark Mode Toggle */}
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="h-9 w-9">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* User Profile Dropdown */}
            <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden sm:block text-gray-900 dark:text-white">{isSuperAdmin ? 'Super Admin' : user?.name}</span>
                  <ChevronLeft size={14} className={cn("text-gray-400 transition-transform duration-200 -rotate-90", userMenuOpen && "rotate-90")} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1.5" align="end" sideOffset={8}>
                <div className="px-3 py-2 border-b mb-1">
                  <p className="text-sm font-semibold">{isSuperAdmin ? 'Super Admin' : user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <div className="space-y-0.5">
                  <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"><UserCircle size={16} />My Profile</Link>
                  {!isSuperAdmin && <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"><ClipboardList size={16} />My Orders</Link>}
                  <Link to="/profile/notifications" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"><BellRing size={16} />Notification Preferences</Link>
                  <button onClick={() => { setUserMenuOpen(false); logout(); }} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full"><LogOut size={16} />Log Out</button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 xl:p-8 bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
