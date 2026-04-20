/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Product } from "./types";
import { PRODUCTS as DEFAULT_PRODUCTS } from "./constants";

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

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [firestoreOk, setFirestoreOk] = useState(true);

  // Real-time listener on the products collection
  useEffect(() => {
    const ref = collection(db, COLLECTION);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.empty) {
          // First run — Firestore is empty, seed with defaults
          seedDefaults();
          return;
        }
        const loaded: Product[] = snap.docs.map((d) => d.data() as Product);
        // Sort by a stable order field if present, otherwise by name
        loaded.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(loaded);
        setLoading(false);
        setFirestoreOk(true);
      },
      (err) => {
        console.error("[ProductContext] Firestore error:", err);
        // Fall back to hardcoded defaults so the store still works
        setProducts(DEFAULT_PRODUCTS);
        setLoading(false);
        setFirestoreOk(false);
      }
    );
    return unsub;
  }, []);

  const seedDefaults = async () => {
    try {
      const batch = writeBatch(db);
      DEFAULT_PRODUCTS.forEach((p) => {
        batch.set(doc(db, COLLECTION, p.id), p);
      });
      await batch.commit();
      // onSnapshot will fire again with the seeded data
    } catch (err) {
      console.error("[ProductContext] Failed to seed defaults:", err);
      setProducts(DEFAULT_PRODUCTS);
      setLoading(false);
    }
  };

  const addProduct = async (product: Product) => {
    try {
      await setDoc(doc(db, COLLECTION, product.id), product);
    } catch (err) {
      console.error("[ProductContext] addProduct failed:", err);
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      await setDoc(doc(db, COLLECTION, product.id), product, { merge: true });
    } catch (err) {
      console.error("[ProductContext] updateProduct failed:", err);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (err) {
      console.error("[ProductContext] deleteProduct failed:", err);
    }
  };

  const resetToDefaults = async () => {
    try {
      // Delete all current docs then re-seed
      const batch = writeBatch(db);
      products.forEach((p) => {
        batch.delete(doc(db, COLLECTION, p.id));
      });
      DEFAULT_PRODUCTS.forEach((p) => {
        batch.set(doc(db, COLLECTION, p.id), p);
      });
      await batch.commit();
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
