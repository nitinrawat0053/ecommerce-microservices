import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Star, ShoppingCart, Package } from 'lucide-react';
import StockBadge from './StockBadge';
import WishlistButton from './WishlistButton';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';

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
  const { addItem } = useCart();

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0 || adding) return;
    setAdding(true);
    try {
      await addItem(
        { _id: product._id, name: product.name, price: product.price, stock: product.stock, imageUrl: product.imageUrl, category: product.category },
        1
      );
      toast.success(`${product.name} added to cart`);
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/products/${product._id}`} className="group block h-full">
      <div className={cn(
        'relative h-full rounded-[20px] overflow-hidden bg-gradient-to-b from-white via-[#FCFBFF] to-[#F4F3FE] dark:from-card dark:via-card dark:to-card',
        'border border-indigo-200/75 dark:border-border/80',
        'shadow-[0_10px_28px_-8px_rgba(79,70,229,0.14),0_2px_8px_-2px_rgba(15,23,42,0.06),inset_0_0_0_1px_rgba(255,255,255,0.92)] dark:shadow-md',
        'hover:shadow-[0_16px_34px_-8px_rgba(79,70,229,0.22),0_4px_14px_-2px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:border-indigo-300/85 dark:hover:border-indigo-500/40',
        'transition-all duration-200 flex flex-col',
        compact ? 'w-[178px] md:w-[196px]' : 'w-full'
      )}>
        {/* Subtle flowing lavender-blue wave inside bottom of card */}
        <svg
          viewBox="0 0 220 140"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-[48%] w-full pointer-events-none dark:opacity-10"
          aria-hidden="true"
        >
          <path
            d="M0,105 C45,120 95,88 150,74 C180,66 202,68 220,76 L220,140 L0,140 Z"
            fill="#E3EAFD"
            opacity="0.58"
          />
          <path
            d="M65,140 C115,112 165,98 220,104 L220,140 Z"
            fill="#DCD9FB"
            opacity="0.45"
          />
        </svg>

        {/* Image Container */}
        <div className="relative z-10 bg-white/95 dark:bg-muted/30 flex items-center justify-center overflow-hidden pt-5 px-3 pb-2"
          style={{ aspectRatio: '1.06 / 1' }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-[82%] h-[82%] object-contain group-hover:scale-[1.03] transition-transform duration-300"
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
            <span className="absolute top-3 left-3 bg-[#12B356] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-[0_2px_8px_rgba(16,185,84,0.28)] z-10">
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

          {/* Low stock badge (1–10) */}
          {product.stock > 0 && product.stock <= 10 && (
            <span className="absolute top-3 right-12 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-0.5">
              ⚠ Only {product.stock} left
            </span>
          )}

          {/* Wishlist button */}
          <div className="absolute top-3 right-3 z-10">
            <WishlistButton product={product} />
          </div>

          {/* Quick Add button (reveals smoothly on hover without reserving extra footer whitespace) */}
          {product.stock > 0 && (
            <button
              onClick={handleQuickAdd}
              disabled={adding}
              className="absolute inset-x-3 bottom-2 z-10 h-8 rounded-xl bg-blue-600/95 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md transition-all duration-200 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 cursor-pointer"
            >
              {adding ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShoppingCart size={12} /> Quick Add</>}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="relative z-10 px-4 pt-2.5 pb-4 space-y-1.5 flex-1 flex flex-col">
          <p className="text-[10.5px] text-slate-500 dark:text-muted-foreground uppercase tracking-[0.06em] font-semibold truncate">
            {product.category}
          </p>
          <p className="text-[14px] font-bold text-slate-900 dark:text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-blue-400 transition-colors leading-snug tracking-[-0.01em]">
            {product.name}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2 pt-0.5">
            <div className="inline-flex items-center gap-1 bg-[#15B257] text-white text-[11px] font-bold px-2 py-[2px] rounded-full leading-none">
              <Star size={10} className="fill-white" />
              <span>{rating}</span>
            </div>
            <span className="text-[12px] font-medium text-slate-500 dark:text-muted-foreground">
              ({reviewCount.toLocaleString()})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-[17px] md:text-[18px] font-black text-slate-950 dark:text-foreground tracking-[-0.02em] leading-none">
              ₹{product.price?.toLocaleString()}
            </span>
            {discount > 0 && (
              <span className="text-[12px] font-medium text-slate-400 dark:text-muted-foreground line-through">
                ₹{fakeOriginal.toLocaleString()}
              </span>
            )}
          </div>

          {/* Stock status */}
          <div className="pt-0.5">
            <StockBadge stock={product.stock} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// Utility: cn helper (import from existing util)
import { cn } from '@/lib/utils';
