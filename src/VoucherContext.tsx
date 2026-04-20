/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";

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
  discountAmount: number;   // computed discount on current cart total
  applyCode: (code: string, cartTotal: number) => { success: boolean; message: string };
  removeApplied: () => void;
  // Admin ops
  addVoucher: (v: Voucher) => void;
  updateVoucher: (v: Voucher) => void;
  deleteVoucher: (code: string) => void;
  incrementUsage: (code: string) => void;
}

const VOUCHERS_KEY = "vynt-vouchers";
const APPLIED_KEY  = "vynt-applied-voucher";

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

function loadVouchers(): Voucher[] {
  try {
    const saved = localStorage.getItem(VOUCHERS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_VOUCHERS;
  } catch {
    return DEFAULT_VOUCHERS;
  }
}

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
  return Math.min(voucher.value, cartTotal); // fixed can't exceed cart total
}

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

export const VoucherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vouchers, setVouchers] = useState<Voucher[]>(loadVouchers);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(loadApplied);
  const [cartTotalSnapshot, setCartTotalSnapshot] = useState(0);

  useEffect(() => {
    localStorage.setItem(VOUCHERS_KEY, JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    if (appliedVoucher) {
      localStorage.setItem(APPLIED_KEY, JSON.stringify(appliedVoucher));
    } else {
      localStorage.removeItem(APPLIED_KEY);
    }
  }, [appliedVoucher]);

  const applyCode = (code: string, cartTotal: number): { success: boolean; message: string } => {
    const voucher = vouchers.find(v => v.code.toUpperCase() === code.trim().toUpperCase());

    if (!voucher) return { success: false, message: "Invalid voucher code." };
    if (!voucher.active) return { success: false, message: "This voucher is inactive." };
    if (voucher.usageLimit && voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      return { success: false, message: "This voucher has reached its usage limit." };
    }
    if (voucher.minOrder && cartTotal < voucher.minOrder) {
      return {
        success: false,
        message: `Minimum order of ৳${voucher.minOrder.toLocaleString()} required for this code.`,
      };
    }

    setAppliedVoucher(voucher);
    setCartTotalSnapshot(cartTotal);
    return { success: true, message: "Voucher applied successfully!" };
  };

  const removeApplied = () => setAppliedVoucher(null);

  const discountAmount = appliedVoucher ? computeDiscount(appliedVoucher, cartTotalSnapshot || appliedVoucher.value) : 0;

  const addVoucher = (v: Voucher) => setVouchers(prev => [...prev, v]);
  const updateVoucher = (v: Voucher) => setVouchers(prev => prev.map(x => x.code === v.code ? v : x));
  const deleteVoucher = (code: string) => {
    setVouchers(prev => prev.filter(v => v.code !== code));
    if (appliedVoucher?.code === code) setAppliedVoucher(null);
  };
  const incrementUsage = (code: string) => {
    setVouchers(prev => prev.map(v => v.code === code ? { ...v, usedCount: v.usedCount + 1 } : v));
  };

  return (
    <VoucherContext.Provider value={{
      vouchers, appliedVoucher, discountAmount,
      applyCode, removeApplied,
      addVoucher, updateVoucher, deleteVoucher, incrementUsage,
    }}>
      {children}
    </VoucherContext.Provider>
  );
};

export const useVouchers = () => {
  const ctx = useContext(VoucherContext);
  if (!ctx) throw new Error("useVouchers must be used within a VoucherProvider");
  return ctx;
};
