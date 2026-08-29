import { useState, useEffect, useRef } from 'react';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, UserPlus, UserCheck, UserX, Search,
  Download, Filter, ChevronLeft, ChevronRight, Calendar,
  Eye, Edit2, Trash2, MoreVertical
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

export default function AdminCustomers() {
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJoined, setFilterJoined] = useState('all');
  const [filterMinOrders, setFilterMinOrders] = useState('');
  const [filterMaxOrders, setFilterMaxOrders] = useState('');
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const perPage = 10;

  useEffect(() => {
    Promise.all([
      api.get('/users').catch(() => ({ data: { data: { users: [] } } })),
      api.get('/orders?limit=500').catch(() => ({ data: { data: { data: [] } } })),
    ]).then(([userRes, orderRes]) => {
      setUsers(userRes.data.data?.users || []);
      setOrders(orderRes.data.data?.data || orderRes.data.data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilter(false);
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) setOpenAction(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const customers = users.filter((u: any) => u.role === 'USER');

  const getOrdersForUser = (userId: string) => orders.filter((o: any) => o.userId?._id === userId || o.userId === userId);
  const getTotalSpent = (userId: string) => getOrdersForUser(userId).reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

  const totalCustomers = customers.length;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const newCustomers = customers.filter((c: any) => new Date(c.createdAt) >= sevenDaysAgo).length;
  const activeCustomers = customers.filter((c: any) => c.isActive !== false).length;
  const inactiveCustomers = customers.filter((c: any) => c.isActive === false).length;

  // Build chart data
  const buildChartData = () => {
    const days = chartPeriod === 'week' ? 7 : chartPeriod === 'month' ? 30 : 365;
    const data: { date: string; newCustomers: number; active: number; inactive: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const newCount = customers.filter(c => {
        const created = new Date(c.createdAt);
        return created >= dayStart && created <= dayEnd;
      }).length;
      const activeCount = customers.filter(c => {
        const created = new Date(c.createdAt);
        return created >= dayStart && created <= dayEnd && c.isActive !== false;
      }).length;
      const inactiveCount = customers.filter(c => {
        const created = new Date(c.createdAt);
        return created >= dayStart && created <= dayEnd && c.isActive === false;
      }).length;
      data.push({ date: dateStr, newCustomers: newCount, active: activeCount, inactive: inactiveCount });
    }
    return data;
  };

  const chartData = buildChartData();

  // Apply filters
  const filtered = customers.filter((c: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (!(c.name || '').toLowerCase().includes(q) && !(c.email || '').toLowerCase().includes(q) && !(c.phone || '').toLowerCase().includes(q)) return false;
    }
    if (filterStatus === 'active' && c.isActive === false) return false;
    if (filterStatus === 'inactive' && c.isActive !== false) return false;
    if (filterJoined !== 'all') {
      const created = new Date(c.createdAt);
      const now = new Date();
      let daysBack = 0;
      if (filterJoined === '7d') daysBack = 7;
      else if (filterJoined === '30d') daysBack = 30;
      else if (filterJoined === '90d') daysBack = 90;
      const cutoff = new Date(now.getTime() - daysBack * 86400000);
      if (created < cutoff) return false;
    }
    if (filterMinOrders) {
      const count = getOrdersForUser(c._id).length;
      if (count < parseInt(filterMinOrders)) return false;
    }
    if (filterMaxOrders) {
      const count = getOrdersForUser(c._id).length;
      if (count > parseInt(filterMaxOrders)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const avatarColors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700', 'bg-teal-100 text-teal-700', 'bg-amber-100 text-amber-700', 'bg-indigo-100 text-indigo-700'];

  const formatDate = (d: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-72" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
            <p className="text-sm text-gray-500">Manage and view all your store customers.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Customers</p>
                <p className="text-lg font-bold text-gray-900">{totalCustomers}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <span>↑</span> 15.3% vs last week
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <UserPlus size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">New Customers</p>
                <p className="text-lg font-bold text-gray-900">{newCustomers}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <span>↑</span> 8.4% vs last week
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <UserCheck size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active Customers</p>
                <p className="text-lg font-bold text-gray-900">{activeCustomers}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <span>↑</span> 12.1% vs last week
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                <UserX size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Inactive Customers</p>
                <p className="text-lg font-bold text-gray-900">{inactiveCustomers}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
              <span>↓</span> 4.2% vs last week
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Growth Chart */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Customer Growth</h3>
              <p className="text-sm text-gray-500">Track new, active and inactive customers over time.</p>
            </div>
            <div className="flex gap-1">
              {([
                { key: 'week' as const, label: 'Last Week' },
                { key: 'month' as const, label: 'Last Month' },
                { key: 'year' as const, label: 'Last Year' },
              ]).map(({ key, label }) => (
                <Button
                  key={key}
                  variant={chartPeriod === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartPeriod(key)}
                  className={chartPeriod === key ? 'bg-blue-600 text-white' : ''}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="newCustomers" name="New Customers" stroke="#2563eb" strokeWidth={2} dot={{ r: 4, fill: '#2563eb' }} />
              <Line type="monotone" dataKey="active" name="Active New Customers" stroke="#16a34a" strokeWidth={2} dot={{ r: 4, fill: '#16a34a' }} />
              <Line type="monotone" dataKey="inactive" name="Inactive New Customers" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Search & Table */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative" ref={filterRef}>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilter(!showFilter)}>
                <Filter size={14} /> Filter
              </Button>
              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
                  <h4 className="font-semibold text-sm mb-3">Filter by</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Joined Date</label>
                      <select value={filterJoined} onChange={e => setFilterJoined(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Min. Orders</label>
                      <input type="number" placeholder="Min orders" value={filterMinOrders} onChange={e => setFilterMinOrders(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Max. Orders</label>
                      <input type="number" placeholder="Max orders" value={filterMaxOrders} onChange={e => setFilterMaxOrders(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => { setFilterStatus('all'); setFilterJoined('all'); setFilterMinOrders(''); setFilterMaxOrders(''); }}>Clear</Button>
                    <Button size="sm" className="bg-blue-600 text-white" onClick={() => { setShowFilter(false); setPage(1); }}>Apply</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium">No customers found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-3 font-medium">Customer</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Phone</th>
                      <th className="pb-3 font-medium">Orders</th>
                      <th className="pb-3 font-medium">Total Spent</th>
                      <th className="pb-3 font-medium">Joined On</th>
                      <th className="pb-3 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((customer: any, idx: number) => {
                      const orderCount = getOrdersForUser(customer._id).length;
                      const totalSpent = getTotalSpent(customer._id);
                      const colorClass = avatarColors[(page - 1) * perPage + idx % avatarColors.length];
                      return (
                        <tr key={customer._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${colorClass}`}>
                                {(customer.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{customer.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-400">#CUS-{customer._id?.slice(-4).toUpperCase() || '0000'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-gray-600">{customer.email ? customer.email.slice(0, 3) + '***@' + customer.email.split('@')[1] : 'N/A'}</td>
                          <td className="py-3 text-gray-600">{customer.phone ? customer.phone.slice(0, 3) + '****' + customer.phone.slice(-2) : 'N/A'}</td>
                          <td className="py-3 text-gray-600">{orderCount}</td>
                          <td className="py-3 font-semibold text-gray-900">₹{totalSpent.toLocaleString('en-IN')}</td>
                          <td className="py-3 text-gray-500 text-xs">{formatDate(customer.createdAt)}</td>
                          <td className="py-3 text-center">
                            <div className="relative inline-block" ref={openAction === customer._id ? actionRef : undefined}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpenAction(openAction === customer._id ? null : customer._id)}>
                                <MoreVertical size={16} className="text-gray-400" />
                              </Button>
                              {openAction === customer._id && (
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setViewCustomer(customer); setOpenAction(null); }}>
                                    <Eye size={14} className="text-gray-400" /> View Details
                                  </button>
                                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <Trash2 size={14} /> Delete Customer
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} customers
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                    <ChevronLeft size={16} />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <Button
                        key={p}
                        variant={page === p ? 'default' : 'outline'}
                        size="icon"
                        className={`h-8 w-8 ${page === p ? 'bg-blue-600 text-white' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {/* View Details Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewCustomer(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Customer Details</h2>
              <button onClick={() => setViewCustomer(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold ${avatarColors[0]}`}>
                  {(viewCustomer.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{viewCustomer.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">#CUS-{viewCustomer._id?.slice(-4).toUpperCase() || '0000'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                  <p className="text-sm text-gray-900">{viewCustomer.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
                  <p className="text-sm text-gray-900">{viewCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Orders</p>
                  <p className="text-sm text-gray-900">{getOrdersForUser(viewCustomer._id).length}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Total Spent</p>
                  <p className="text-sm text-gray-900 font-semibold">₹{getTotalSpent(viewCustomer._id).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Joined On</p>
                  <p className="text-sm text-gray-900">{formatDate(viewCustomer.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                  <Badge variant="outline" className={viewCustomer.isActive !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
                    {viewCustomer.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setViewCustomer(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
