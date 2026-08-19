import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

interface CartItem { productId: string; name: string; price: number; quantity: number; imageUrl?: string; }

export default function CartView() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setItems(res.data.data?.items || []);
      setTotalPrice(res.data.data?.totalPrice || 0);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (productId: string, quantity: number) => {
    try {
      const res = await api.patch(`/cart/${productId}`, { quantity });
      setItems(res.data.data.items);
      setTotalPrice(res.data.data.totalPrice);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const remove = async (productId: string) => {
    try {
      const res = await api.delete(`/cart/${productId}`);
      setItems(res.data.data.items);
      setTotalPrice(res.data.data.totalPrice);
    } catch { }
  };

  const clearCart = async () => {
    if (!confirm('Clear entire cart?')) return;
    try {
      const res = await api.delete('/cart');
      setItems(res.data.data.items);
      setTotalPrice(res.data.data.totalPrice);
    } catch { }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        {items.length > 0 && <button onClick={clearCart} className="text-sm text-danger hover:text-danger-hover">Clear cart</button>}
      </div>
      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border">
          <ShoppingCart size={48} className="mx-auto mb-4 text-text-light opacity-40" />
          <p className="text-text-muted mb-4">Your cart is empty</p>
          <button onClick={() => navigate('/products')} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover">Browse Products</button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-surface-alt rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package size={24} className="text-text-light" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.name}</p>
                  <p className="text-sm text-text-muted">₹{item.price.toLocaleString()} each</p>
                </div>
                <div className="flex items-center border border-border rounded-lg">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="p-1.5 hover:bg-surface-alt rounded-l-lg"><Minus size={14} /></button>
                  <span className="px-3 py-1 text-sm font-medium border-x border-border">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="p-1.5 hover:bg-surface-alt rounded-r-lg"><Plus size={14} /></button>
                </div>
                <span className="text-sm font-bold w-20 text-right">₹{(item.price * item.quantity).toLocaleString()}</span>
                <button onClick={() => remove(item.productId)} className="p-2 text-text-light hover:text-danger transition-colors"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-border p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Total ({items.reduce((a, i) => a + i.quantity, 0)} items)</p>
              <p className="text-2xl font-bold">₹{totalPrice.toLocaleString()}</p>
            </div>
            <button onClick={() => navigate('/orders/new')} className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover flex items-center gap-2">
              Proceed to Order <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
