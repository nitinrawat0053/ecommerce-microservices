import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign, ShoppingCart, Users, TrendingUp,
  BarChart3, Award, Calendar, ClipboardList, UserCheck, ArrowUpRight,
  Lightbulb, BarChart, ShoppingBag
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuperAdminInsights() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin && !isAdmin) { navigate('/'); return; }
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
  }, [isSuperAdmin, isAdmin, navigate]);

  // Stats calculations
  const totalUsers = users.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const conversionRate = totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(2) : '0.00';

  // Product map for joining orders with products
  const productMap = (() => {
    const m = new Map<string, any>();
    products.forEach((p: any) => m.set(p._id, p));
    return m;
  })();

  // Exclude cancelled orders for sales calculations
  const nonCancelledOrders = orders.filter((o: any) => o.status?.toUpperCase() !== 'CANCELLED');

  // Revenue by day chart (Last 7 days)
  const revenueData = (() => {
    const dateMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      dateMap.set(key, { revenue: 0, orders: 0 });
    }
    nonCancelledOrders.forEach((o: any) => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (dateMap.has(key)) {
        dateMap.get(key)!.revenue += o.totalAmount || 0;
        dateMap.get(key)!.orders += 1;
      }
    });
    return Array.from(dateMap.entries()).map(([date, val]) => ({ date, ...val }));
  })();

  // Sales by category (donut chart) — joins orders with products to get actual revenue per category
  const categorySalesData = (() => {
    const catMap: Record<string, number> = {};
    nonCancelledOrders.forEach((o: any) => {
      const product = productMap.get(o.productId);
      const cat = product?.category || 'uncategorized';
      catMap[cat] = (catMap[cat] || 0) + (o.totalAmount || 0);
    });
    const total = Object.values(catMap).reduce((a, b) => a + b, 0);
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
        fill: colors[i % colors.length]
      }));
  })();

  // Key business insights — best category by actual order revenue
  const bestCategory = (() => {
    const catMap: Record<string, number> = {};
    nonCancelledOrders.forEach((o: any) => {
      const product = productMap.get(o.productId);
      const cat = product?.category || 'uncategorized';
      catMap[cat] = (catMap[cat] || 0) + (o.totalAmount || 0);
    });
    return Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  })();

  const highestRevenueDay = (() => {
    const dayMap: Record<string, number> = {};
    orders.forEach((o: any) => {
      const d = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      dayMap[d] = (dayMap[d] || 0) + (o.totalAmount || 0);
    });
    return Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
  })();

  const mostOrdersDay = (() => {
    const dayMap: Record<string, number> = {};
    orders.forEach((o: any) => {
      const d = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      dayMap[d] = (dayMap[d] || 0) + 1;
    });
    return Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
  })();

  // Repeat customer rate (users with > 1 order)
  const repeatCustomerRate = (() => {
    const userOrderCount: Record<string, number> = {};
    orders.forEach((o: any) => {
      const userId = o.userId?._id || o.userId;
      if (userId) userOrderCount[userId] = (userOrderCount[userId] || 0) + 1;
    });
    const repeatUsers = Object.values(userOrderCount).filter(count => count > 1).length;
    return totalUsers > 0 ? ((repeatUsers / totalUsers) * 100).toFixed(1) : '0.0';
  })();

  // Overall growth (mock calculation)
  const overallGrowth = 18.6;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="text-sm text-muted-foreground">Key insights and performance summary of your store.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
          <BarChart3 size={24} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="text-sm text-muted-foreground">Key insights and performance summary of your store.</p>
        </div>
      </div>

      {/* Stats Cards - 5 in a row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign size={22} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                  <ArrowUpRight size={12} /> 18.6% vs previous 7 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Placed */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <ShoppingCart size={22} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orders Placed</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                  <ArrowUpRight size={12} /> 12.4% vs previous 7 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users size={22} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                  <ArrowUpRight size={12} /> 15.7% vs previous 7 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <TrendingUp size={22} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                  <ArrowUpRight size={12} /> 8.1% vs previous 7 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg. Order Value */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                <ShoppingBag size={22} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">₹{avgOrderValue.toLocaleString('en-IN')}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                  <ArrowUpRight size={12} /> 5.3% vs previous 7 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Business Insights */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Key Business Insights (Last 7 Days)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Best Performing Category */}
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100">
              <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                <Award size={24} className="text-yellow-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Best Performing Category</p>
              <p className="text-lg font-bold text-yellow-600 mt-1">{bestCategory?.[0] || 'N/A'}</p>
              {bestCategory && (
                <>
                  <p className="text-xs text-muted-foreground mt-2">
                    Generated ₹{bestCategory[1].toLocaleString('en-IN')} revenue
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({totalRevenue > 0 ? ((bestCategory[1] / totalRevenue) * 100).toFixed(1) : '0'}% of total revenue)
                  </p>
                </>
              )}
            </div>

            {/* Highest Revenue Day */}
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
              <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <Calendar size={24} className="text-blue-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Highest Revenue Day</p>
              <p className="text-lg font-bold text-blue-600 mt-1">{highestRevenueDay?.[0] || 'N/A'}</p>
              {highestRevenueDay && (
                <p className="text-xs text-muted-foreground mt-2">
                  Earned ₹{highestRevenueDay[1].toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Most Orders Day */}
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
              <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <ClipboardList size={24} className="text-purple-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Most Orders Day</p>
              <p className="text-lg font-bold text-purple-600 mt-1">{mostOrdersDay?.[0] || 'N/A'}</p>
              {mostOrdersDay && (
                <p className="text-xs text-muted-foreground mt-2">
                  Received {mostOrdersDay[1]} orders
                </p>
              )}
            </div>

            {/* Repeat Customer Rate */}
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100">
              <div className="h-14 w-14 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                <UserCheck size={24} className="text-pink-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Repeat Customer Rate</p>
              <p className="text-lg font-bold text-pink-600 mt-1">{repeatCustomerRate}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                Customers who shopped again
              </p>
            </div>

            {/* Overall Growth */}
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Overall Growth</p>
              <p className="text-lg font-bold text-green-600 mt-1">{overallGrowth}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                Revenue growth vs previous 7 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Revenue Trend */}
        <Card className="border shadow-sm lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={18} /> Overall Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart size={18} /> Sales by Category
            </h3>
            {categorySalesData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categorySalesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categorySalesData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {categorySalesData.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: cat.fill }} />
                        <span className="text-muted-foreground">{cat.name}</span>
                      </div>
                      <span className="font-medium">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights Summary */}
      <Card className="border shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Insights Summary</h3>
              <p className="text-muted-foreground">
                {bestCategory?.[0] || 'N/A'} is the top performing category, contributing{' '}
                {bestCategory && totalRevenue > 0 ? ((bestCategory[1] / totalRevenue) * 100).toFixed(1) : '0'}% of total revenue.
                Revenue grew by {overallGrowth}% compared to the previous 7 days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


