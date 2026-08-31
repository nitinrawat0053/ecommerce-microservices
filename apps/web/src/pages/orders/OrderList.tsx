import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package, ChevronLeft, ChevronRight, Search, ArrowUpDown, Clock,
  CheckCircle2, XCircle, Truck, RotateCcw, CreditCard,
  ShoppingCart, ChevronRight as ChevronIcon, Filter, Calendar
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/* ═══ STATUS CONFIGS ═══ */

const ORDER_STATUSES = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
type OrderStatusFilter = typeof ORDER_STATUSES[number];

const ORDER_STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: any;
}> = {
  PENDING: { label: 'Pending', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-500/10', borderColor: 'border-amber-200 dark:border-amber-500/30', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-500/10', borderColor: 'border-blue-200 dark:border-blue-500/30', icon: CheckCircle2 },
  PROCESSING: { label: 'Processing', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-200 dark:border-purple-500/30', icon: RotateCcw },
  SHIPPED: { label: 'Shipped', color: 'text-indigo-700 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-500/10', borderColor: 'border-indigo-200 dark:border-indigo-500/30', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', borderColor: 'border-emerald-200 dark:border-emerald-500/30', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-500/10', borderColor: 'border-red-200 dark:border-red-500/30', icon: XCircle },
};

const PAYMENT_STATUSES = ['All', 'Pending', 'Paid', 'Failed', 'Refunded'] as const;
type PaymentStatusFilter = typeof PAYMENT_STATUSES[number];

const PAYMENT_STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: any;
}> = {
  SUCCESS: { label: 'Paid', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', borderColor: 'border-emerald-200 dark:border-emerald-500/30', icon: CheckCircle2 },
  PENDING: { label: 'Unpaid', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-500/10', borderColor: 'border-amber-200 dark:border-amber-500/30', icon: Clock },
  FAILED: { label: 'Failed', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-500/10', borderColor: 'border-red-200 dark:border-red-500/30', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-500/10', borderColor: 'border-purple-200 dark:border-purple-500/30', icon: RotateCcw },
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', icon: Clock },
  { value: 'oldest', label: 'Oldest First', icon: Clock },
  { value: 'amount-high', label: 'Amount: High → Low', icon: ArrowUpDown },
  { value: 'amount-low', label: 'Amount: Low → High', icon: ArrowUpDown },
] as const;

type SortOption = typeof SORT_OPTIONS[number]['value'];

/* ═══ HELPER ═══ */

function getOrderStatusKey(order: any): string {
  return order.status || 'PENDING';
}

function getPaymentStatusKey(orderId: string, paymentMap: Map<string, any>): string {
  const payment = paymentMap.get(orderId);
  return payment?.status || 'PENDING';
}

function mapOrderStatusFilterToAPI(filter: OrderStatusFilter): string {
  const map: Record<string, string> = {
    'Pending': 'PENDING',
    'Confirmed': 'CONFIRMED',
    'Processing': 'PROCESSING',
    'Shipped': 'SHIPPED',
    'Delivered': 'DELIVERED',
    'Cancelled': 'CANCELLED',
  };
  return map[filter] || '';
}

function mapPaymentStatusFilterToDisplay(filter: PaymentStatusFilter): string {
  const map: Record<string, string> = {
    'Pending': 'PENDING',
    'Paid': 'SUCCESS',
    'Failed': 'FAILED',
    'Refunded': 'REFUNDED',
  };
  return map[filter] || '';
}

function StatusBadge({ config }: { config: { label: string; color: string; bgColor: string; borderColor: string; icon: any } }) {
  const Icon = config.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border',
      config.color, config.bgColor, config.borderColor
    )}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}

/* ═══ MAIN COMPONENT ═══ */

