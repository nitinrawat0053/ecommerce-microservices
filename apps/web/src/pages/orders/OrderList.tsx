import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { Package, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  SHIPPED: 'bg-purple-50 text-purple-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

export default function OrderList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: any = { page, limit: 10 };
    if (statusFilter) params.status = statusFilter;
    api.get('/orders', { params }).then((r) => { setOrders(r.data.data); setTotalPages(r.data.pagination?.totalPages || 1); }).finally(() => setLoading(false));
  }, [page, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link to="/orders/new" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">New Order</Link>
      </div>
      <div className="flex gap-2">
        {['', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:bg-surface-alt'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <Package size={48} className="mx-auto mb-4 text-text-light opacity-40" />
          <p className="text-text-muted">No orders found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((o) => (
              <Link key={o._id} to={`/orders/${o._id}`} className="block bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Order #{o._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-text-muted mt-1">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">₹{o.totalAmount?.toLocaleString()}</p>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-50 text-gray-600'}`}>{o.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 border border-border rounded-lg hover:bg-surface-alt disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 border border-border rounded-lg hover:bg-surface-alt disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
