/**
 * OrderContext — handles order creation, Firestore persistence, and admin reads.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { CartItem } from "./types";
import { sendOrderNotification } from "./emailService";

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
  paymentMethod: "bkash";
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

function generateOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VYNT-${ts}-${rand}`;
}

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Subscribe to orders, most recent first (admin use)
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded: Order[] = snap.docs.map((d) => d.data() as Order);
        setOrders(loaded);
        setOrdersLoading(false);
      },
      (err) => {
        console.error("[OrderContext] Firestore error:", err);
        setOrdersLoading(false);
      }
    );
    return unsub;
  }, []);

  const placeOrder = async (data: Omit<Order, "id" | "createdAt" | "status">): Promise<string> => {
    const id = generateOrderId();
    const order: Order = {
      ...data,
      id,
      createdAt: Date.now(),
      status: "pending",
    };

    // Write to Firestore
    await setDoc(doc(db, COLLECTION, id), order);

    // Send email notification (non-blocking, non-fatal)
    sendOrderNotification(order).catch(console.error);

    return id;
  };

  const updateOrderStatus = async (id: string, status: OrderStatus): Promise<void> => {
    try {
      await updateDoc(doc(db, COLLECTION, id), { status });
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