export default function OrderList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [paymentMap, setPaymentMap] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Fetch orders
  useEffect(() => {
    setLoading(true);
    const sortMap: Record<string, { sortBy: string; sortOrder: string }> = {
      newest: { sortBy: 'createdAt', sortOrder: 'desc' },
      oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
      'amount-high': { sortBy: 'totalAmount', sortOrder: 'desc' },
      'amount-low': { sortBy: 'totalAmount', sortOrder: 'asc' },
    };
    const sort = sortMap[sortBy] || sortMap.newest;
    const params: any = { page, limit: 12, sortBy: sort.sortBy, sortOrder: sort.sortOrder };

    // Only send order status filter to API (payment status is client-side)
    const apiStatus = mapOrderStatusFilterToAPI(orderStatusFilter);
    if (apiStatus) params.status = apiStatus;

    api.get('/orders', { params }).then(async (r) => {
      const orderList = r.data.data || [];
      setTotalPages(r.data.pagination?.totalPages || 1);
      setTotalCount(r.data.pagination?.totalOrders || 0);

      // Fetch payment status for each order
      const paymentResults = await Promise.allSettled(
        orderList.map((o: any) =>
          api.get(`/payments/order/${o._id}`).then((r) => ({ orderId: o._id, payment: r.data.data }))
        )
      );
      const map = new Map<string, any>();
      paymentResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.payment) {
          map.set(result.value.orderId, result.value.payment);
        }
      });
      setPaymentMap(map);
      setOrders(orderList);
    }).catch(() => {
      setOrders([]);
    }).finally(() => setLoading(false));
  }, [page, orderStatusFilter, sortBy]);

  // Client-side payment status filtering + search filtering
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Payment status filter (client-side since API doesn't support it)
    if (paymentStatusFilter !== 'All') {
      const mappedPaymentStatus = mapPaymentStatusFilterToDisplay(paymentStatusFilter);
      result = result.filter((o) => {
        const ps = getPaymentStatusKey(o._id, paymentMap);
        return ps === mappedPaymentStatus;
      });
    }

    // Search by Order ID
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((o) => o._id.toLowerCase().includes(q));
    }

    return result;
  }, [orders, paymentStatusFilter, searchQuery, paymentMap]);

  const handleOrderStatusFilter = (filter: OrderStatusFilter) => {
    setOrderStatusFilter(filter);
    setPage(1);
  };

  const handlePaymentStatusFilter = (filter: PaymentStatusFilter) => {
    setPaymentStatusFilter(filter);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* ═══ HEADER ═══ */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-foreground">My Orders</h1>
        <p className="text-sm text-gray-500 dark:text-muted-foreground mt-0.5">
          Track and manage all your orders in one place
        </p>
      </div>

      {/* ═══ SEARCH + SORT ═══ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={13} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-medium hidden sm:block">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={sortBy === opt.value ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => { setSortBy(opt.value); setPage(1); }}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="space-y-3">
        {/* Order Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-[90px]">
            <Filter size={12} className="text-gray-400" />
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Order:</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {ORDER_STATUSES.map((filter) => {
              const isActive = orderStatusFilter === filter;
              const config = filter !== 'All' ? ORDER_STATUS_CONFIG[filter.toUpperCase()] : null;
              return (
                <button
                  key={filter}
                  onClick={() => handleOrderStatusFilter(filter)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 border',
                    isActive
                      ? filter === 'All'
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-sm'
                        : cn(config?.bgColor, config?.color, config?.borderColor, 'shadow-sm')
                      : 'bg-white dark:bg-card text-gray-500 dark:text-muted-foreground border-gray-200 dark:border-border hover:border-gray-300 dark:hover:border-gray-500'
                  )}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-[90px]">
            <CreditCard size={12} className="text-gray-400" />
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Payment:</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {PAYMENT_STATUSES.map((filter) => {
              const isActive = paymentStatusFilter === filter;
              const config = filter !== 'All' ? PAYMENT_STATUS_CONFIG[filter === 'Paid' ? 'SUCCESS' : filter === 'Pending' ? 'PENDING' : filter === 'Failed' ? 'FAILED' : 'REFUNDED'] : null;
              return (
                <button
                  key={filter}
                  onClick={() => handlePaymentStatusFilter(filter)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 border',
                    isActive
                      ? filter === 'All'
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-sm'
                        : cn(config?.bgColor, config?.color, config?.borderColor, 'shadow-sm')
                      : 'bg-white dark:bg-card text-gray-500 dark:text-muted-foreground border-gray-200 dark:border-border hover:border-gray-300 dark:hover:border-gray-500'
                  )}
                >
                  {filter === 'Paid' && isActive ? '✓ ' : ''}{filter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ RESULTS COUNT ═══ */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-muted-foreground">
          Showing {filteredOrders.length} of {totalCount} order{totalCount !== 1 ? 's' : ''}
          {(orderStatusFilter !== 'All' || paymentStatusFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setOrderStatusFilter('All');
                setPaymentStatusFilter('All');
                setSearchQuery('');
                setPage(1);
              }}
              className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </p>
      </div>

      {/* ═══ LOADING STATE ═══ */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-md" />
                    <Skeleton className="h-5 w-14 rounded-md" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-6 w-20 ml-auto" />
                  <Skeleton className="h-3 w-24 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        /* ═══ EMPTY STATE ═══ */
        <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-muted flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-gray-300 dark:text-muted-foreground/40" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-foreground mb-1">
            {searchQuery ? 'No orders match your search' : orderStatusFilter !== 'All' || paymentStatusFilter !== 'All' ? 'No orders match these filters' : 'No orders yet'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mb-5 max-w-sm mx-auto">
            {searchQuery
              ? `No orders found with ID matching "${searchQuery}"`
              : 'Start shopping to see your orders here'
            }
          </p>
          <Link to="/products">
            <Button size="sm" className="gap-2">
              <ShoppingCart size={14} /> Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        /* ═══ ORDER LIST ═══ */
        <div className="space-y-2.5">
          {filteredOrders.map((order) => {
            const orderStatusKey = getOrderStatusKey(order);
            const paymentStatusKey = getPaymentStatusKey(order._id, paymentMap);
            const orderConfig = ORDER_STATUS_CONFIG[orderStatusKey] || ORDER_STATUS_CONFIG.PENDING;
            const paymentConfig = PAYMENT_STATUS_CONFIG[paymentStatusKey] || PAYMENT_STATUS_CONFIG.PENDING;
            const itemCount = order.items?.length || order.totalItems || 0;

            return (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="group block bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl p-4 md:p-5 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* Order Icon */}
                  <div className="h-11 w-11 rounded-xl bg-gray-50 dark:bg-muted flex items-center justify-center shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                    <Package size={18} className="text-gray-400 dark:text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-foreground">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-muted-foreground mb-3">
                      <Calendar size={11} />
                      <span>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                        {' • '}
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      {itemCount > 0 && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>

                    {/* Status Badges — clearly labeled */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 dark:text-muted-foreground font-medium uppercase tracking-wider">Order:</span>
                        <StatusBadge config={orderConfig} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 dark:text-muted-foreground font-medium uppercase tracking-wider">Payment:</span>
                        <StatusBadge config={paymentConfig} />
                      </div>
                    </div>
                  </div>

                  {/* Amount + Action */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <p className="text-lg font-extrabold text-gray-900 dark:text-foreground">
                      ₹{order.totalAmount?.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details <ChevronIcon size={12} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ═══ PAGINATION ═══ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={16} />
          </Button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={page === p ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9 text-xs"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
