import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

export interface CartLine {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string;
}

interface CartContextType {
  lines: CartLine[];
  count: number;
  loading: boolean;
  addItem: (product: { _id?: string; id?: string; name: string; price: number; stock: number; imageUrl?: string; category?: string }, qty?: number) => Promise<void>;
  updateQty: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
}

const GUEST_CART_KEY = 'guest_cart';
const CartContext = createContext<CartContextType | null>(null);

function readGuestCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(lines: CartLine[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(lines));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const linesRef = useRef<CartLine[]>(lines);
  linesRef.current = lines;

  // Logged-in users use the server cart; guests use a localStorage cart.
  const isServer = !!token || !!localStorage.getItem('accessToken');

  const loadServerCart = useCallback(async () => {
    try {
      const res = await api.get('/cart');
      const items = res.data.data?.items || [];
      if (!items.length) {
        setLines([]);
        return;
      }
      const results = await Promise.allSettled(
        items.map((i: any) => api.get(`/products/${i.productId}`).then((r) => r.data.data))
      );
      const mapped: CartLine[] = [];
      items.forEach((item: any, idx: number) => {
        const r = results[idx];
        const p = r.status === 'fulfilled' && r.value ? r.value : null;
        const existingLine = linesRef.current.find((l) => l.productId === item.productId);
        mapped.push({
          productId: item.productId,
          quantity: item.quantity,
          name: p?.name || existingLine?.name || 'Product',
          price: p?.price ?? existingLine?.price ?? 0,
          stock: p?.stock ?? existingLine?.stock ?? item.quantity,
          imageUrl: p?.imageUrl || existingLine?.imageUrl,
          category: p?.category || existingLine?.category,
        });
      });
      setLines(mapped);
    } catch {
      // 404 (no cart) or any error -> treat as empty for guests/users
      setLines([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (isServer) await loadServerCart();
    else setLines(readGuestCart());
    setLoading(false);
  }, [isServer, loadServerCart]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // When a guest logs in, fold their localStorage cart into the server cart so
  // no items are lost (handles logins from /login as well as the checkout gate).
  const prevToken = useRef<boolean>(!!token);
  useEffect(() => {
    const hadToken = prevToken.current;
    if (token && !hadToken) {
      (async () => {
        await mergeGuestCart();
      })();
    }
    prevToken.current = !!token;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const addItem = async (
    product: { _id?: string; id?: string; name: string; price: number; stock: number; imageUrl?: string; category?: string },
    qty = 1
  ) => {
    const pid = product._id || (product as any).id;
    if (!pid) return;

    if (isServer) {
      // Optimistic update
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === pid);
        if (existing) {
          return prev.map((l) =>
            l.productId === pid ? { ...l, quantity: l.quantity + qty } : l
          );
        }
        return [
          ...prev,
          {
            productId: pid,
            quantity: qty,
            name: product.name,
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl,
            category: product.category,
          },
        ];
      });

      try {
        await api.post('/cart', { productId: pid, quantity: qty });
      } catch (err) {
        await loadServerCart();
        throw err;
      }
      await loadServerCart();
      return;
    }
    const guest = readGuestCart();
    const existing = guest.find((l) => l.productId === pid);
    if (existing) {
      existing.quantity += qty;
    } else {
      guest.push({
        productId: pid,
        quantity: qty,
        name: product.name,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        category: product.category,
      });
    }
    writeGuestCart(guest);
    setLines(guest);
  };

  const updateQty = async (productId: string, quantity: number) => {
    if (isServer) {
      setLines((prev) =>
        prev.map((l) => (l.productId === productId ? { ...l, quantity } : l))
      );
      try {
        await api.patch(`/cart/${productId}`, { quantity });
      } catch (err) {
        await loadServerCart();
        throw err;
      }
      await loadServerCart();
      return;
    }
    const guest = readGuestCart().map((l) =>
      l.productId === productId ? { ...l, quantity } : l
    );
    writeGuestCart(guest);
    setLines(guest);
  };

  const removeItem = async (productId: string) => {
    if (isServer) {
      setLines((prev) => prev.filter((l) => l.productId !== productId));
      try {
        await api.delete(`/cart/${productId}`);
      } catch (err) {
        await loadServerCart();
        throw err;
      }
      await loadServerCart();
      return;
    }
    const guest = readGuestCart().filter((l) => l.productId !== productId);
    writeGuestCart(guest);
    setLines(guest);
  };

  const clear = async () => {
    if (isServer) {
      setLines([]);
      try {
        await api.delete('/cart');
      } catch (err) {
        await loadServerCart();
        throw err;
      }
      setLines([]);
      return;
    }
    writeGuestCart([]);
    setLines([]);
  };

  // Called after a guest logs in: push any guest items into the server cart,
  // then clear the guest cart so the server cart becomes the source of truth.
  const mergeGuestCart = async () => {
    const guest = readGuestCart();
    if (!guest.length) return;
    for (const l of guest) {
      try {
        await api.post('/cart', { productId: l.productId, quantity: l.quantity });
      } catch {
        /* best-effort merge */
      }
    }
    writeGuestCart([]);
    await loadServerCart();
  };

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider
      value={{ lines, count, loading, addItem, updateQty, removeItem, clear, refresh, mergeGuestCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
