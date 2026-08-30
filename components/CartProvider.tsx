"use client";

import {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import type {CartLine, PublicProduct} from "@/lib/types";

type CartContextValue = {
  items: CartLine[];
  count: number;
  total: number;
  isOpen: boolean;
  addItem: (product: PublicProduct, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "origem-cart-v1";

export function CartProvider({children}: {children: React.ReactNode}) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored) as CartLine[]);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((product: PublicProduct, quantity = 1) => {
    if (product.effectivePrice == null) return;
    setItems((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) return current.map((line) => line.product.id === product.id
        ? {...line, quantity: Math.min(999, line.quantity + quantity)}
        : line);
      return [...current, {
        product: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          sku: product.sku,
          images: product.images,
          effectivePrice: product.effectivePrice,
        },
        quantity: Math.max(1, quantity),
      }];
    });
    setOpen(true);
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((current) => current.filter((line) => line.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) return removeItem(productId);
    setItems((current) => current.map((line) => line.product.id === productId
      ? {...line, quantity: Math.min(999, Math.max(1, Math.floor(quantity)))}
      : line));
  }, [removeItem]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, line) => sum + line.quantity, 0),
    total: items.reduce((sum, line) => sum + (line.product.effectivePrice || 0) * line.quantity, 0),
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clear: () => setItems([]),
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
  }), [items, isOpen, addItem, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de CartProvider.");
  return context;
}
