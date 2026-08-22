import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Star, ShoppingCart, Package } from 'lucide-react';
import WishlistButton from './WishlistButton';
import { toast } from 'sonner';
import api from '@/api/client';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
    stock: number;
    description?: string;
  };
  discount?: number;
  rating?: string;
  reviewCount?: number;
  compact?: boolean;
}

export default function ProductCard({ product, discount: propDiscount, rating: propRating, reviewCount: propReviews, compact }: ProductCardProps) {
  // Stable per-product derived values (not random each render)
  const discount = propDiscount ?? (product.price > 500 ? (product.price % 30) + 10 : 0);
  const fakeOriginal = discount > 0 ? Math.round(product.price / (1 - discount / 100)) : 0;
  const rating = propRating ?? `${4 + (product.price % 5) / 10}`;
  const reviewCount = propReviews ?? ((product.price * 7) % 200) + 5;

  const [adding, setAdding] = useState(false);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0 || adding) return;
    setAdding(true);
    try {
      await api.post('/cart', { productId: product._id, quantity: 1 });
      toast.success(`${product.name} added to cart`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/products/${product._id}`} className="group block">
      <div className={cn(
        'bg-white dark:bg-card rounded-2xl overflow-hidden border border-gray-100/80 dark:border-border/50',
        'hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300',
        compact ? 'w-[170px] md:w-[195px]' : 'w-full'
      )}>
        {/* Image Container */}
        <div className="relative bg-white dark:bg-muted/30 flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: '1 / 1' }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-[80%] h-[80%] object-contain group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-200 dark:text-muted-foreground/20">
              <Package size={48} />
              <span className="text-[10px] font-medium">No Image</span>
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute top-2.5 left-2.5 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">
              {discount}% off
            </span>
          )}

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/30 px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}

          {/* Low stock badge */}
          {product.stock > 0 && product.stock <= 5 && (
            <span className="absolute top-2.5 right-12 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">
              Only {product.stock} left
            </span>
          )}

          {/* Wishlist button */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <WishlistButton product={product} />
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5 space-y-1.5">
          <p className="text-[10px] text-gray-400 dark:text-muted-foreground uppercase tracking-wider font-semibold">
            {product.category}
          </p>
          <p className="text-[13px] font-semibold text-gray-900 dark:text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
            {product.name}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              <Star size={10} className="fill-white" />{rating}
            </div>
            <span className="text-[11px] text-gray-400 dark:text-muted-foreground">
              ({reviewCount.toLocaleString()})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-[15px] font-extrabold text-gray-900 dark:text-foreground">
              ₹{product.price?.toLocaleString()}
            </span>
            {discount > 0 && (
              <span className="text-[11px] text-gray-400 dark:text-muted-foreground line-through">
                ₹{fakeOriginal.toLocaleString()}
              </span>
            )}
          </div>

          {/* Quick Add button (visible on hover) */}
          <button
            onClick={handleQuickAdd}
            disabled={product.stock === 0 || adding}
            className="w-full mt-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all opacity-0 group-hover:opacity-100"
          >
            {adding ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShoppingCart size={12} /> Quick Add</>}
          </button>
        </div>
      </div>
    </Link>
  );
}

// Utility: cn helper (import from existing util)
import { cn } from '@/lib/utils';
