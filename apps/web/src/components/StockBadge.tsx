import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface StockBadgeProps {
  stock: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StockBadge({ stock, size = 'sm', className = '' }: StockBadgeProps) {
  // In Stock: > 10
  if (stock > 10) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} text-emerald-600 dark:text-emerald-400 ${className}`}>
        <CheckCircle2 size={iconSizes[size]} />
        In Stock
      </span>
    );
  }

  // Low Stock: 1–10
  if (stock > 0) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} text-amber-600 dark:text-amber-400 ${className}`}>
        <AlertTriangle size={iconSizes[size]} />
        Only {stock} left in stock
      </span>
    );
  }

  // Out of Stock: 0
  return (
    <span className={`inline-flex items-center gap-1 ${sizeClasses[size]} text-red-500 dark:text-red-400 ${className}`}>
      <XCircle size={iconSizes[size]} />
      Out of Stock
    </span>
  );
}

const sizeClasses = {
  sm: 'text-[11px] font-semibold',
  md: 'text-sm font-semibold',
  lg: 'text-base font-bold',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 18,
};
