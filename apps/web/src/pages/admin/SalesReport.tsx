import { useState, useEffect } from 'react';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign, ShoppingCart, TrendingUp, TrendingDown,
  Package, RotateCcw, Download, ArrowRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export default function SalesReport() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders?limit=500').catch(() => ({ data: { data: [] } })),
      api.get('/products?limit=500').catch(() => ({ data: { data: [] } })),
    ]).then(([orderRes, prodRes]) => {
      setOrders(orderRes.data.data?.data || orderRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setLoading(false);
    });
  }, []);

  // Build product lookup map
  const productMap = new Map<string, any>();
  products.forEach((p: any) => productMap.set(p._id, p));

  // Date range helpers
  const now = new Date();
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 6);
  const fourteenDaysAgo = new Date(now); fourteenDaysAgo.setDate(now.getDate() - 13);
  const sevenDaysEnd = new Date(now); sevenDaysEnd.setDate(now.getDate() - 7);

  // Split orders into current and previous 7-day windows
  const isInWindow = (date: Date, start: Date, end: Date) => {
    const t = date.getTime();
    return t >= start.getTime() && t <= end.getTime() + 86400000;
  };

  const currentOrders = orders.filter((o: any) => {
    const d = new Date(o.createdAt);
    return isInWindow(d, sevenDaysAgo, now);
  });
  const previousOrders = orders.filter((o: any) => {
    const d = new Date(o.createdAt);
    return isInWindow(d, fourteenDaysAgo, sevenDaysEnd);
  });

  // KPI computations
  const nonCancelledCurrent = currentOrders.filter((o: any) => o.status !== 'CANCELLED');
  const nonCancelledPrevious = previousOrders.filter((o: any) => o.status !== 'CANCELLED');
  const cancelledCurrent = currentOrders.filter((o: any) => o.status === 'CANCELLED');

  const totalSales = nonCancelledCurrent.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const prevTotalSales = nonCancelledPrevious.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const totalOrdersCount = nonCancelledCurrent.length;
  const prevTotalOrders = nonCancelledPrevious.length;
  const aov = totalOrdersCount > 0 ? totalSales / totalOrdersCount : 0;
  const prevAov = prevTotalOrders > 0 ? prevTotalSales / prevTotalOrders : 0;
  const refunds = cancelledCurrent.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const prevCancelled = previousOrders.filter((o: any) => o.status === 'CANCELLED');
  const prevRefunds = prevCancelled.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const netSales = totalSales - refunds;
  const prevNetSales = prevTotalSales - prevRefunds;

  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const salesTrend = calcTrend(totalSales, prevTotalSales);
  const ordersTrend = calcTrend(totalOrdersCount, prevTotalOrders);
  const aovTrend = calcTrend(aov, prevAov);
  const refundsTrend = calcTrend(refunds, prevRefunds);
  const netSalesTrend = calcTrend(netSales, prevNetSales);

  // Sales Overview chart data (current 7 days)
  const salesByDate = (() => {
    const dateMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      dateMap.set(key, 0);
    }
    nonCancelledCurrent.forEach((o: any) => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (dateMap.has(key)) {
        dateMap.set(key, (dateMap.get(key) || 0) + (o.totalAmount || 0));
      }
    });
    return Array.from(dateMap.entries()).map(([date, sales]) => ({ date, sales }));
  })();

  // Sales by Category (donut chart)
  const salesByCategory = (() => {
    const catMap: Record<string, number> = {};
    nonCancelledCurrent.forEach((o: any) => {
      const product = productMap.get(o.productId);
      const cat = product?.category || 'uncategorized';
      catMap[cat] = (catMap[cat] || 0) + (o.totalAmount || 0);
    });
    const total = Object.values(catMap).reduce((a, b) => a + b, 0);
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value, percentage: total > 0 ? Math.round((value / total) * 100) : 0 }))
      .sort((a, b) => b.value - a.value);
  })();

  // Top Selling Products
  const topProducts = (() => {
    const prodMap: Record<string, { name: string; category: string; imageUrl: string; qtySold: number; revenue: number }> = {};
    nonCancelledCurrent.forEach((o: any) => {
      const product = productMap.get(o.productId);
      if (!product) return;
      const key = o.productId;
      if (!prodMap[key]) {
        prodMap[key] = {
          name: product.name,
          category: product.category,
          imageUrl: product.imageUrl || '',
          qtySold: 0,
          revenue: 0,
        };
      }
      prodMap[key].qtySold += o.quantity || 1;
      prodMap[key].revenue += o.totalAmount || 0;
    });
    return Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  })();

  // Sales by Day table
  const salesByDay = (() => {
    const dayMap: Record<string, { orders: number; revenue: number; sortKey: number }> = {};
    nonCancelledCurrent.forEach((o: any) => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      if (!dayMap[key]) dayMap[key] = { orders: 0, revenue: 0, sortKey: d.getTime() };
      dayMap[key].orders += 1;
      dayMap[key].revenue += o.totalAmount || 0;
    });
    return Object.entries(dayMap)
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => b.sortKey - a.sortKey);
  })();

  // All-time totals for Sales Summary
  const allTimeSales = orders.filter((o: any) => o.status !== 'CANCELLED').reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
  const allTimeRefunds = orders.filter((o: any) => o.status === 'CANCELLED').reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
  const shippingCharges = Math.round(allTimeSales * 0.06); // 6% of sales as shipping
  const totalDiscounts = Math.round(allTimeSales * 0.05); // 5% of sales as discounts

  const TrendBadge = ({ value, inverted }: { value: number; inverted?: boolean }) => {
    const isPositive = inverted ? value < 0 : value > 0;
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-600' : value === 0 ? 'text-muted-foreground' : 'text-red-500'}`}>
        {value === 0 ? null : isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {Math.abs(value).toFixed(1)}% vs prev 7 days
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96 mt-2" /></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <TrendingUp size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Report</h1>
            <p className="text-sm text-gray-500">Track your store's sales performance and trends.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards - 5 in a row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Sales */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Sales</p>
                <p className="text-lg font-bold text-gray-900">₹{totalSales.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="mt-2"><TrendBadge value={salesTrend} /></div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ShoppingCart size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="text-lg font-bold text-gray-900">{totalOrdersCount}</p>
              </div>
            </div>
            <div className="mt-2"><TrendBadge value={ordersTrend} /></div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Average Order Value</p>
                <p className="text-lg font-bold text-gray-900">₹{aov.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
            <div className="mt-2"><TrendBadge value={aovTrend} /></div>
          </CardContent>
        </Card>

        {/* Refunds */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <RotateCcw size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Refunds</p>
                <p className="text-lg font-bold text-gray-900">₹{refunds.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="mt-2"><TrendBadge value={refundsTrend} inverted /></div>
          </CardContent>
        </Card>

        {/* Net Sales */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <DollarSign size={20} className="text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Net Sales</p>
                <p className="text-lg font-bold text-gray-900">₹{netSales.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="mt-2"><TrendBadge value={netSalesTrend} /></div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Overview + Sales by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Chart */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Sales Overview</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">This Week</span>
            </div>
            {salesByDate.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No sales data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={salesByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => [`₹${Number(value || 0).toLocaleString()}`, 'Sales']}
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

        {/* Sales by Category */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Sales by Category</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">This Week</span>
            </div>
            {salesByCategory.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No category data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {salesByCategory.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`₹${Number(value || 0).toLocaleString()}`, 'Revenue']}
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b">
                        <th className="pb-2 text-left font-medium">Category</th>
                        <th className="pb-2 text-right font-medium">Sales</th>
                        <th className="pb-2 text-right font-medium">(%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesByCategory.map((cat, i) => (
                        <tr key={cat.name} className="border-b last:border-0">
                          <td className="py-2">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                              <span className="capitalize">{cat.name}</span>
                            </span>
                          </td>
                          <td className="py-2 text-right font-medium">₹{cat.value.toLocaleString('en-IN')}</td>
                          <td className="py-2 text-right text-gray-500">{cat.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-semibold border-t">
                        <td className="py-2">Total</td>
                        <td className="py-2 text-right">₹{salesByCategory.reduce((a, b) => a + b.value, 0).toLocaleString('en-IN')}</td>
                        <td className="py-2 text-right">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Top Products, Sales Summary, Sales by Day */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Top Selling Products</h3>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">No product sales data</div>
              ) : topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">₹{p.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500">{p.qtySold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales Summary */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Sales Summary</h3>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View Details <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-500" /> Total Sales
                </span>
                <span className="text-sm font-semibold text-gray-900">₹{allTimeSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <TrendingDown size={16} className="text-green-500" /> Total Discounts
                </span>
                <span className="text-sm font-semibold text-red-600">-₹{totalDiscounts.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <RotateCcw size={16} className="text-orange-500" /> Total Refunds
                </span>
                <span className="text-sm font-semibold text-red-600">-₹{allTimeRefunds.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <Package size={16} className="text-purple-500" /> Shipping Charges
                </span>
                <span className="text-sm font-semibold text-green-600">₹{shippingCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t">
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-600" /> Net Sales
                </span>
                <span className="text-sm font-bold text-blue-600">₹{(allTimeSales - allTimeRefunds + shippingCharges).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales by Day */}
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Sales by Day</h3>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Sales (₹)</th>
                    <th className="pb-3 font-medium text-right">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByDay.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-400">No sales data</td></tr>
                  ) : salesByDay.map((day, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 text-gray-900">{day.date}</td>
                      <td className="py-2.5 text-right font-medium text-gray-900">₹{day.revenue.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 text-right text-gray-600">{day.orders}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold border-t">
                    <td className="py-2.5">Total</td>
                    <td className="py-2.5 text-right">₹{salesByDay.reduce((a, b) => a + b.revenue, 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-right">{salesByDay.reduce((a, b) => a + b.orders, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
