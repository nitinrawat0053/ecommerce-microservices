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
        'rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all shadow-sm hover:scale-110',
        sizeClasses[size],
        className
      )}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={iconSizes[size]}
        className={cn(
          'transition-all duration-300',
          wishlisted ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-400 hover:text-red-400'
        )}
      />
    </button>
  );
}
