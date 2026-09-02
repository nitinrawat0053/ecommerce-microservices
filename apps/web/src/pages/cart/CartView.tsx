import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Plus, Minus, ArrowRight, Package, ShoppingBag, Trash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CartView() {
  const navigate = useNavigate();
  const { lines: items, loading, updateQty, removeItem, clear } = useCart();
  const [updating, setUpdating] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleQty = async (productId: string, quantity: number) => {
    setUpdating(productId);
    try {
      await updateQty(productId, quantity);
    } catch {
      toast.error('Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const remove = async (productId: string) => {
    setUpdating(productId);
    try {
      await removeItem(productId);
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    setClearing(true);
    try {
      await clear();
      setShowClearDialog(false);
      toast.success('Cart cleared successfully', { icon: <Trash2 size={14} className="text-emerald-500" /> });
    } catch {
      toast.error('Failed to clear cart. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
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
          <Button variant="ghost" size="sm" onClick={() => setShowClearDialog(true)} disabled={clearing} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 size={14} /> {clearing ? 'Clearing...' : 'Clear cart'}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <ShoppingBag size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Add some products to get started</p>
            <Button onClick={() => navigate('/products')}>Browse Products</Button>
          </CardContent>
        </Card>
      ) : (
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={() => handleQty(item.productId, item.quantity - 1)} disabled={updating === item.productId || item.quantity <= 1}>
                        <Minus size={12} />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium border-x border-border h-8 flex items-center justify-center">
                        {updating === item.productId ? '...' : item.quantity}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={() => handleQty(item.productId, item.quantity + 1)} disabled={updating === item.productId || item.quantity >= item.stock}>
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
      )}

      {/* ═══ CLEAR CART CONFIRMATION MODAL ═══ */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto h-12 w-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-2">
              <Trash size={20} className="text-red-500" />
            </div>
            <DialogTitle className="text-center">Clear your cart?</DialogTitle>
            <DialogDescription className="text-center">
              This will remove all {items.length} item{items.length !== 1 ? 's' : ''} from your cart. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 sm:justify-center">
            <Button variant="outline" onClick={() => setShowClearDialog(false)} disabled={clearing} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="destructive" onClick={clearCart} disabled={clearing} className="flex-1 sm:flex-none">
              {clearing ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Clearing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 size={14} />
                  Clear Cart
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}