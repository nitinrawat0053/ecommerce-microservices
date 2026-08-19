import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PaymentVerify() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ razorpayOrderId: '', razorpayPaymentId: '', razorpaySignature: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/payments/verify', form);
      setSuccess('Payment verified successfully!');
      setTimeout(() => navigate('/payments'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-muted hover:text-text"><ArrowLeft size={16} /> Back</button>
      <h1 className="text-2xl font-bold">Verify Payment</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-8 space-y-5">
        {error && <div className="p-3 bg-red-50 text-danger text-sm rounded-lg">{error}</div>}
        {success && <div className="p-3 bg-green-50 text-success text-sm rounded-lg">{success}</div>}
        <div>
          <label className="block text-sm font-medium mb-1.5">Razorpay Order ID</label>
          <input required value={form.razorpayOrderId} onChange={update('razorpayOrderId')} placeholder="order_ABC123" className="w-full px-4 py-2.5 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Razorpay Payment ID</label>
          <input required value={form.razorpayPaymentId} onChange={update('razorpayPaymentId')} placeholder="pay_XYZ789" className="w-full px-4 py-2.5 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Signature</label>
          <input required value={form.razorpaySignature} onChange={update('razorpaySignature')} placeholder="HMAC SHA256 signature" className="w-full px-4 py-2.5 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          <ShieldCheck size={16} /> {loading ? 'Verifying...' : 'Verify Payment'}
        </button>
      </form>
    </div>
  );
}
