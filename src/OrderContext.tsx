/**
 * OrderContext - handles order creation, Supabase persistence, and admin reads.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";
import { CartItem } from "./types";
import { sendOrderNotification } from "./emailService";
import { useAdmin } from "./AdminContext";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered";

export interface OrderCustomer {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  postalCode: string;
}

export interface Order {
  id: string;
  createdAt: number; // Unix ms timestamp
  customer: OrderCustomer;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: "bkash" | "cod";
  transactionId?: string;  // bKash transaction code submitted by customer
  voucherCode?: string;
  status: OrderStatus;
}

interface OrderContextType {
  orders: Order[];
  ordersLoading: boolean;
  placeOrder: (data: Omit<Order, "id" | "createdAt" | "status">) => Promise<string>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);
const COLLECTION = "orders";

interface OrderRow {
  id: string;
  created_at_ms: number;
  customer: OrderCustomer;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment_method: "bkash" | "cod";
  transaction_id: string | null;
  voucher_code: string | null;
  status: OrderStatus;
}

function fromRow(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: Number(row.created_at_ms),
    customer: row.customer,
    items: row.items,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    discount: Number(row.discount),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    transactionId: row.transaction_id ?? undefined,
    voucherCode: row.voucher_code ?? undefined,
    status: row.status,
  };
}

function toRow(order: Order) {
  return {
    id: order.id,
    created_at_ms: order.createdAt,
    customer: order.customer,
    items: order.items,
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    payment_method: order.paymentMethod,
    transaction_id: order.transactionId ?? null,
    voucher_code: order.voucherCode ?? null,
    status: order.status,
  };
}

function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VYNT-${ts}-${rand}`;
}

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    if (!isAdmin) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    loadOrders();

    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: COLLECTION }, loadOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from(COLLECTION)
      .select("*")
      .order("created_at_ms", { ascending: false });

    if (error) {
      console.error("[OrderContext] Supabase error:", error);
      setOrdersLoading(false);
      return;
    }

    setOrders(((data ?? []) as OrderRow[]).map(fromRow));
    setOrdersLoading(false);
  };

  const placeOrder = async (data: Omit<Order, "id" | "createdAt" | "status">): Promise<string> => {
    const id = generateOrderId();
    const order: Order = {
      ...data,
      id,
      createdAt: Date.now(),
      status: "pending",
    };

    const { error } = await supabase.from(COLLECTION).insert(toRow(order));
    if (error) throw error;

    // Send email notification (non-blocking, non-fatal)
    sendOrderNotification(order).catch(console.error);

    return id;
  };

  const updateOrderStatus = async (id: string, status: OrderStatus): Promise<void> => {
    try {
      const { error } = await supabase.from(COLLECTION).update({ status }).eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("[OrderContext] updateOrderStatus failed:", err);
    }
  };

  return (
    <OrderContext.Provider value={{ orders, ordersLoading, placeOrder, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within an OrderProvider");
  return ctx;
};
