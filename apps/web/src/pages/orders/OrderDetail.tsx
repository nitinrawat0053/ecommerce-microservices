import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { ArrowLeft, Package, CreditCard, MapPin } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/orders/${id}`).then((r) => setOrder(r.data.data)),
      api.get(`/payments/order/${id}`).then((r) => setPayment(r.data.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!order) return <div className="text-center py-20 text-text-muted">Order not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-muted hover:text-text"><ArrowLeft size={16} /> Back to orders</button>

      <div className="bg-white rounded-2xl border border-border p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Order #{order._id.slice(-8).toUpperCase()}</h1>
            <p className="text-sm text-text-muted mt-1">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{order.status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-t border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center"><Package size={18} className="text-primary" /></div>
            <div>
              <p className="text-xs text-text-muted uppercase font-medium">Product</p>
              <p className="text-sm font-semibold mt-0.5">{order.productId?.name || order.productId}</p>
              <p className="text-xs text-text-muted">Qty: {order.quantity}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center"><CreditCard size={18} className="text-secondary" /></div>
            <div>
              <p className="text-xs text-text-muted uppercase font-medium">Payment</p>
              <p className="text-sm font-semibold mt-0.5">₹{order.totalAmount?.toLocaleString()}</p>
              <p className="text-xs text-text-muted">{order.paymentMethod}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center"><MapPin size={18} className="text-success" /></div>
            <div>
              <p className="text-xs text-text-muted uppercase font-medium">User</p>
              <p className="text-sm font-semibold mt-0.5">{order.userId?.name || order.userId}</p>
              <p className="text-xs text-text-muted">{order.userId?.email || ''}</p>
            </div>
          </div>
        </div>

        {payment && (
          <div className="border-t border-border pt-6 mt-2">
            <h3 className="text-sm font-semibold mb-3">Payment Details</h3>
            <div className="bg-surface-alt rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-text-muted">Payment ID</p><p className="font-mono text-xs">{payment.razorpayPaymentId || 'N/A'}</p></div>
              <div><p className="text-text-muted">Status</p><p className="font-semibold">{payment.status}</p></div>
              <div><p className="text-text-muted">Amount</p><p className="font-semibold">₹{payment.amount?.toLocaleString()}</p></div>
              <div><p className="text-text-muted">Method</p><p className="font-semibold">{payment.method}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
