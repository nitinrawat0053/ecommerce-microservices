import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package, Users, DollarSign, TrendingUp,
  ShoppingBag, Calendar
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=200').catch(() => ({ data: { data: [] } })),
      api.get('/orders?limit=100').catch(() => ({ data: { data: { data: [] } } })),
      api.get('/users').catch(() => ({ data: { data: { users: [] } } })),
    ]).then(([prodRes, orderRes, userRes]) => {
      setProducts(prodRes.data.data || []);
      setOrders(orderRes.data.data?.data || orderRes.data.data || []);
      setUsers(userRes.data.data?.users || []);
      setLoading(false);
    });
  }, []);

  // --- Computed Stats ---
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalCustomers = users.filter((u: any) => u.role === 'USER').length;
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

  // --- Chart Data: Sales by date ---
  const salesByDate: { date: string; sales: number }[] = [];
  const dateMap = new Map<string, number>();
  [...orders].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).forEach((o: any) => {
    const d = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    dateMap.set(d, (dateMap.get(d) || 0) + (o.totalAmount || 0));
  });
  dateMap.forEach((val, key) => salesByDate.push({ date: key, sales: val }));

  // --- Low Stock Products ---
  const lowStockProducts = products.filter((p: any) => p.stock > 0 && p.stock <= 10);

  // --- Recent Orders ---
  const recentOrders = [...orders]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // --- Top Selling Products (simulated - using products with most stock sold) ---
  const topProducts = [...products]
    .sort((a: any, b: any) => (b.stock || 0) - (a.stock || 0))
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
      case 'SHIPPED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PROCESSING': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Electronics': 'bg-blue-100 text-blue-700',
      'Fashion': 'bg-purple-100 text-purple-700',
      'Home & Kitchen': 'bg-green-100 text-green-700',
      'Beauty': 'bg-pink-100 text-pink-700',
      'Sports': 'bg-orange-100 text-orange-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96 mt-2" /></div>
        <div className="grid grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || 'Admin'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
          <Calendar size={16} className="text-gray-400" />
          {new Date(Date.now()-6*86400000).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})} - {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Sales</p>
                <p className="text-lg font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <TrendingUp size={12} /> 12.5% vs last week
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <ShoppingBag size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Orders</p>
                <p className="text-lg font-bold text-gray-900">{totalOrders}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <TrendingUp size={12} /> 8.2% vs last week
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Users size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Customers</p>
                <p className="text-lg font-bold text-gray-900">{totalCustomers}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <TrendingUp size={12} /> 15.3% vs last week
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Package size={20} className="text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Products</p>
                <p className="text-lg font-bold text-gray-900">{totalProducts}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <TrendingUp size={12} /> 5.7% vs last week
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <DollarSign size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-lg font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <TrendingUp size={12} /> 10.1% vs last week
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Sales Overview</h3>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
            </div>
            {salesByDate.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                No sales data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={salesByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => [`₹${Number(value || 0).toLocaleString()}`, 'Sales (₹)']}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={{ r: 4, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div className="flex justify-center mt-2">
              <span className="text-xs text-gray-500 flex items-center gap-2">
                <span className="w-3 h-0.5 bg-blue-600 rounded"></span>
                Sales (₹)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recent Orders</h3>
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="text-blue-600 text-sm h-8">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No orders yet</div>
              ) : recentOrders.map((order: any) => (
                <div key={order._id} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <ShoppingBag size={16} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      #{order._id?.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.userId?.name || 'Customer'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${getStatusColor(order.status)}`}>
                      {order.status || 'UNKNOWN'}
                    </Badge>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {recentOrders.length > 0 && (
              <Link to="/orders" className="block mt-4 text-sm text-blue-600 font-medium hover:underline">
                View All Orders →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Top Selling Products</h3>
              <Link to="/admin/products">
                <Button variant="ghost" size="sm" className="text-blue-600 text-sm h-8">
                  View All
                </Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium text-center">Stock</th>
                    <th className="pb-3 font-medium text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-400">No products</td></tr>
                  ) : topProducts.map((p: any) => (
                    <tr key={p._id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Package size={16} className="text-gray-400" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className={`text-xs ${getCategoryColor(p.category)}`}>
                          {p.category || 'N/A'}
                        </Badge>
                      </td>
                      <td className="py-3 text-center text-gray-600">{p.stock || 0}</td>
                      <td className="py-3 text-right font-semibold text-gray-900">
                        ₹{(p.price || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Low Stock Alert</h3>
              <Link to="/admin/products">
                <Button variant="ghost" size="sm" className="text-blue-600 text-sm h-8">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">All products well stocked</div>
              ) : lowStockProducts.slice(0, 5).map((p: any) => (
                <div key={p._id} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-amber-600">Only {p.stock} left in stock</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200 shrink-0">
                    Low Stock
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

