/**
 * EmailJS order notification service.
 * Sends a formatted order email to the admin when a customer places an order.
 * Keys come from VITE_ environment variables.
 */

import emailjs from "@emailjs/browser";
import type { Order } from "./OrderContext";

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  ?? "";
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? "";
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  ?? "";
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL          ?? "";

export async function sendOrderNotification(order: Order): Promise<void> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("[EmailJS] Skipping — env vars not configured.");
    return;
  }

  const itemsList = order.items
    .map(
      (item) =>
        `${item.name} | Size: ${item.selectedSize} | Color: ${item.selectedColor} | Qty: ${item.quantity} | ৳${(item.price * item.quantity).toLocaleString()}`
    )
    .join("\n");

  const templateParams = {
    to_email:       ADMIN_EMAIL,
    order_id:       order.id,
    order_date:     new Date(order.createdAt).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" }),
    customer_name:  `${order.customer.firstName} ${order.customer.lastName}`,
    customer_email: order.customer.email ?? "—",
    customer_phone: order.customer.phone ?? "—",
    address:        [
      order.customer.address1,
      order.customer.address2,
      order.customer.city,
      order.customer.postalCode,
    ]
      .filter(Boolean)
      .join(", "),
    payment_method: "bKash",
    transaction_id: order.transactionId ?? "Not provided",
    voucher_code:   order.voucherCode ?? "None",
    items_list:     itemsList,
    subtotal:       `৳${order.subtotal.toLocaleString()}`,
    shipping:       `৳${order.shipping.toLocaleString()}`,
    discount:       order.discount > 0 ? `−৳${order.discount.toLocaleString()}` : "—",
    total:          `৳${order.total.toLocaleString()}`,
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
  } catch (err) {
    console.error("[EmailJS] Failed to send order notification:", err);
    // Non-fatal - order is already saved to Supabase
  }
}
