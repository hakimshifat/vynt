/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";
import { Product } from "./types";
import { PRODUCTS as DEFAULT_PRODUCTS } from "./constants";
import { useAdmin } from "./AdminContext";

interface ProductContextType {
  products: Product[];
  loading: boolean;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  resetToDefaults: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const COLLECTION = "products";

interface ProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  colors: string[];
  sizes: string[];
  gallery: string[] | null;
  is_new: boolean | null;
  is_featured: boolean | null;
  subtitle: string | null;
  scarcity_message: string | null;
  discounted_price: number | null;
}

function fromRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    image: row.image,
    description: row.description,
    colors: row.colors ?? [],
    sizes: row.sizes ?? [],
    gallery: row.gallery ?? [],
    isNew: row.is_new ?? false,
    isFeatured: row.is_featured ?? false,
    subtitle: row.subtitle ?? "",
    scarcityMessage: row.scarcity_message ?? "",
    discountedPrice: row.discounted_price ?? undefined,
  };
}

function toRow(product: Product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    image: product.image,
    description: product.description,
    colors: product.colors,
    sizes: product.sizes,
    gallery: product.gallery ?? [],
    is_new: product.isNew ?? false,
    is_featured: product.isFeatured ?? false,
    subtitle: product.subtitle ?? null,
    scarcity_message: product.scarcityMessage ?? null,
    discounted_price: product.discountedPrice ?? null,
  };
}

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    loadProducts();

    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: COLLECTION }, loadProducts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from(COLLECTION)
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("[ProductContext] Supabase error:", error);
      setProducts(DEFAULT_PRODUCTS);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      if (isAdmin) {
        await seedDefaults();
      } else {
        setProducts(DEFAULT_PRODUCTS);
        setLoading(false);
      }
      return;
    }

    setProducts((data as ProductRow[]).map(fromRow));
    setLoading(false);
  };

  const seedDefaults = async () => {
    try {
      const { error } = await supabase.from(COLLECTION).upsert(DEFAULT_PRODUCTS.map(toRow));
      if (error) throw error;
      setProducts(DEFAULT_PRODUCTS);
      setLoading(false);
    } catch (err) {
      console.error("[ProductContext] Failed to seed defaults:", err);
      setProducts(DEFAULT_PRODUCTS);
      setLoading(false);
    }
  };

  const addProduct = async (product: Product) => {
    try {
      const { error } = await supabase.from(COLLECTION).upsert(toRow(product));
      if (error) throw error;
    } catch (err) {
      console.error("[ProductContext] addProduct failed:", err);
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      const { error } = await supabase.from(COLLECTION).upsert(toRow(product));
      if (error) throw error;
    } catch (err) {
      console.error("[ProductContext] updateProduct failed:", err);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from(COLLECTION).delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("[ProductContext] deleteProduct failed:", err);
    }
  };

  const resetToDefaults = async () => {
    try {
      if (products.length > 0) {
        const { error: deleteError } = await supabase
          .from(COLLECTION)
          .delete()
          .in("id", products.map((p) => p.id));
        if (deleteError) throw deleteError;
      }
      const { error } = await supabase.from(COLLECTION).upsert(DEFAULT_PRODUCTS.map(toRow));
      if (error) throw error;
    } catch (err) {
      console.error("[ProductContext] resetToDefaults failed:", err);
    }
  };

  return (
    <ProductContext.Provider value={{ products, loading, addProduct, updateProduct, deleteProduct, resetToDefaults }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used within a ProductProvider");
  return ctx;
};
