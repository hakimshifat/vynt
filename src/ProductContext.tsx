/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "./types";
import { PRODUCTS as DEFAULT_PRODUCTS } from "./constants";

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEY = "vynt-custom-products";

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customProducts, setCustomProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Merged: default products updated by any edits, plus new custom ones
  const [overrides, setOverrides] = useState<Record<string, Product>>(() => {
    try {
      const saved = localStorage.getItem("vynt-product-overrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("vynt-deleted-ids");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customProducts));
  }, [customProducts]);

  useEffect(() => {
    localStorage.setItem("vynt-product-overrides", JSON.stringify(overrides));
  }, [overrides]);

  useEffect(() => {
    localStorage.setItem("vynt-deleted-ids", JSON.stringify([...deletedIds]));
  }, [deletedIds]);

  // Build final product list: default (with overrides applied, minus deleted) + custom
  const products: Product[] = [
    ...DEFAULT_PRODUCTS
      .filter(p => !deletedIds.has(p.id))
      .map(p => overrides[p.id] ?? p),
    ...customProducts.filter(p => !deletedIds.has(p.id)),
  ];

  const addProduct = (product: Product) => {
    setCustomProducts(prev => [...prev, product]);
  };

  const updateProduct = (product: Product) => {
    // Check if it's a default product
    const isDefault = DEFAULT_PRODUCTS.some(p => p.id === product.id);
    if (isDefault) {
      setOverrides(prev => ({ ...prev, [product.id]: product }));
    } else {
      setCustomProducts(prev => prev.map(p => p.id === product.id ? product : p));
    }
  };

  const deleteProduct = (id: string) => {
    setDeletedIds(prev => new Set([...prev, id]));
    setCustomProducts(prev => prev.filter(p => p.id !== id));
  };

  const resetToDefaults = () => {
    setCustomProducts([]);
    setOverrides({});
    setDeletedIds(new Set());
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("vynt-product-overrides");
    localStorage.removeItem("vynt-deleted-ids");
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, resetToDefaults }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used within a ProductProvider");
  return ctx;
};
