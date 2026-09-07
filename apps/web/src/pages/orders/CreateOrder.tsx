import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '@/api/client';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShoppingCart, CreditCard, Package, Check, Loader2, AlertCircle, Trash2, Plus, Minus, Shield, ShieldCheck, RotateCw, LogIn } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI', icon: '💳' },
  { value: 'CARD', label: 'Card', icon: '💳' },
  { value: 'NET_BANKING', label: 'Net Banking', icon: '🏦' },
  { value: 'WALLET', label: 'Wallet', icon: '👛' },
];

// Surface the REAL backend error. The gateway returns JSON { message } for
// its own errors now, but a timeout can still reach the client as an HTML
// body (or no response body at all), so `err.response.data.message` alone
// rendered as "undefined". Walk the response to find a truthful message and
// NEVER render "undefined".
function getApiErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { response?: { data?: unknown; statusText?: string }; code?: string; message?: string } | undefined;
  const data = anyErr?.response?.data;
  if (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
    return (data as { message: string }).message;
  }
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (anyErr?.response?.statusText) return anyErr.response.statusText;
  if (anyErr?.message) return anyErr.message;
  return fallback;
}

declare global { interface Window { Razorpay: any; } }

export default function CreateOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromCart = searchParams.get('from') === 'cart';

  const { lines: cartItems, loading, updateQty, removeItem, clear, mergeGuestCart } = useCart();
  const { user, token, login, verifyPhone, resendOtp, updateUser } = useAuth();

  // Guest + logged-in compatible: `items` reflects the current cart source.
  const items = fromCart ? cartItems : [];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [step, setStep] = useState<'review' | 'paying' | 'done'>('review');
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  // ── Payment gate (login + OTP) state ──
  const [showGate, setShowGate] = useState(false);
  const [gateStep, setGateStep] = useState<'login' | 'otp'>('login');
  const [gateEmail, setGateEmail] = useState('');
  const [gatePassword, setGatePassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [gateError, setGateError] = useState('');
  const [gateInfo, setGateInfo] = useState('');
  const [gateLoading, setGateLoading] = useState(false);

  const handleQty = async (productId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingItem(productId);
    try {
      await updateQty(productId, newQty);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemove = async (productId: string) => {
    setUpdatingItem(productId);
    try {
      await removeItem(productId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    } finally {
      setUpdatingItem(null);
    }
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

  // Actual order + payment execution. Only ever called after the user has been
  // authenticated AND phone-verified (the payment gate enforces this UX-wise,
  // and order-service + payment-service enforce it server-side).
  const proceedToPayment = async () => {
    if (items.length === 0) return;
    const itemsToOrder = items;
    setError(''); setSubmitting(true); setStep('paying');
    try {
      if (!(await loadRazorpayScript())) { setError('Failed to load payment gateway'); setStep('review'); return; }
      const createdOrders: any[] = [];
      for (const item of itemsToOrder) {
        try { const res = await api.post('/orders', { productId: item.productId, quantity: item.quantity, paymentMethod }); createdOrders.push(res.data.data); }
        catch (err) { setError(`Failed to create order for ${item.name}: ${getApiErrorMessage(err, 'Order service did not respond in time')}`); setStep('review'); return; }
      }
      if (createdOrders.length === 1) {
        const order = createdOrders[0]; const payment = await pollForPayment(order._id);
        if (!payment?.razorpayOrderId) { navigate('/orders'); return; }
        const result = await openRazorpayCheckout(order, payment);
        // Clear the cart ONLY after the system confirms the payment succeeded.
        // On dismissal/failure result.success is false, so the cart is kept.
        if (result.success) {
          await api.post('/payments/verify', { razorpayOrderId: result.orderId, razorpayPaymentId: result.paymentId, razorpaySignature: result.signature });
          await clear();
        }
        navigate('/orders');
      } else {
        for (const order of createdOrders) {
          const payment = await pollForPayment(order._id);
          if (payment?.razorpayOrderId) {
            const result = await openRazorpayCheckout(order, payment);
            if (result.success) {
              await api.post('/payments/verify', { razorpayOrderId: result.orderId, razorpayPaymentId: result.paymentId, razorpaySignature: result.signature });
              await clear();
              break;
            }
          }
        }
        navigate('/orders');
      }
    } catch (err) { setError(getApiErrorMessage(err, 'Something went wrong')); setStep('review'); }
    finally { setSubmitting(false); }
  };

  // ── Payment gate handlers ──
  const startOtpFlow = async (phone: string) => {
    setGateStep('otp'); setGateError(''); setGateInfo(''); setShowGate(true);
    try {
      await resendOtp(phone);
      setGateInfo(`OTP sent to ${phone}`);
    } catch (err: any) {
      setGateError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handlePayClick = async () => {
    if (items.length === 0) return;
    if (!token) {
      // Not logged in -> require login before letting them pay.
      setGateStep('login'); setGateError(''); setGateInfo(''); setShowGate(true);
      return;
    }
    if (!user?.isVerified) {
      // Logged in but phone not verified -> require OTP verification.
      const phone = user?.phone;
      if (!phone) return;
      await startOtpFlow(phone);
      return;
    }
    // Authenticated + verified -> straight to payment.
    await proceedToPayment();
  };

  const handleGateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateLoading(true); setGateError('');
    try {
      const u = await login(gateEmail, gatePassword);
      if (!u.isVerified) {
        await startOtpFlow(u.phone);
      } else {
        // Already verified -> close gate, sync guest cart, proceed.
        setShowGate(false);
        await mergeGuestCart();
        await proceedToPayment();
      }
    } catch (err: any) {
      setGateError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setGateLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!user) return;
    setGateLoading(true); setGateError(''); setGateInfo('');
    try {
      await resendOtp(user.phone);
      setGateInfo(`OTP sent to ${user.phone}`);
    } catch (err: any) {
      setGateError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setGateLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setGateLoading(true); setGateError('');
    try {
      await verifyPhone(user.phone, otpCode);
      updateUser({ isVerified: true });
      toast.success('Phone verified successfully!');
      setShowGate(false);
      await mergeGuestCart();
      await proceedToPayment();
    } catch (err: any) {
      setGateError(err.response?.data?.message || 'Verification failed');
    } finally {
      setGateLoading(false);
    }
  };

  if (loading && fromCart) return <div className="max-w-2xl mx-auto space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full rounded-xl" /></div>;

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

  const showGateHint = !token || !user?.isVerified;

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
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-r-none" onClick={() => handleQty(item.productId, item.quantity - 1)} disabled={updatingItem === item.productId || item.quantity <= 1}><Minus size={12} /></Button>
                  <span className="w-8 text-center text-xs font-medium border-x border-border h-7 flex items-center justify-center">{updatingItem === item.productId ? '...' : item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-l-none" onClick={() => handleQty(item.productId, item.quantity + 1)} disabled={updatingItem === item.productId || item.quantity >= item.stock}><Plus size={12} /></Button>
                </div>
                <span className="text-sm font-semibold w-16 text-right">₹{(item.price * item.quantity).toLocaleString()}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(item.productId)} disabled={updatingItem === item.productId}><Trash2 size={14} /></Button>
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

          {showGateHint && (
            <div className="flex items-start gap-2 p-3 text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-500/20">
              <ShieldCheck size={14} className="shrink-0 mt-0.5" />
              <p>{!token ? 'Login required to complete payment. Your cart is saved.' : 'Verify your phone to complete payment.'}</p>
            </div>
          )}

          <Button className="w-full h-11" onClick={handlePayClick} disabled={submitting || items.length === 0}>
            <CreditCard size={16} />
            {submitting ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString()} via ${PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}`}
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Shield size={12} /><span>Secured by Razorpay</span></div>
        </CardContent>
      </Card>

      {/* ═══ LOGIN / OTP PAYMENT GATE ═══ */}
      <Dialog open={showGate} onOpenChange={setShowGate}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {gateStep === 'login' ? 'Login to pay' : 'Verify your phone'}
            </DialogTitle>
            <DialogDescription>
              {gateStep === 'login'
                ? 'You need to log in and verify your phone before proceeding with payment. Your cart is preserved.'
                : `Enter the OTP sent to ${user?.phone || 'your phone'}.`}
            </DialogDescription>
          </DialogHeader>

          {gateError && <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">{gateError}</div>}
          {gateInfo && <div className="p-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">{gateInfo}</div>}

          {gateStep === 'login' ? (
            <form onSubmit={handleGateLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gate-email">Email</Label>
                <Input id="gate-email" type="email" required placeholder="name@example.com" value={gateEmail} onChange={(e) => setGateEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gate-password">Password</Label>
                <Input id="gate-password" type="password" required placeholder="Enter your password" value={gatePassword} onChange={(e) => setGatePassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={gateLoading}>
                {gateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn size={15} /> Login &amp; Continue</>}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-foreground hover:underline" onClick={() => setShowGate(false)}>
                  Create one
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gate-otp">OTP Code</Label>
                <Input id="gate-otp" required maxLength={6} pattern="\d{6}" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="000000" className="text-center text-2xl tracking-[0.5em] font-mono h-12" />
              </div>
              <Button type="submit" className="w-full" disabled={gateLoading}>
                {gateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck size={15} /> Verify &amp; Pay</>}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={handleResendOtp} disabled={gateLoading}>
                <RotateCw size={14} className="mr-2" /> Resend OTP
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}