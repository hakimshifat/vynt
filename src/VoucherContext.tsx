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
  increment,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type DiscountType = "percent" | "fixed";

export interface Voucher {
  code: string;           // e.g. "VYNT20"
  type: DiscountType;     // "percent" | "fixed"
  value: number;          // e.g. 20 (= 20%) or 500 (= ৳500 off)
  minOrder?: number;      // minimum cart total to apply
  active: boolean;
  usageLimit?: number;    // max uses (0 = unlimited)
  usedCount: number;
  description?: string;   // e.g. "20% off on orders above ৳5000"
}

interface VoucherContextType {
  vouchers: Voucher[];
  appliedVoucher: Voucher | null;
  discountAmount: number;
  applyCode: (code: string, cartTotal: number) => { success: boolean; message: string };
  removeApplied: () => void;
  // Admin ops
  addVoucher: (v: Voucher) => void;
  updateVoucher: (v: Voucher) => void;
  deleteVoucher: (code: string) => void;
  incrementUsage: (code: string) => void;
}

const COLLECTION  = "vouchers";
const APPLIED_KEY = "vynt-applied-voucher";

const DEFAULT_VOUCHERS: Voucher[] = [
  {
    code: "VYNT10",
    type: "percent",
    value: 10,
    minOrder: 5000,
    active: true,
    usageLimit: 0,
    usedCount: 0,
    description: "10% off on orders above ৳5,000",
  },
  {
    code: "LAUNCH500",
    type: "fixed",
    value: 500,
    minOrder: 3000,
    active: true,
    usageLimit: 100,
    usedCount: 0,
    description: "৳500 off on orders above ৳3,000",
  },
];

function loadApplied(): Voucher | null {
  try {
    const saved = localStorage.getItem(APPLIED_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function computeDiscount(voucher: Voucher, cartTotal: number): number {
  if (voucher.type === "percent") {
    return Math.round((cartTotal * voucher.value) / 100);
  }
  return Math.min(voucher.value, cartTotal);
}

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

export const VoucherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vouchers, setVouchers] = useState<Voucher[]>(DEFAULT_VOUCHERS);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(loadApplied);
  const [cartTotalSnapshot, setCartTotalSnapshot] = useState(0);

  // Real-time listener on vouchers collection
  useEffect(() => {
    const ref = collection(db, COLLECTION);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.empty) {
          seedDefaults();
          return;
        }
        const loaded: Voucher[] = snap.docs.map((d) => d.data() as Voucher);
        setVouchers(loaded);
      },
      (err) => {
        console.error("[VoucherContext] Firestore error:", err);
        setVouchers(DEFAULT_VOUCHERS);
      }
    );
    return unsub;
  }, []);

  const seedDefaults = async () => {
    try {
      const batch = writeBatch(db);
      DEFAULT_VOUCHERS.forEach((v) => {
        batch.set(doc(db, COLLECTION, v.code), v);
      });
      await batch.commit();
    } catch (err) {
      console.error("[VoucherContext] Failed to seed defaults:", err);
    }
  };

  // Persist applied voucher to localStorage (per-session cart state)
  useEffect(() => {
    if (appliedVoucher) {
      localStorage.setItem(APPLIED_KEY, JSON.stringify(appliedVoucher));
    } else {
      localStorage.removeItem(APPLIED_KEY);
    }
  }, [appliedVoucher]);

  const applyCode = (code: string, cartTotal: number): { success: boolean; message: string } => {
    const voucher = vouchers.find((v) => v.code.toUpperCase() === code.trim().toUpperCase());
    if (!voucher) return { success: false, message: "Invalid voucher code." };
    if (!voucher.active) return { success: false, message: "This voucher is inactive." };
    if (voucher.usageLimit && voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      return { success: false, message: "This voucher has reached its usage limit." };
    }
    if (voucher.minOrder && cartTotal < voucher.minOrder) {
      return {
        success: false,
        message: `Minimum order of ৳${voucher.minOrder.toLocaleString()} required.`,
      };
    }
    setAppliedVoucher(voucher);
    setCartTotalSnapshot(cartTotal);
    return { success: true, message: "Voucher applied successfully!" };
  };

  const removeApplied = () => setAppliedVoucher(null);

  const discountAmount = appliedVoucher
    ? computeDiscount(appliedVoucher, cartTotalSnapshot || appliedVoucher.value)
    : 0;

  const addVoucher = async (v: Voucher) => {
    try {
      await setDoc(doc(db, COLLECTION, v.code), v);
    } catch (err) {
      console.error("[VoucherContext] addVoucher failed:", err);
    }
  };

  const updateVoucher = async (v: Voucher) => {
    try {
      await setDoc(doc(db, COLLECTION, v.code), v, { merge: true });
    } catch (err) {
      console.error("[VoucherContext] updateVoucher failed:", err);
    }
  };

  const deleteVoucher = async (code: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION, code));
      if (appliedVoucher?.code === code) setAppliedVoucher(null);
    } catch (err) {
      console.error("[VoucherContext] deleteVoucher failed:", err);
    }
  };

  const incrementUsage = async (code: string) => {
    try {
      await updateDoc(doc(db, COLLECTION, code), {
        usedCount: increment(1),
      });
    } catch (err) {
      console.error("[VoucherContext] incrementUsage failed:", err);
    }
  };

  return (
    <VoucherContext.Provider
      value={{
        vouchers,
        appliedVoucher,
        discountAmount,
        applyCode,
        removeApplied,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        incrementUsage,
      }}
    >
      {children}
    </VoucherContext.Provider>
  );
};

export const useVouchers = () => {
  const ctx = useContext(VoucherContext);
  if (!ctx) throw new Error("useVouchers must be used within a VoucherProvider");
  return ctx;
};
