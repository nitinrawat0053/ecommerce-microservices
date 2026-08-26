import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign, ShoppingCart, Users, Package, TrendingUp,
  BarChart3, Tag, ShoppingBag, PackageCheck, Clock
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuperAdminInsights() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin) { navigate('/'); return; }
    Promise.all([
      api.get('/users').catch(() => ({ data: { data: { users: [] } } })),
      api.get('/orders?limit=200').catch(() => ({ data: { data: [] } })),
      api.get('/products?limit=200').catch(() => ({ data: { data: [] } })),
    ]).then(([userRes, orderRes, prodRes]) => {
      setUsers(userRes.data.data?.users || []);
      setOrders(orderRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setLoading(false);
    });
  }, [isSuperAdmin, navigate]);

  const totalUsers = users.length;
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

  // Revenue by day chart
  const revenueData = (() => {
    const dateMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      dateMap.set(key, { revenue: 0, orders: 0 });
    }
    orders.forEach((o: any) => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (dateMap.has(key)) {
        dateMap.get(key)!.revenue += o.totalAmount || 0;
        dateMap.get(key)!.orders += 1;
      }
    });
    return Array.from(dateMap.entries()).map(([date, val]) => ({ date, ...val }));
  })();

  // Order status pie chart
  const orderStatusData = (() => {
    const statusMap: Record<string, number> = {};
    orders.forEach((o: any) => { statusMap[o.status || 'UNKNOWN'] = (statusMap[o.status || 'UNKNOWN'] || 0) + 1; });
    const colors: Record<string, string> = { CONFIRMED: '#22c55e', PENDING: '#f59e0b', SHIPPED: '#3b82f6', DELIVERED: '#10b981', CANCELLED: '#ef4444', PROCESSING: '#8b5cf6' };
    return Object.entries(statusMap).map(([name, value]) => ({ name, value, fill: colors[name] || '#9ca3af' }));
  })();

  // Top categories
  const topCategories = (() => {
    const catMap: Record<string, number> = {};
    products.forEach((p: any) => { const c = p.category || 'Uncategorized'; catMap[c] = (catMap[c] || 0) + 1; });
    return Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  })();

  // Recent activity
  const recentOrders = [...orders].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const PIE_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#9ca3af'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Insights</h1><p className="text-sm text-muted-foreground">Platform analytics and performance</p></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Insights</h1><p className="text-sm text-muted-foreground">Platform analytics and performance</p></div>
        <span className="px-3 py-1.5 bg-muted rounded-lg text-sm text-muted-foreground">
          {new Date(Date.now() - 6 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center"><DollarSign size={22} className="text-emerald-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><TrendingUp size={12} /> 15.2% from last 7 days</p>
          </div>
        </div></CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center"><ShoppingCart size={22} className="text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><TrendingUp size={12} /> 8.4% from last 7 days</p>
          </div>
        </div></CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center"><Users size={22} className="text-violet-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><TrendingUp size={12} /> 12.5% from last 7 days</p>
          </div>
        </div></CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center"><Package size={22} className="text-orange-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Products</p><p className="text-2xl font-bold">{totalProducts.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><TrendingUp size={12} /> 5.1% from last 7 days</p>
          </div>
        </div></CardContent></Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm"><CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 size={18} /> Revenue & Orders Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Revenue (₹)" />
              <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><ShoppingBag size={18} /> Order Status Distribution</h3>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No order data available</div>
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {orderStatusData.map((s, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.fill }} />{s.name} ({s.value})</span>
            ))}
          </div>
        </CardContent></Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm"><CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Tag size={18} /> Top Categories</h3>
          <div className="space-y-3">
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No category data available</p>
            ) : topCategories.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">{count} products</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 rounded-full h-2 transition-all" style={{ width: `${(count / topCategories[0][1]) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Clock size={18} /> Recent Activity</h3>
            <Button variant="ghost" size="sm" className="text-blue-600 text-sm" onClick={() => navigate('/orders')}>View All Orders</Button>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : recentOrders.map((o: any) => (
              <div key={o._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <PackageCheck size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Order #{o._id?.slice(-6)?.toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{o.userId?.name || 'Customer'} • ₹{(o.totalAmount || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={o.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-200' : o.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : o.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
                    {o.status || 'UNKNOWN'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}