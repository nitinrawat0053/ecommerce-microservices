import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Eye } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  SUCCESS: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-blue-50 text-blue-700',
};

export default function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    api.get(`/payments/user/${user._id}`).then((r) => setPayments(r.data.data || [])).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payment History</h1>
      {payments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <CreditCard size={48} className="mx-auto mb-4 text-text-light opacity-40" />
          <p className="text-text-muted">No payments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p._id} className="bg-white rounded-xl border border-border p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <CreditCard size={18} className="text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Payment #{p._id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-text-muted">Order: {p.orderId?.slice?.(-8)?.toUpperCase() || p.orderId} · {p.method}</p>
                  <p className="text-xs text-text-muted">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">₹{p.amount?.toLocaleString()}</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[p.status] || 'bg-gray-50 text-gray-600'}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
