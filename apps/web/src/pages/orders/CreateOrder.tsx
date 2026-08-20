import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, CreditCard, Package, Check, Loader2, AlertCircle, Trash2, Plus, Minus, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI', icon: '💳' },
  { value: 'CARD', label: 'Card', icon: '💳' },
  { value: 'NET_BANKING', label: 'Net Banking', icon: '🏦' },
  { value: 'WALLET', label: 'Wallet', icon: '👛' },
];

interface CartItemDisplay { productId: string; name: string; price: number; quantity: number; stock: number; imageUrl?: string; }

declare global { interface Window { Razorpay: any; } }

export default function CreateOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromCart = searchParams.get('from') === 'cart';
  const [items, setItems] = useState<CartItemDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [step, setStep] = useState<'review' | 'paying' | 'done'>('review');
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  useEffect(() => { if (fromCart) fetchCartItems(); else setLoading(false); }, []);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart');
      const cart = res.data.data;
      if (!cart?.items?.length) { setItems([]); return; }
      const productIds = cart.items.map((i: any) => i.productId);
      const results = await Promise.allSettled(productIds.map((id: string) => api.get(`/products/${id}`).then((r) => r.data.data)));
      const detailed: CartItemDisplay[] = cart.items.map((item: any, i: number) => {
        const result = results[i];
        if (result.status !== 'fulfilled' || !result.value) return null;
        const p = result.value;
        return { productId: item.productId, name: p.name, price: p.price, quantity: item.quantity, stock: p.stock, imageUrl: p.imageUrl };
      }).filter(Boolean);
      setItems(detailed);
    } catch { setError('Failed to load cart'); }
    finally { setLoading(false); }
  };

  const updateQty = async (productId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingItem(productId);
    try { await api.patch(`/cart/${productId}`, { quantity: newQty }); setItems(prev => prev.map(item => item.productId === productId ? { ...item, quantity: newQty } : item)); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setUpdatingItem(null); }
  };

  const removeItem = async (productId: string) => {
    setUpdatingItem(productId);
    try { await api.delete(`/cart/${productId}`); setItems(prev => prev.filter(item => item.productId !== productId)); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to remove'); }
    finally { setUpdatingItem(null); }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const loadRazorpayScript = (): Promise<boolean> => new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) { resolve(true); return; }
    const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script);
  });

  const openRazorpayCheckout = (order: any, payment: any) => new Promise<{ success: boolean; paymentId?: string; orderId?: string; signature?: string }>((resolve) => {
    const rzp = new window.Razorpay({
      key: 'rzp_test_TPCbChnmJr1ksi', amount: payment.amount * 100, currency: payment.currency || 'INR',
      name: 'ShopMicro', description: `Order #${order._id.slice(-8).toUpperCase()}`, order_id: payment.razorpayOrderId,
      handler: (response: any) => resolve({ success: true, paymentId: response.razorpay_payment_id, orderId: response.razorpay_order_id, signature: response.razorpay_signature }),
      prefill: { name: '', email: '', contact: '' }, theme: { color: 'hsl(240 5.9% 10%)' },
      modal: { ondismiss: () => resolve({ success: false }) },
    });
    rzp.open();
  });

  const pollForPayment = async (orderId: string, maxAttempts = 10): Promise<any> => {
    for (let i = 0; i < maxAttempts; i++) {
      try { const res = await api.get(`/payments/order/${orderId}`); if (res.data.data?.razorpayOrderId) return res.data.data; } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    return null;
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setError(''); setSubmitting(true); setStep('paying');
    try {
      if (!(await loadRazorpayScript())) { setError('Failed to load payment gateway'); setStep('review'); return; }
      const createdOrders: any[] = [];
      for (const item of items) {
        try { const res = await api.post('/orders', { productId: item.productId, quantity: item.quantity, paymentMethod }); createdOrders.push(res.data.data); }
        catch (err: any) { setError(`Failed to create order for ${item.name}: ${err.response?.data?.message}`); setStep('review'); return; }
      }
      if (createdOrders.length === 1) {
        const order = createdOrders[0]; const payment = await pollForPayment(order._id);
        if (!payment?.razorpayOrderId) { navigate('/orders'); return; }
        const result = await openRazorpayCheckout(order, payment);
        if (result.success) await api.post('/payments/verify', { razorpayOrderId: result.orderId, razorpayPaymentId: result.paymentId, razorpaySignature: result.signature });
        navigate('/orders');
      } else {
        for (const order of createdOrders) {
          const payment = await pollForPayment(order._id);
          if (payment?.razorpayOrderId) {
            const result = await openRazorpayCheckout(order, payment);
            if (result.success) await api.post('/payments/verify', { razorpayOrderId: result.orderId, razorpayPaymentId: result.paymentId, razorpaySignature: result.signature });
            break;
          }
        }
        navigate('/orders');
      }
    } catch (err: any) { setError(err.response?.data?.message || 'Something went wrong'); setStep('review'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="max-w-2xl mx-auto space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full rounded-xl" /></div>;

  if (step === 'paying') return (
    <div className="max-w-lg mx-auto py-20 text-center space-y-4">
      <Loader2 size={40} className="animate-spin mx-auto text-muted-foreground" />
      <p className="text-lg font-semibold">Processing your order...</p>
      <p className="text-sm text-muted-foreground">Creating orders and opening payment gateway</p>
    </div>
  );

  if (!fromCart || items.length === 0) return (
    <div className="max-w-lg mx-auto py-20 text-center space-y-4">
      <ShoppingCart size={40} className="mx-auto text-muted-foreground/30" />
      <p className="text-muted-foreground font-medium">{fromCart ? 'Your cart is empty' : 'Add products to your cart first'}</p>
      <Button onClick={() => navigate('/products')}>Browse Products</Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Package size={16} /> Back</button>
      <div><h1 className="text-2xl font-bold tracking-tight">Place Order</h1><p className="text-sm text-muted-foreground mt-0.5">Review your items and complete payment</p></div>

      {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20 flex items-start gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5" /><p>{error}</p></div>}

      <Card>
        <CardHeader><CardTitle className="text-base">Order Items ({totalItems})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.productId} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package size={18} className="text-muted-foreground/30" />}
                </div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.name}</p><p className="text-xs text-muted-foreground">₹{item.price.toLocaleString()} each</p></div>
                <div className="flex items-center border border-border rounded-md">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-r-none" onClick={() => updateQty(item.productId, item.quantity - 1)} disabled={updatingItem === item.productId || item.quantity <= 1}><Minus size={12} /></Button>
                  <span className="w-8 text-center text-xs font-medium border-x border-border h-7 flex items-center justify-center">{updatingItem === item.productId ? '...' : item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-l-none" onClick={() => updateQty(item.productId, item.quantity + 1)} disabled={updatingItem === item.productId || item.quantity >= item.stock}><Plus size={12} /></Button>
                </div>
                <span className="text-sm font-semibold w-16 text-right">₹{(item.price * item.quantity).toLocaleString()}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.productId)} disabled={updatingItem === item.productId}><Trash2 size={14} /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Payment Method</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <Button key={m.value} variant={paymentMethod === m.value ? 'default' : 'outline'} className="justify-start gap-2" onClick={() => setPaymentMethod(m.value)}>
                <span>{m.icon}</span> {m.label}
                {paymentMethod === m.value && <Check size={14} className="ml-auto" />}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Items ({totalItems})</span><span>₹{totalAmount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-emerald-600 font-medium">Free</span></div>
            <Separator />
            <div className="flex justify-between"><span className="font-semibold">Total</span><span className="text-xl font-bold">₹{totalAmount.toLocaleString()}</span></div>
          </div>
          <Button className="w-full h-11" onClick={handleSubmit} disabled={submitting || items.length === 0}>
            <CreditCard size={16} />
            {submitting ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString()} via ${PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}`}
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Shield size={12} /><span>Secured by Razorpay</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
