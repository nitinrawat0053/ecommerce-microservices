import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown,
  ArrowRight, AlertTriangle, PackageX, CreditCard, Clock,
  CheckCircle2, XCircle, BarChart3, Eye
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const CHART_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=200').catch(() => ({ data: { data: [] } })),
      api.get('/orders?limit=100').catch(() => ({ data: { data: [] } })),
      api.get('/payments?limit=100').catch(() => ({ data: { data: [] } })),
    ]).then(([prodRes, orderRes, payRes]) => {
      setProducts(prodRes.data.data || []);
      setOrders(orderRes.data.data || []);
      setPayments(payRes.data.data || []);
      setLoading(false);
    });
  }, []);

  // --- Computed Stats ---
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const pendingOrders = orders.filter((o: any) => o.status === 'PENDING').length;
  const lowStockProducts = products.filter((p: any) => p.stock > 0 && p.stock <= 5);
  const outOfStockProducts = products.filter((p: any) => p.stock === 0);

  // --- Chart Data: Revenue by date ---
  const revenueByDate: { date: string; revenue: number; orders: number }[] = [];
  const dateMap = new Map<string, { revenue: number; orders: number }>();
  [...orders].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).forEach((o: any) => {
    const d = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const existing = dateMap.get(d) || { revenue: 0, orders: 0 };
    dateMap.set(d, { revenue: existing.revenue + (o.totalAmount || 0), orders: existing.orders + 1 });
  });
  dateMap.forEach((val, key) => revenueByDate.push({ date: key, ...val }));

  // --- Chart Data: Order status ---
  const statusCount: Record<string, number> = {};
  orders.forEach((o: any) => { statusCount[o.status || 'UNKNOWN'] = (statusCount[o.status || 'UNKNOWN'] || 0) + 1; });
  const orderStatusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  // --- Chart Data: Payment methods ---
  const methodCount: Record<string, number> = {};
  payments.forEach((p: any) => { methodCount[p.method || 'OTHER'] = (methodCount[p.method || 'OTHER'] || 0) + 1; });
  const paymentMethodData = Object.entries(methodCount).map(([name, value]) => ({ name, value }));

  // --- Recent orders ---
  const recentOrders = [...orders]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of your store performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign size={22} className="text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold mt-1">{totalOrders}</p>
                {pendingOrders > 0 && (
                  <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                    <Clock size={12} /> {pendingOrders} pending
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ShoppingCart size={22} className="text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold mt-1">{totalProducts}</p>
                {outOfStockProducts.length > 0 && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <PackageX size={12} /> {outOfStockProducts.length} out of stock
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Package size={22} className="text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold mt-1">
                  ₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders).toLocaleString() : '0'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp size={22} className="text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 size={16} className="text-muted-foreground" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByDate.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No order data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueByDate}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart size={16} className="text-muted-foreground" />
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderStatusData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No orders yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {orderStatusData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs capitalize">{value.toLowerCase()}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Orders + Low Stock + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
            <Link to="/orders">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                View All <ArrowRight size={12} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No orders yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.map((order: any) => (
                  <div key={order._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ShoppingCart size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Order #{order._id?.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">₹{(order.totalAmount || 0).toLocaleString()}</p>
                      <Badge
                        variant={
                          order.status === 'PAID' ? 'default'
                            : order.status === 'PENDING' ? 'secondary'
                            : 'destructive'
                        }
                        className="text-[10px] mt-0.5"
                      >
                        {order.status || 'UNKNOWN'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock + Payment Methods stacked */}
        <div className="space-y-4">
          {/* Low Stock */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                Low Stock
              </CardTitle>
              <Link to="/admin/products">
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                  Manage <ArrowRight size={12} />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500/50" />
                  <p className="text-xs text-muted-foreground">All products well stocked</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-auto">
                  {[...outOfStockProducts.slice(0, 3), ...lowStockProducts.slice(0, 3)].map((p: any) => (
                    <div key={p._id} className="flex items-center gap-2">
                      {p.stock === 0 ? (
                        <PackageX size={12} className="text-destructive shrink-0" />
                      ) : (
                        <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                      )}
                      <p className="text-xs truncate flex-1">{p.name}</p>
                      <Badge
                        variant={p.stock === 0 ? 'destructive' : 'secondary'}
                        className="text-[10px] shrink-0"
                      >
                        {p.stock === 0 ? 'Out' : `${p.stock} left`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard size={14} className="text-muted-foreground" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethodData.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground text-xs">
                  No payment data
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentMethodData.map((m) => {
                    const total = paymentMethodData.reduce((s, x) => s + x.value, 0);
                    const pct = total > 0 ? Math.round((m.value / total) * 100) : 0;
                    return (
                      <div key={m.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium capitalize">{m.name.toLowerCase()}</span>
                          <span className="text-xs text-muted-foreground">{pct}% ({m.value})</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
