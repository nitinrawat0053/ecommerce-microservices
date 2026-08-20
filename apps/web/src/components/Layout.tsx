import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingCart, Package, CreditCard, User, LayoutDashboard, 
  LogOut, Menu, Store, ChevronRight, Settings, Bell, Moon, Sun,
  AlertTriangle, PackageX, PackageCheck, Check
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface StockAlert {
  productId: string;
  name: string;
  stock: number;
  type: 'low' | 'out';
}

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Dark mode effect
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Fetch stock alerts for admin
  const fetchStockAlerts = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/products?limit=100');
      const products = res.data.data || [];
      const alerts: StockAlert[] = products
        .filter((p: any) => p.stock <= 5)
        .map((p: any) => ({
          productId: p._id,
          name: p.name,
          stock: p.stock,
          type: p.stock === 0 ? 'out' : 'low',
        }));
      setStockAlerts(alerts);
    } catch (err) {
      console.error('Failed to fetch stock alerts:', err);
    }
  }, [isAdmin]);

  useEffect(() => { fetchStockAlerts(); }, [fetchStockAlerts]);

  // Refresh alerts every 60s
  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(fetchStockAlerts, 60000);
    return () => clearInterval(interval);
  }, [isAdmin, fetchStockAlerts]);

  const activeAlerts = stockAlerts.filter(a => !dismissed.has(a.productId));
  const unreadCount = activeAlerts.length;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/cart', label: 'Cart', icon: ShoppingCart },
    { to: '/orders', label: 'Orders', icon: Package },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-50",
          "w-[280px] bg-card border-r border-border",
          "flex flex-col",
          "transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
            <Link to="/" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Store size={16} className="text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">ShopMicro</span>
            </Link>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-1">
              <p className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Menu
              </p>
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = isActive(to);
                return (
                  <Tooltip key={to} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        to={to}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                          "transition-colors",
                          active 
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon size={18} />
                        {label}
                        {active && <ChevronRight size={14} className="ml-auto" />}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {isAdmin && (
                <>
                  <div className="px-3 py-1 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin
                  </div>
                  <Link
                    to="/admin/products"
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                      "transition-colors",
                      location.pathname.startsWith('/admin')
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Settings size={18} />
                    Manage Products
                  </Link>
                </>
              )}
            </div>
          </ScrollArea>

          {/* User Section */}
          <div className="p-4 border-t border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive">
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4 shrink-0">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </Button>
            
            <div className="flex-1" />

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Badge variant="secondary" className="hidden sm:flex">
                  ADMIN
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                className="h-9 w-9"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </Button>

              <Separator orientation="vertical" className="h-6" />

              {/* Notification Bell - Admin only */}
              {isAdmin ? (
                <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Stock Alerts</h4>
                        <Badge variant="destructive" className="text-[10px]">{unreadCount}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Products running low on stock</p>
                    </div>
                    <ScrollArea className="max-h-80">
                      {activeAlerts.length === 0 ? (
                        <div className="p-6 text-center">
                          <PackageCheck size={32} className="mx-auto mb-2 text-emerald-500/50" />
                          <p className="text-sm text-muted-foreground">All products are well stocked</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {activeAlerts.map((alert) => (
                            <div key={alert.productId} className="p-3 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                  alert.type === 'out' ? "bg-destructive/10" : "bg-amber-500/10"
                                )}>
                                  {alert.type === 'out' ? (
                                    <PackageX size={14} className="text-destructive" />
                                  ) : (
                                    <AlertTriangle size={14} className="text-amber-500" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{alert.name}</p>
                                  <p className={cn(
                                    "text-xs font-medium mt-0.5",
                                    alert.type === 'out' ? "text-destructive" : "text-amber-600"
                                  )}>
                                    {alert.type === 'out' ? 'Out of stock' : `Only ${alert.stock} left`}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  title="Dismiss"
                                  onClick={() => {
                                    setDismissed(prev => new Set([...prev, alert.productId]));
                                  }}
                                >
                                  <Check size={12} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    {activeAlerts.length > 0 && (
                      <div className="p-3 border-t border-border">
                        <Link to="/admin/products" onClick={() => setNotificationOpen(false)}>
                          <Button variant="outline" size="sm" className="w-full">
                            Manage Products
                          </Button>
                        </Link>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              ) : (
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell size={18} />
                </Button>
              )}

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
