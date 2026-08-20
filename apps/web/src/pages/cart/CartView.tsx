import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package, AlertCircle, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface CartItemRaw { productId: string; quantity: number; addedAt?: string; }
interface CartItemDetailed { productId: string; quantity: number; name: string; price: number; stock: number; imageUrl?: string; category?: string; }
interface CartData { _id: string; userId: string; items: CartItemRaw[]; }

export default function CartView() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItemDetailed[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);

  const fetchProductDetails = useCallback(async (productIds: string[]): Promise<Map<string, any>> => {
    const productMap = new Map<string, any>();
    const results = await Promise.allSettled(productIds.map((id) => api.get(`/products/${id}`).then((r) => r.data.data)));
    results.forEach((result, i) => { if (result.status === 'fulfilled' && result.value) productMap.set(productIds[i], result.value); });
    return productMap;
  }, []);

  const rebuildItems = async (cartData: any) => {
    if (!cartData?.items || cartData.items.length === 0) { setItems([]); setTotalPrice(0); return; }
    const productIds = cartData.items.map((i: CartItemRaw) => i.productId);
    const productMap = await fetchProductDetails(productIds);
    const detailed: CartItemDetailed[] = cartData.items.map((item: CartItemRaw) => {
      const product = productMap.get(item.productId);
      if (!product) return null;
      return { productId: item.productId, quantity: item.quantity, name: product.name, price: product.price, stock: product.stock, imageUrl: product.imageUrl, category: product.category };
    }).filter(Boolean) as CartItemDetailed[];
    setItems(detailed);
    setTotalPrice(detailed.reduce((sum, item) => sum + item.price * item.quantity, 0));
  };

  const fetchCart = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/cart');
      const cartData: CartData | null = res.data.data;
      if (!cartData || !cartData.items || cartData.items.length === 0) { setItems([]); setTotalPrice(0); return; }
      await rebuildItems(cartData);
    } catch (err: any) {
      if (err.response?.status === 404) { setItems([]); setTotalPrice(0); }
      else setError(err.response?.data?.message || 'Failed to load cart');
    } finally { setLoading(false); }
  }, [fetchProductDetails]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const updateQty = async (productId: string, quantity: number) => {
    setUpdating(productId);
    try { const res = await api.patch(`/cart/${productId}`, { quantity }); await rebuildItems(res.data.data); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to update quantity'); }
    finally { setUpdating(null); }
  };

  const remove = async (productId: string) => {
    setUpdating(productId);
    try { const res = await api.delete(`/cart/${productId}`); await rebuildItems(res.data.data); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to remove item'); }
    finally { setUpdating(null); }
  };

  const clearCart = async () => {
    if (!confirm('Clear entire cart?')) return;
    setClearing(true);
    try { await api.delete('/cart'); setItems([]); setTotalPrice(0); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to clear cart'); }
    finally { setClearing(false); }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart} disabled={clearing} className="text-destructive hover:text-destructive">
            <Trash2 size={14} /> {clearing ? 'Clearing...' : 'Clear cart'}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading cart</p>
            <p className="text-destructive/70 mt-1">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchCart} className="mt-2 h-7 px-2 text-xs">Try again</Button>
          </div>
        </div>
      )}

      {items.length === 0 && !error ? (
        <Card>
          <CardContent className="py-20 text-center">
            <ShoppingBag size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Add some products to get started</p>
            <Button onClick={() => navigate('/products')}>Browse Products</Button>
          </CardContent>
        </Card>
      ) : items.length > 0 ? (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.productId} className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.category && <Badge variant="outline" className="text-[10px] mt-0.5">{item.category}</Badge>}
                      <p className="text-sm text-muted-foreground mt-0.5">₹{item.price.toLocaleString()} each</p>
                      {item.quantity > item.stock && <p className="text-xs text-destructive mt-0.5">Only {item.stock} available</p>}
                    </div>
                    <div className="flex items-center border border-border rounded-md">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={() => updateQty(item.productId, item.quantity - 1)} disabled={updating === item.productId || item.quantity <= 1}>
                        <Minus size={12} />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium border-x border-border h-8 flex items-center justify-center">
                        {updating === item.productId ? '...' : item.quantity}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={() => updateQty(item.productId, item.quantity + 1)} disabled={updating === item.productId || item.quantity >= item.stock}>
                        <Plus size={12} />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold w-20 text-right">₹{(item.price * item.quantity).toLocaleString()}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(item.productId)} disabled={updating === item.productId}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total ({items.reduce((a, i) => a + i.quantity, 0)} items)</p>
                  <p className="text-2xl font-bold tracking-tight">₹{totalPrice.toLocaleString()}</p>
                </div>
                <Button size="lg" onClick={() => navigate('/orders/new?from=cart')}>
                  Proceed to Order <ArrowRight size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
