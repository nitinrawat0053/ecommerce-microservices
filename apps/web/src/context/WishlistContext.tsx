import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface WishlistItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (product: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: WishlistItem) => boolean;
  isInWishlist: (productId: string) => boolean;
  count: number;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(items));
  }, [items]);

  const addItem = (product: WishlistItem) => {
    setItems(prev => {
      if (prev.some(i => i._id === product._id)) return prev;
      return [...prev, product];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i._id !== productId));
  };

  const toggleItem = (product: WishlistItem): boolean => {
    const exists = items.some(i => i._id === product._id);
    if (exists) {
      removeItem(product._id);
      return false;
    } else {
      addItem(product);
      return true;
    }
  };

  const isInWishlist = (productId: string) => items.some(i => i._id === productId);

  const clear = () => setItems([]);

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, toggleItem, isInWishlist, count: items.length, clear }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
