import { Link } from 'react-router-dom';
import { useWishlist } from '@/context/WishlistContext';
import { Button } from '@/components/ui/button';
import { Heart, Trash2, ShoppingCart, Package, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/api/client';

export default function Wishlist() {
  const { items, removeItem, clear } = useWishlist();

  const addToCart = async (product: any) => {
    try {
      await api.post('/cart', { productId: product._id, quantity: 1 });
      toast.success(`${product.name} added to cart`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="h-20 w-20 rounded-full bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="text-pink-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-foreground mb-2">Your Wishlist is Empty</h2>
        <p className="text-sm text-gray-500 dark:text-muted-foreground mb-6">Save your favorite products here for later.</p>
        <Link to="/products">
          <Button className="bg-blue-600 hover:bg-blue-700 font-bold">
            Browse Products <ArrowRight size={14} className="ml-1.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">My Wishlist</h1>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => { clear(); toast.success('Wishlist cleared'); }} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
            <Trash2 size={14} className="mr-1.5" /> Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {items.map((product) => (
          <div key={product._id} className="bg-white dark:bg-card rounded-2xl overflow-hidden border border-gray-100/80 dark:border-border/50 hover:shadow-xl transition-all duration-300 group">
            <div className="relative h-[180px] md:h-[200px] bg-white dark:bg-muted/30 flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-[80%] h-[80%] object-contain group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <Package size={48} className="text-gray-200 dark:text-muted-foreground/20" />
              )}
              <button onClick={() => { removeItem(product._id); toast.success('Removed from wishlist'); }}
                className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-red-50 transition-all shadow-sm">
                <Heart size={14} className="fill-red-500 text-red-500" />
              </button>
            </div>
            <div className="p-3.5 space-y-2">
              <p className="text-[10px] text-gray-400 dark:text-muted-foreground uppercase tracking-wider font-semibold">{product.category}</p>
              <Link to={`/products/${product._id}`} className="text-[13px] font-semibold text-gray-900 dark:text-foreground truncate block hover:text-blue-600 transition-colors">{product.name}</Link>
              <p className="text-[15px] font-extrabold text-gray-900 dark:text-foreground">₹{product.price.toLocaleString()}</p>
              <Button size="sm" className="w-full h-8 text-[11px] font-bold bg-blue-600 hover:bg-blue-700" onClick={() => addToCart(product)} disabled={product.stock === 0}>
                <ShoppingCart size={12} className="mr-1" /> {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
