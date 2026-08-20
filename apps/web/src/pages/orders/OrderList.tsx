import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ChevronLeft, ChevronRight, Box } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'destructive' | 'warning' | 'secondary' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  CONFIRMED: { label: 'Paid', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

function getDisplayStatus(order: any, paymentMap: Map<string, any>): string {
  const payment = paymentMap.get(order._id);
  if (payment?.status === 'SUCCESS') return 'CONFIRMED';
  if (payment?.status === 'FAILED') return 'CANCELLED';
  return order.status || 'PENDING';
}

export default function OrderList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [paymentMap, setPaymentMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: any = { page, limit: 10 };
    if (statusFilter) params.status = statusFilter;

    api.get('/orders', { params }).then(async (r) => {
      const orderList = r.data.data || [];
      setOrders(orderList);
      setTotalPages(r.data.pagination?.totalPages || 1);
      setTotalCount(r.data.pagination?.totalOrders || 0);

      const paymentResults = await Promise.allSettled(
        orderList.map((o: any) => api.get(`/payments/order/${o._id}`).then((r) => ({ orderId: o._id, payment: r.data.data })))
      );
      const map = new Map<string, any>();
      paymentResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.payment) map.set(result.value.orderId, result.value.payment);
      });
      setPaymentMap(map);
    }).finally(() => setLoading(false));
  }, [page, statusFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-72" />
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalCount} order{totalCount !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/orders/new?from=cart">
          <Button size="sm">New Order</Button>
        </Link>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="CONFIRMED">Paid</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Package size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">{statusFilter ? 'No orders with this status' : 'No orders yet'}</p>
            <Link to="/products" className="text-sm text-foreground font-medium hover:underline mt-1 inline-block">Browse Products →</Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {[...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((o) => {
                  const ds = getDisplayStatus(o, paymentMap);
                  const conf = STATUS_MAP[ds] || STATUS_MAP.PENDING;
                  return (
                    <Link key={o._id} to={`/orders/${o._id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                          <Box size={16} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Order #{o._id.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">₹{o.totalAmount?.toLocaleString()}</p>
                        <Badge variant={conf.variant} className="mt-1">{conf.label}</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                <ChevronLeft size={16} />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <Button key={p} variant={page === p ? 'default' : 'outline'} size="icon" className="h-9 w-9" onClick={() => setPage(p)}>
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
