import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, CreditCard, User, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'destructive' | 'warning' }> = {
  PENDING: { label: 'Pending Payment', variant: 'warning' },
  CONFIRMED: { label: 'Paid', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/orders/${id}`).then((r) => {
        const o = r.data.data;
        setOrder(o);
        if (o.productId) {
          const pid = typeof o.productId === 'object' ? o.productId._id || o.productId : o.productId;
          api.get(`/products/${pid}`).then((r) => setProductName(r.data.data?.name || pid)).catch(() => setProductName(pid));
        }
      }),
      api.get(`/payments/order/${id}`).then((r) => setPayment(r.data.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-4 w-32" />
        <Card><CardContent className="p-8 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-20 w-full" /></CardContent></Card>
      </div>
    );
  }
  if (!order) return <div className="text-center py-20 text-muted-foreground">Order not found</div>;

  let displayStatus = order.status || 'PENDING';
  if (payment?.status === 'SUCCESS') displayStatus = 'CONFIRMED';
  else if (payment?.status === 'FAILED') displayStatus = 'CANCELLED';
  const statusConf = STATUS_MAP[displayStatus] || STATUS_MAP.PENDING;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to orders
      </button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Order #{order._id.slice(-8).toUpperCase()}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Badge variant={statusConf.variant} className="text-sm px-3 py-1">{statusConf.label}</Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center shrink-0"><Package size={18} className="text-muted-foreground" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Product</p>
                <p className="text-sm font-semibold mt-0.5">{productName || (typeof order.productId === 'object' ? order.productId?.name : '') || 'Product'}</p>
                <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center shrink-0"><CreditCard size={18} className="text-muted-foreground" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Payment</p>
                <p className="text-sm font-semibold mt-0.5">₹{order.totalAmount?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{payment?.method || payment?.paymentMethod || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center shrink-0"><User size={18} className="text-muted-foreground" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Customer</p>
                <p className="text-sm font-semibold mt-0.5">You</p>
                <p className="text-xs text-muted-foreground">Buyer</p>
              </div>
            </div>
          </div>

          {payment && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-4">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-[11px] uppercase tracking-wider font-medium">Payment ID</p><p className="font-mono text-xs mt-1">{payment.razorpayPaymentId || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground text-[11px] uppercase tracking-wider font-medium">Status</p><p className="font-semibold mt-1">{payment.status}</p></div>
                  <div><p className="text-muted-foreground text-[11px] uppercase tracking-wider font-medium">Amount</p><p className="font-semibold mt-1">₹{payment.amount?.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-[11px] uppercase tracking-wider font-medium">Method</p><p className="font-semibold mt-1">{payment.method || payment.paymentMethod || 'N/A'}</p></div>
                  {payment.razorpayOrderId && (
                    <div className="col-span-2"><p className="text-muted-foreground text-[11px] uppercase tracking-wider font-medium">Razorpay Order ID</p><p className="font-mono text-xs mt-1">{payment.razorpayOrderId}</p></div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
