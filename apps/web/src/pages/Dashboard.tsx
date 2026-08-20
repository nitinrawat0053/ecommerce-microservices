import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, ShoppingCart, CreditCard, TrendingUp, ArrowUpRight, 
  RefreshCw, DollarSign, Users, Activity, Store, Box, 
  ArrowRight, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CHART_COLORS = ['hsl(12, 76%, 61%)', 'hsl(173, 58%, 39%)', 'hsl(197, 37%, 24%)', 'hsl(43, 74%, 66%)', 'hsl(27, 87%, 67%)'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, payments: 0, totalRevenue: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [productsRes, ordersRes, paymentsRes] = await Promise.allSettled([
        api.get('/products?limit=50'),
        api.get('/orders?limit=50'),
        user?._id ? api.get(`/payments/user/${user._id}`) : Promise.resolve({ data: { data: [] } }),
      ]);

      const productList = productsRes.status === 'fulfilled' ? (productsRes.value.data.data || []) : [];
      const orderList = ordersRes.status === 'fulfilled' ? (ordersRes.value.data.data || []) : [];
      const paymentList = paymentsRes.status === 'fulfilled' ? (paymentsRes.value.data.data || []) : [];

      setProducts(productList);
      setOrders(orderList);
      setPayments(paymentList);

      const totalRevenue = paymentList
        .filter((p: any) => p.status === 'SUCCESS')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      setStats({
        products: productsRes.status === 'fulfilled' ? (productsRes.value.data.pagination?.total || productList.length) : 0,
        orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.data.pagination?.totalOrders || orderList.length) : 0,
        payments: paymentList.length,
        totalRevenue,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- Chart Data Derivation ---

  // 1. Revenue trend (last 7 days from payments)
  const getRevenueTrend = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        fullDate: d.toISOString().split('T')[0],
        revenue: 0,
        orders: 0,
      };
    });

    payments.forEach((p: any) => {
      if (p.status === 'SUCCESS' && p.createdAt) {
        const payDate = new Date(p.createdAt).toISOString().split('T')[0];
        const bucket = last7Days.find(d => d.fullDate === payDate);
        if (bucket) bucket.revenue += p.amount || 0;
      }
    });

    orders.forEach((o: any) => {
      if (o.createdAt) {
        const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
        const bucket = last7Days.find(d => d.fullDate === orderDate);
        if (bucket) bucket.orders += 1;
      }
    });

    return last7Days;
  };

  // 2. Order status breakdown
  const getOrderStatusData = () => {
    const statusMap = { PENDING: 0, CONFIRMED: 0, CANCELLED: 0 };
    orders.forEach((o: any) => {
      const payment = payments.find((p: any) => p.orderId === o._id);
      if (payment?.status === 'SUCCESS') statusMap.CONFIRMED++;
      else if (payment?.status === 'FAILED') statusMap.CANCELLED++;
      else statusMap.PENDING++;
    });
    return [
      { name: 'Paid', value: statusMap.CONFIRMED, color: 'hsl(142, 76%, 36%)' },
      { name: 'Pending', value: statusMap.PENDING, color: 'hsl(38, 92%, 50%)' },
      { name: 'Cancelled', value: statusMap.CANCELLED, color: 'hsl(0, 84%, 60%)' },
    ].filter(d => d.value > 0);
  };

  // 3. Payment methods breakdown
  const getPaymentMethodsData = () => {
    const methodMap: Record<string, number> = {};
    payments.forEach((p: any) => {
      const method = p.method || p.paymentMethod || 'Unknown';
      methodMap[method] = (methodMap[method] || 0) + (p.amount || 0);
    });
    return Object.entries(methodMap).map(([name, amount]) => ({ name, amount }));
  };

  // 4. Top products
  const getTopProducts = () => {
    const productSales: Record<string, { name: string; sold: number; revenue: number }> = {};
    orders.forEach((o: any) => {
      const pid = typeof o.productId === 'object' ? o.productId?._id : o.productId;
      const product = products.find((p: any) => p._id === pid);
      if (product) {
        if (!productSales[product._id]) {
          productSales[product._id] = { name: product.name.slice(0, 15), sold: 0, revenue: 0 };
        }
        productSales[product._id].sold += o.quantity || 1;
        productSales[product._id].revenue += o.totalAmount || 0;
      }
    });
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const revenueTrend = getRevenueTrend();
  const orderStatusData = getOrderStatusData();
  const paymentMethodsData = getPaymentMethodsData();
  const topProducts = getTopProducts();

  const statCards = [
    { 
      label: 'Total Revenue', 
      value: `₹${stats.totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      change: '+12.5%',
      changeType: 'positive' as const,
    },
    { 
      label: 'Total Orders', 
      value: stats.orders.toString(), 
      icon: ShoppingCart, 
      change: '+8.2%',
      changeType: 'positive' as const,
    },
    { 
      label: 'Products', 
      value: stats.products.toString(), 
      icon: Package, 
      change: '+3',
      changeType: 'positive' as const,
    },
    { 
      label: 'Payments', 
      value: stats.payments.toString(), 
      icon: CreditCard, 
      change: `${payments.filter((p: any) => p.status === 'SUCCESS').length} successful`,
      changeType: 'neutral' as const,
    },
  ];

  const recentOrders = orders.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-muted rounded-xl animate-pulse" />
          <div className="h-80 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Here's what's happening with your store today.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, change, changeType }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <Icon size={18} className="text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {changeType === 'positive' ? (
                  <span className="text-emerald-600 font-medium">{change}</span>
                ) : (
                  <span>{change}</span>
                )}
                {' '}from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend - takes 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>Daily revenue and orders over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(12, 76%, 61%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(12, 76%, 61%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0 0% 100%)', 
                    border: '1px solid hsl(240 5.9% 90%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(12, 76%, 61%)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status</CardTitle>
            <CardDescription>Breakdown of all orders</CardDescription>
          </CardHeader>
          <CardContent>
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0 0% 100%)', 
                      border: '1px solid hsl(240 5.9% 90%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No order data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
            <CardDescription>Products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0 0% 100%)', 
                      border: '1px solid hsl(240 5.9% 90%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(12, 76%, 61%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No product data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
            <CardDescription>Revenue by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethodsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethodsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(0 0% 100%)', 
                      border: '1px solid hsl(240 5.9% 90%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {paymentMethodsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
                No payment data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <CardDescription>Latest {recentOrders.length} orders</CardDescription>
            </div>
            <Link to="/orders">
              <Button variant="ghost" size="sm">
                View all <ArrowRight size={14} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order: any) => {
                  const payment = payments.find((p: any) => p.orderId === order._id);
                  const status = payment?.status === 'SUCCESS' ? 'Paid' : payment?.status === 'FAILED' ? 'Cancelled' : 'Pending';
                  const statusVariant = status === 'Paid' ? 'success' : status === 'Cancelled' ? 'destructive' : 'warning';
                  
                  return (
                    <Link 
                      key={order._id} 
                      to={`/orders/${order._id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                          <Box size={16} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Order #{order._id.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₹{order.totalAmount?.toLocaleString()}</p>
                        <Badge variant={statusVariant as any} className="mt-1">
                          {status}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No orders yet. <Link to="/products" className="text-foreground font-medium hover:underline">Start shopping</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Browse Products', to: '/products', icon: Store },
              { label: 'View Cart', to: '/cart', icon: ShoppingCart },
              { label: 'My Orders', to: '/orders', icon: Package },
              { label: 'Payment History', to: '/payments', icon: CreditCard },
              { label: 'Profile', to: '/profile', icon: Users },
            ].map(({ label, to, icon: Icon }) => (
              <Link key={to} to={to}>
                <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                  <Icon size={16} className="text-muted-foreground" />
                  {label}
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
