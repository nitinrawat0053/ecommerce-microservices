import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { ShoppingCart, ArrowLeft, CreditCard } from 'lucide-react';

const PAYMENT_METHODS = ['UPI', 'CARD', 'NET_BANKING', 'WALLET'];

export default function CreateOrder() {
  const navigate = useNavigate();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/orders', { productId, quantity, paymentMethod });
      navigate('/orders');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-muted hover:text-text"><ArrowLeft size={16} /> Back</button>
      <h1 className="text-2xl font-bold">Place Order</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-8 space-y-5">
        {error && <div className="p-3 bg-red-50 text-danger text-sm rounded-lg">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1.5">Product ID</label>
          <input required value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Enter product ID" className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <p className="text-xs text-text-muted mt-1">Copy the product ID from the Products page</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Quantity</label>
          <input type="number" required min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`flex items-center gap-2 p-3 border rounded-xl text-sm font-medium transition-colors ${paymentMethod === m ? 'border-primary bg-primary-light text-primary' : 'border-border hover:bg-surface-alt'}`}>
                <CreditCard size={16} /> {m.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          <ShoppingCart size={18} /> {loading ? 'Placing order...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
