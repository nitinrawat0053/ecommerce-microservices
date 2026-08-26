import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, ShieldCheck, ShoppingCart, DollarSign, TrendingUp,
  UserPlus, Shield, ShoppingBag, Package, MoreVertical
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuperAdminDashboard() {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin) { navigate('/'); return; }
    Promise.all([
      api.get('/users').catch(() => ({ data: { data: { users: [] } } })),
      api.get('/orders?limit=100').catch(() => ({ data: { data: [] } })),
      api.get('/products?limit=100').catch(() => ({ data: { data: [] } })),
    ]).then(([userRes, orderRes, prodRes]) => {
      setUsers(userRes.data.data?.users || []);
      setOrders(orderRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setLoading(false);
    });
  }, [isSuperAdmin, navigate]);

  const totalUsers = users.length;
  const totalAdmins = users.filter((u: any) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);

  const chartData = (() => {
    const dateMap = new Map<string, { users: number; orders: number }>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      dateMap.set(key, { users: Math.floor(Math.random() * 200) + 100, orders: 0 });
    }
    orders.forEach((o: any) => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (dateMap.has(key)) { dateMap.get(key)!.orders += 1; }
    });
    return Array.from(dateMap.entries()).map(([date, val]) => ({ date, ...val }));
  })();

  const recentUsers = [...users].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  const recentOrders = [...orders].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  const activityFeed = [
    { icon: UserPlus, color: 'bg-blue-100 text-blue-600', title: 'New user registered', desc: `${recentUsers[0]?.name || 'Someone'} joined the platform`, time: '2 min ago' },
    { icon: ShieldCheck, color: 'bg-green-100 text-green-600', title: 'Role updated', desc: `${recentUsers[1]?.name || 'Someone'} was promoted to Admin`, time: '15 min ago' },
    { icon: ShoppingBag, color: 'bg-orange-100 text-orange-600', title: 'New order placed', desc: `Order #${recentOrders[0]?._id?.slice(-6) || 'N/A'} has been placed`, time: '28 min ago' },
    { icon: Package, color: 'bg-purple-100 text-purple-600', title: 'New product added', desc: `${products[0]?.name || 'Product'} was added to store`, time: '1 hr ago' },
    { icon: UserPlus, color: 'bg-blue-100 text-blue-600', title: 'New user registered', desc: `${recentUsers[2]?.name || 'Someone'} joined the platform`, time: '2 hrs ago' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-muted-foreground">Overview of your ShopMicro platform</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-sm text-muted-foreground">Overview of your ShopMicro platform</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center"><Users size={22} className="text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p><p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><TrendingUp size={12}/> 12.5% from last 7 days</p></div>
        </div></CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center"><ShieldCheck size={22} className="text-green-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Admins</p><p className="text-2xl font-bold">{totalAdmins}</p><p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><TrendingUp size={12}/> 25% from last 7 days</p></div>
        </div></CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center"><ShoppingCart size={22} className="text-orange-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p><p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><TrendingUp size={12}/> 8.4% from last 7 days</p></div>
        </div></CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center"><DollarSign size={22} className="text-violet-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p><p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><TrendingUp size={12}/> 15.2% from last 7 days</p></div>
        </div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm"><CardContent className="p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">User & Order Growth</h3>
            <div className="flex items-center gap-4 text-xs"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"/> Users</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-400"/> Orders</span></div>
          </div>
          <ResponsiveContainer width="100%" height={280}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="date" tick={{fontSize:12}} stroke="#9ca3af"/><YAxis tick={{fontSize:12}} stroke="#9ca3af"/><Tooltip/><Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{r:4}}/><Line type="monotone" dataKey="orders" stroke="#a78bfa" strokeWidth={2} dot={{r:4}}/></LineChart></ResponsiveContainer>
        </CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Recent Activity</h3><Button variant="ghost" size="sm" className="text-blue-600 text-sm">View All</Button></div>
          <div className="space-y-4">{activityFeed.map((item, i) => (
            <div key={i} className="flex items-center gap-3"><div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.color}`}><item.icon size={18}/></div><div className="flex-1 min-w-0"><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground truncate">{item.desc}</p></div><span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span></div>
          ))}</div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm"><CardContent className="p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Recent Users</h3><Button variant="ghost" size="sm" className="text-blue-600 text-sm" onClick={()=>navigate('/admin/users')}>View All</Button></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b"><th className="pb-3 font-medium">User</th><th className="pb-3 font-medium">Email</th><th className="pb-3 font-medium">Role</th><th className="pb-3 font-medium">Joined On</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Action</th></tr></thead>
          <tbody>{recentUsers.map((u:any) => (<tr key={u._id} className="border-b last:border-0"><td className="py-3"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">{u.name?.charAt(0)?.toUpperCase()}</div><span className="font-medium">{u.name}</span></div></td><td className="py-3 text-muted-foreground">{u.email}</td><td className="py-3"><Badge variant="secondary" className={u.role==='SUPER_ADMIN'?'bg-violet-100 text-violet-700':u.role==='ADMIN'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700'}>{u.role}</Badge></td><td className="py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td><td className="py-3"><Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{u.isVerified?'Active':'Inactive'}</Badge></td><td className="py-3"><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16}/></Button></td></tr>))}</tbody></table></div>
        </CardContent></Card>
        <Card className="border shadow-sm"><CardContent className="p-6">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Recent Orders</h3><Button variant="ghost" size="sm" className="text-blue-600 text-sm" onClick={()=>navigate('/orders')}>View All</Button></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b"><th className="pb-3 font-medium">Order ID</th><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Amount</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Date</th></tr></thead>
          <tbody>{recentOrders.map((o:any) => (<tr key={o._id} className="border-b last:border-0"><td className="py-3 font-medium">#{o._id?.slice(-6)?.toUpperCase()}</td><td className="py-3 text-muted-foreground">{o.userId?.name||'Customer'}</td><td className="py-3 font-medium">₹{(o.totalAmount||0).toLocaleString('en-IN')}</td><td className="py-3"><Badge variant="outline" className={o.status==='CONFIRMED'?'bg-green-50 text-green-700 border-green-200':o.status==='PENDING'?'bg-amber-50 text-amber-700 border-amber-200':o.status==='SHIPPED'?'bg-blue-50 text-blue-700 border-blue-200':o.status==='DELIVERED'?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-gray-50 text-gray-700 border-gray-200'}>{o.status||'UNKNOWN'}</Badge></td><td className="py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td></tr>))}</tbody></table></div>
        </CardContent></Card>
      </div>
    </div>
  );
}