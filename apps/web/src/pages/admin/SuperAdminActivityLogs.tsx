import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Activity, UserPlus, ShieldCheck, ShoppingBag, Package,
  Shield, Tag, Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  time: Date;
}

export default function SuperAdminActivityLogs() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchData = () => {
    if (!isSuperAdmin) return;
    Promise.all([
      api.get('/users').catch(() => ({ data: { data: { users: [] } } })),
      api.get('/orders?limit=200').catch(() => ({ data: { data: [] } })),
      api.get('/products?limit=200').catch(() => ({ data: { data: [] } })),
      api.get('/categories').catch(() => ({ data: { data: [] } })),
      api.get('/brands').catch(() => ({ data: { data: [] } })),
    ]).then(([userRes, orderRes, prodRes, catRes, brandRes]) => {
      setUsers(userRes.data.data?.users || []);
      setOrders(orderRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setCategories(catRes.data.data || []);
      setBrands(brandRes.data.data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!isSuperAdmin) { navigate('/'); return; }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    window.addEventListener('focus', fetchData);
    return () => { clearInterval(interval); window.removeEventListener('focus', fetchData); };
  }, [isSuperAdmin, navigate]);

  const activityLogs: ActivityItem[] = [];

  let activityCounter = 0;

  // User registrations
  users.forEach((u: any) => {
    if (u.createdAt) {
      activityLogs.push({
        id: `user-${u._id}-${activityCounter++}`,
        type: 'user_registered',
        title: 'New user registered',
        description: `${u.name} joined the platform`,
        icon: UserPlus,
        color: 'bg-blue-100 text-blue-600',
        time: new Date(u.createdAt),
      });
    }
    // Role updates
    if (u.updatedAt && u.updatedAt !== u.createdAt) {
      const roleLabel = u.role === 'ADMIN' ? 'Admin' : u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'User';
      activityLogs.push({
        id: `role-${u._id}-${activityCounter++}`,
        type: 'role_updated',
        title: 'Role updated',
        description: `${u.name} is now ${roleLabel}`,
        icon: ShieldCheck,
        color: 'bg-green-100 text-green-600',
        time: new Date(u.updatedAt),
      });
    }
  });

  // Products
  products.forEach((p: any) => {
    if (p.createdAt) {
      activityLogs.push({
        id: `product-${p._id}-${activityCounter++}`,
        type: 'product_added',
        title: 'New product added',
        description: `${p.name} was added to store`,
        icon: Package,
        color: 'bg-purple-100 text-purple-600',
        time: new Date(p.createdAt),
      });
    }
  });

  // Categories
  categories.forEach((c: any) => {
    if (c.createdAt || c._id) {
      const ts = c.createdAt ? new Date(c.createdAt) : new Date();
      activityLogs.push({
        id: `category-${c._id}-${activityCounter++}`,
        type: 'category_added',
        title: 'New category added',
        description: `"${c.name || c.title}" category was created`,
        icon: Tag,
        color: 'bg-pink-100 text-pink-600',
        time: ts,
      });
    }
  });

  // Brands
  brands.forEach((b: any) => {
    if (b.createdAt || b._id) {
      const ts = b.createdAt ? new Date(b.createdAt) : new Date();
      activityLogs.push({
        id: `brand-${b._id}-${activityCounter++}`,
        type: 'brand_added',
        title: 'New brand added',
        description: `"${b.name || b.title}" brand was created`,
        icon: Shield,
        color: 'bg-teal-100 text-teal-600',
        time: ts,
      });
    }
  });

  // Sort by time descending
  activityLogs.sort((a, b) => b.time.getTime() - a.time.getTime());

  const filtered = activityLogs.filter((log) => {
    const matchesSearch = log.title.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case 'user_registered': return 'User';
      case 'role_updated': return 'Role';
      case 'product_added': return 'Product';
      case 'category_added': return 'Category';
      case 'brand_added': return 'Brand';
      default: return type;
    }
  };

  const typeFilters = [
    { value: 'all', label: 'All Activity' },
    { value: 'user_registered', label: 'Users' },
    { value: 'role_updated', label: 'Roles' },
    { value: 'product_added', label: 'Products' },
    { value: 'category_added', label: 'Categories' },
    { value: 'brand_added', label: 'Brands' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Activity Logs</h1><p className="text-sm text-muted-foreground">Track all platform activity</p></div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Activity Logs</h1><p className="text-sm text-muted-foreground">Track all platform activity</p></div>
        <span className="px-3 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground">{filtered.length} activities</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search activity..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {typeFilters.map(f => (
            <Button key={f.value} variant={filterType === f.value ? 'default' : 'outline'} size="sm"
              onClick={() => setFilterType(f.value)}
              className={filterType === f.value ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Activity size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium text-muted-foreground">No activity found</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search or filter</p>
              </div>
            ) : filtered.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${log.color}`}>
                  <log.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{log.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">
                    {getBadgeLabel(log.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(log.time)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
