import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, RefreshCw, Clock, CheckCircle2, XCircle, ArrowLeftRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_CONFIG: Record<string, { variant: 'default' | 'success' | 'destructive' | 'secondary' | 'warning'; label: string }> = {
  PENDING: { variant: 'warning', label: 'Pending' },
  SUCCESS: { variant: 'success', label: 'Success' },
  FAILED: { variant: 'destructive', label: 'Failed' },
  REFUNDED: { variant: 'secondary', label: 'Refunded' },
};

export default function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayments = useCallback(async (isRefresh = false) => {
    if (!user?._id) return;
    if (isRefresh) setRefreshing(true);
    try { const r = await api.get(`/payments/user/${user._id}`); setPayments(r.data.data || []); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    const interval = setInterval(() => { if (payments.some((p) => p.status === 'PENDING')) fetchPayments(true); }, 10000);
    return () => clearInterval(interval);
  }, [payments, fetchPayments]);

  const sortedPayments = [...payments]
    .filter((p) => !statusFilter || p.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchPayments(true)} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {payments.length > 0 && (
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="">All ({payments.length})</TabsTrigger>
            {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
              <TabsTrigger key={key} value={key}>
                {conf.label} ({payments.filter(p => p.status === key).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {sortedPayments.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <CreditCard size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">{statusFilter ? 'No payments with this status' : 'No payments yet'}</p>
            <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Payments will appear here after you place an order</p>
            <Link to="/products"><Button>Browse Products</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {sortedPayments.map((p) => {
                const conf = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                return (
                  <div key={p._id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                      {p.status === 'SUCCESS' ? <CheckCircle2 size={18} className="text-emerald-500" /> :
                       p.status === 'FAILED' ? <XCircle size={18} className="text-destructive" /> :
                       p.status === 'REFUNDED' ? <ArrowLeftRight size={18} className="text-muted-foreground" /> :
                       <Clock size={18} className="text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Payment #{p._id.slice(-8).toUpperCase()}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Link to={`/orders/${p.orderId}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          Order: {p.orderId?.slice?.(-8)?.toUpperCase() || p.orderId}
                        </Link>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="text-xs text-muted-foreground">{p.method || p.paymentMethod}</span>
                      </div>
                      {p.razorpayPaymentId && <p className="text-[11px] text-muted-foreground/60 font-mono mt-0.5">RP: {p.razorpayPaymentId}</p>}
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">₹{p.amount?.toLocaleString()}</p>
                      <Badge variant={conf.variant} className="mt-1">{conf.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
