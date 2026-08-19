import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Package, ShoppingCart, CreditCard, TrendingUp, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, payments: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
      api.get('/orders?limit=1').catch(() => ({ data: { pagination: { total: 0 } } })),
      api.get(`/payments/user/${user?._id}`).catch(() => ({ data: { data: [] } })),
    ]).then(([p, o, pay]) => {
      setStats({
        products: p.data.pagination?.total || 0,
        orders: o.data.pagination?.total || 0,
        payments: pay.data.data?.length || 0,
      });
    });
  }, []);

  const cards = [
    { label: 'Products', value: stats.products, icon: Package, to: '/products', color: 'bg-blue-50 text-blue-600' },
    { label: 'My Orders', value: stats.orders, icon: TrendingUp, to: '/orders', color: 'bg-green-50 text-green-600' },
    { label: 'Payments', value: stats.payments, icon: CreditCard, to: '/payments', color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-text-muted text-sm mt-1">Here's what's happening with your account</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {cards.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to} className="bg-white rounded-xl border border-border p-6 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}><Icon size={22} /></div>
              <ArrowRight size={16} className="text-text-light group-hover:text-primary transition-colors" />
            </div>
            <p className="text-3xl font-bold mt-4">{value}</p>
            <p className="text-sm text-text-muted mt-1">{label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border p-8">
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Browse Products', to: '/products', icon: '🛍️' },
            { label: 'View Cart', to: '/cart', icon: '🛒' },
            { label: 'My Orders', to: '/orders', icon: '📦' },
            { label: 'Payment History', to: '/payments', icon: '💳' },
          ].map(({ label, to, icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 p-4 border border-border rounded-xl hover:bg-surface-alt transition-colors text-sm font-medium">
              <span className="text-xl">{icon}</span> {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
