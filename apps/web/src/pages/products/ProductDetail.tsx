import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, ArrowLeft, Package, Check, Minus, Plus, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartMsg, setCartMsg] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((r) => setProduct(r.data.data))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    setAdding(true);
    try {
      await api.post('/cart', { productId: id, quantity });
      toast.success(`Added ${quantity} item(s) to cart`);
      setCartMsg(true);
      setTimeout(() => setCartMsg(false), 4000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-4 w-48" />
        <Card>
          <div className="md:flex">
            <Skeleton className="md:w-1/2 aspect-square" />
            <div className="md:w-1/2 p-8 space-y-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        </Card>
      </div>
    );
  }
  if (!product) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{product.name}</span>
      </div>

      <Card className="overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 aspect-square bg-muted flex items-center justify-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package size={64} className="text-muted-foreground/20" />
            )}
          </div>

          <div className="md:w-1/2 p-8 space-y-6">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{product.category}</p>
              <h1 className="text-2xl font-bold tracking-tight mt-1">{product.name}</h1>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">₹{product.price.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">incl. all taxes</span>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-destructive'}`} />
              <span className={`text-sm font-medium ${product.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                {product.stock > 0 ? `${product.stock} units in stock` : 'Out of stock'}
              </span>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center border border-border rounded-md w-fit">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus size={14} />
                </Button>
                <span className="w-12 text-center text-sm font-medium border-x border-border h-9 flex items-center justify-center">
                  {quantity}
                </span>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                  <Plus size={14} />
                </Button>
              </div>
            </div>

            <Button 
              className="w-full h-11" 
              onClick={addToCart} 
              disabled={product.stock === 0 || adding}
            >
              {adding ? (
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : cartMsg ? (
                <>
                  <Check size={16} /> Added to cart
                </>
              ) : (
                <>
                  <ShoppingCart size={16} /> Add to Cart
                </>
              )}
            </Button>

            {cartMsg && (
              <Link to="/cart">
                <Button variant="outline" className="w-full h-11">
                  View Cart <ExternalLink size={14} />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
