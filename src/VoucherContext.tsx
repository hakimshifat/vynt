/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useAdmin } from "./AdminContext";

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

interface VoucherRow {
  code: string;
  type: DiscountType;
  value: number;
  min_order: number | null;
  active: boolean;
  usage_limit: number | null;
  used_count: number;
  description: string | null;
}

function fromRow(row: VoucherRow): Voucher {
  return {
    code: row.code,
    type: row.type,
    value: Number(row.value),
    minOrder: row.min_order ?? undefined,
    active: row.active,
    usageLimit: row.usage_limit ?? undefined,
    usedCount: row.used_count ?? 0,
    description: row.description ?? undefined,
  };
}

function toRow(voucher: Voucher) {
  return {
    code: voucher.code.toUpperCase(),
    type: voucher.type,
    value: voucher.value,
    min_order: voucher.minOrder ?? null,
    active: voucher.active,
    usage_limit: voucher.usageLimit ?? null,
    used_count: voucher.usedCount,
    description: voucher.description ?? null,
  };
}

export const VoucherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vouchers, setVouchers] = useState<Voucher[]>(DEFAULT_VOUCHERS);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(loadApplied);
  const [cartTotalSnapshot, setCartTotalSnapshot] = useState(0);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    loadVouchers();

    const channel = supabase
      .channel("vouchers-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: COLLECTION }, loadVouchers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const loadVouchers = async () => {
    const { data, error } = await supabase.from(COLLECTION).select("*").order("code");

    if (error) {
      console.error("[VoucherContext] Supabase error:", error);
      setVouchers(DEFAULT_VOUCHERS);
      return;
    }

    if (!data || data.length === 0) {
      if (isAdmin) {
        await seedDefaults();
      } else {
        setVouchers(DEFAULT_VOUCHERS);
      }
      return;
    }

    setVouchers((data as VoucherRow[]).map(fromRow));
  };

  const seedDefaults = async () => {
    try {
      const { error } = await supabase.from(COLLECTION).upsert(DEFAULT_VOUCHERS.map(toRow));
      if (error) throw error;
      setVouchers(DEFAULT_VOUCHERS);
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
      const { error } = await supabase.from(COLLECTION).upsert(toRow(v));
      if (error) throw error;
    } catch (err) {
      console.error("[VoucherContext] addVoucher failed:", err);
    }
  };

  const updateVoucher = async (v: Voucher) => {
    try {
      const { error } = await supabase.from(COLLECTION).upsert(toRow(v));
      if (error) throw error;
    } catch (err) {
      console.error("[VoucherContext] updateVoucher failed:", err);
    }
  };

  const deleteVoucher = async (code: string) => {
    try {
      const { error } = await supabase.from(COLLECTION).delete().eq("code", code);
      if (error) throw error;
      if (appliedVoucher?.code === code) setAppliedVoucher(null);
    } catch (err) {
      console.error("[VoucherContext] deleteVoucher failed:", err);
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
