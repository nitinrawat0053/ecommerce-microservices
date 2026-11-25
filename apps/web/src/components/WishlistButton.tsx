import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  product: {
    _id: string;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
    stock: number;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function WishlistButton({ product, size = 'md', className }: WishlistButtonProps) {
  const { toggleItem, isInWishlist } = useWishlist();
  const wishlisted = isInWishlist(product._id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleItem(product);
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const iconSizes = { sm: 12, md: 14, lg: 18 };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'rounded-full bg-white/95 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 backdrop-blur-sm flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-105 cursor-pointer',
        sizeClasses[size],
        className
      )}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={iconSizes[size]}
        className={cn(
          'transition-all duration-200',
          wishlisted ? 'fill-red-500 text-red-500 scale-105' : 'text-slate-600 dark:text-slate-300 hover:text-red-500'
        )}
      />
    </button>
  );
}
