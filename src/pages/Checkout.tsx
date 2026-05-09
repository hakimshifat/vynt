import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Truck,
  ShieldCheck,
  Tag,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Copy,
  Check,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../CartContext";
import { useVouchers } from "../VoucherContext";
import { useOrders } from "../OrderContext";
import { useShipping } from "../ShippingContext";

// ─── CONTACT / BKASH INFO ─────────────────────────────────────────────────────
const BKASH_NUMBER    = "01922160036";
const CONTACT_PHONE   = "01922160036";
const CONTACT_WHATSAPP = "8801922160036";
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  transactionId: string;
}

const EMPTY_FORM: FormState = {
  firstName: "", lastName: "", email: "", phone: "",
  address1: "", address2: "", city: "", postalCode: "",
  transactionId: "",
};

const inputClass =
  "w-full px-5 py-4 border border-nike-black/10 rounded-xl text-sm focus:border-[#e2136e] outline-none transition-colors bg-white";

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { appliedVoucher, removeApplied } = useVouchers();
  const { placeOrder } = useOrders();
  const navigate = useNavigate();

  const { shipping: shippingConfig } = useShipping();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash">("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [deliveryZone, setDeliveryZone] = useState<"insideDhaka" | "outsideDhaka">("insideDhaka");

  const shipping = deliveryZone === "insideDhaka" ? shippingConfig.insideDhaka : shippingConfig.outsideDhaka;
  const discount = appliedVoucher
    ? appliedVoucher.type === "percent"
      ? Math.round((cartTotal * appliedVoucher.value) / 100)
      : Math.min(appliedVoucher.value, cartTotal)
    : 0;
  const total = cartTotal + shipping - discount;

  const handleField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(BKASH_NUMBER).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (paymentMethod === "bkash" && !form.transactionId.trim()) {
      setError("Please enter your bKash Transaction ID before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      const orderPayload: any = {
        customer: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          address1: form.address1.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
        },
        items: cart,
        subtotal: cartTotal,
        shipping,
        discount,
        total,
        paymentMethod,
        transactionId: paymentMethod === "bkash" ? form.transactionId.trim() : undefined,
      };

      if (form.email.trim()) orderPayload.customer.email = form.email.trim();
      if (form.phone.trim()) orderPayload.customer.phone = form.phone.trim();
      if (form.address2.trim()) orderPayload.customer.address2 = form.address2.trim();
      if (appliedVoucher?.code) orderPayload.voucherCode = appliedVoucher.code;

      const id = await placeOrder(orderPayload);

      if (appliedVoucher) {
        removeApplied();
      }

      setOrderId(id);
      setTimeout(() => { clearCart(); navigate("/"); }, 5000);
    } catch (err) {
      console.error(err);
      setError("Something went wrong placing your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (orderId) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6 text-center px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
          <div className="w-24 h-24 bg-[#e2136e] rounded-full flex items-center justify-center shadow-2xl shadow-[#e2136e]/40">
            <CheckCircle size={48} className="text-white" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
          <h1 className="text-4xl font-black uppercase tracking-tighter">Order Confirmed!</h1>
          <p className="text-sm font-medium text-nike-black/60 uppercase tracking-widest max-w-sm">
            We've received your order. We'll confirm your bKash payment and reach out shortly.
          </p>
          <p className="text-xs font-mono bg-[#e2136e]/8 border border-[#e2136e]/20 px-5 py-3 rounded-xl inline-block">
            Order ID: <strong>{orderId}</strong>
          </p>
          <p className="text-xs text-nike-black/40 font-bold uppercase tracking-widest animate-pulse">
            Redirecting to home…
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-12">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* ── Form ────────────────────────────────────────────────────────── */}
        <div className="lg:w-2/3">
          <form onSubmit={handlePlaceOrder} className="space-y-10">

            {/* Delivery Zone */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Truck size={18} />
                <h2 className="text-lg font-black uppercase tracking-tighter">Delivery Zone</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryZone("insideDhaka")}
                  className={`p-5 border-2 rounded-xl flex items-center justify-between transition-all ${
                    deliveryZone === "insideDhaka"
                      ? "border-nike-black bg-nike-gray/30"
                      : "border-nike-black/10 hover:border-nike-black/30"
                  }`}
                >
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Inside Dhaka</p>
                    <p className="text-xs text-nike-black/50 font-medium uppercase tracking-widest mt-0.5">
                      ৳{shippingConfig.insideDhaka.toLocaleString()} · 1–2 Business Days
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    deliveryZone === "insideDhaka" ? "border-nike-black bg-nike-black" : "border-nike-black/20"
                  }`}>
                    {deliveryZone === "insideDhaka" && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryZone("outsideDhaka")}
                  className={`p-5 border-2 rounded-xl flex items-center justify-between transition-all ${
                    deliveryZone === "outsideDhaka"
                      ? "border-nike-black bg-nike-gray/30"
                      : "border-nike-black/10 hover:border-nike-black/30"
                  }`}
                >
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Outside Dhaka</p>
                    <p className="text-xs text-nike-black/50 font-medium uppercase tracking-widest mt-0.5">
                      ৳{shippingConfig.outsideDhaka.toLocaleString()} · 3–5 Business Days
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    deliveryZone === "outsideDhaka" ? "border-nike-black bg-nike-black" : "border-nike-black/20"
                  }`}>
                    {deliveryZone === "outsideDhaka" && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <h2 className="text-lg font-black uppercase tracking-tighter">Shipping Address</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required name="firstName" placeholder="First Name" value={form.firstName} onChange={handleField} className={inputClass} />
                <input required name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleField} className={inputClass} />
                <input required name="address1" placeholder="House / Road / Area" value={form.address1} onChange={handleField} className={`${inputClass} sm:col-span-2`} />
                <input name="address2" placeholder="Apartment / Landmark (Optional)" value={form.address2} onChange={handleField} className={`${inputClass} sm:col-span-2`} />
                <input required name="city" placeholder="City / District" value={form.city} onChange={handleField} className={inputClass} />
                <input required name="postalCode" placeholder="Postal Code" value={form.postalCode} onChange={handleField} className={inputClass} />
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone size={18} />
                <h2 className="text-lg font-black uppercase tracking-tighter">Contact</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative sm:col-span-2">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-nike-black/30" />
                  <input type="email" name="email" placeholder="Email (optional)" value={form.email} onChange={handleField} className={`${inputClass} pl-10`} />
                </div>
                <div className="relative sm:col-span-2">
                  <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-nike-black/30" />
                  <input required type="tel" name="phone" placeholder="Phone number (for delivery)" value={form.phone} onChange={handleField} className={`${inputClass} pl-10`} />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} />
                <h2 className="text-lg font-black uppercase tracking-tighter">Payment Method</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-5 border-2 rounded-xl flex items-center justify-between transition-all ${
                    paymentMethod === "cod"
                      ? "border-nike-black bg-nike-gray/30"
                      : "border-nike-black/10 hover:border-nike-black/30"
                  }`}
                >
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest">Cash on Delivery</p>
                    <p className="text-xs text-nike-black/50 font-medium uppercase tracking-widest mt-0.5">
                      Pay when you receive
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    paymentMethod === "cod" ? "border-nike-black bg-nike-black" : "border-nike-black/20"
                  }`}>
                    {paymentMethod === "cod" && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bkash")}
                  className={`p-5 border-2 rounded-xl flex items-center justify-between transition-all ${
                    paymentMethod === "bkash"
                      ? "border-nike-black bg-nike-gray/30"
                      : "border-nike-black/10 hover:border-nike-black/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-[#e2136e] flex items-center justify-center shrink-0">
                        <span className="text-[7px] text-white font-black">b</span>
                      </div>
                      <p className="text-sm font-black uppercase tracking-widest">bKash</p>
                    </div>
                    <p className="text-xs text-nike-black/50 font-medium uppercase tracking-widest mt-0.5">
                      Direct mobile payment
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    paymentMethod === "bkash" ? "border-nike-black bg-nike-black" : "border-nike-black/20"
                  }`}>
                    {paymentMethod === "bkash" && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              </div>

              {/* bKash Instructions card */}
              <AnimatePresence>
                {paymentMethod === "bkash" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#fff0f6] border border-[#e2136e]/20 rounded-2xl overflow-hidden mt-4">
                      <div className="bg-[#e2136e] px-5 py-3 flex items-center gap-2">
                        <span className="text-white font-black text-sm tracking-wide">How to Pay with bKash</span>
                      </div>
                      <div className="p-5 space-y-4">
                        <ol className="space-y-3 text-sm text-nike-black/80">
                          <li className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#e2136e] text-white text-xs font-black flex items-center justify-center shrink-0">1</span>
                            <span>Open your <strong>bKash app</strong> and tap <strong>Send Money</strong></span>
                          </li>
                          <li className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#e2136e] text-white text-xs font-black flex items-center justify-center shrink-0">2</span>
                            <div>
                              <span>Send <strong>৳{total.toLocaleString()}</strong> to our bKash number:</span>
                              <div className="mt-2 flex items-center gap-3">
                                <div className="flex-1 bg-white border-2 border-[#e2136e]/30 rounded-xl px-4 py-3 font-mono font-black text-base text-[#e2136e] tracking-widest select-all">
                                  {BKASH_NUMBER}
                                </div>
                                <button type="button" onClick={copyNumber}
                                  className="flex items-center gap-1.5 px-4 py-3 bg-[#e2136e] hover:bg-[#c4115f] text-white text-xs font-black rounded-xl transition-colors shrink-0">
                                  {copied ? <Check size={14} /> : <Copy size={14} />}
                                  {copied ? "Copied!" : "Copy"}
                                </button>
                              </div>
                            </div>
                          </li>
                          <li className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#e2136e] text-white text-xs font-black flex items-center justify-center shrink-0">3</span>
                            <span>Write your <strong>Order total amount</strong> in the reference if prompted</span>
                          </li>
                          <li className="flex gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#e2136e] text-white text-xs font-black flex items-center justify-center shrink-0">4</span>
                            <span>Copy the <strong>Transaction ID</strong> from your confirmation SMS and paste it below</span>
                          </li>
                        </ol>

                        {/* Transaction ID Input */}
                        <div className="space-y-2 pt-2">
                          <label className="text-xs font-black uppercase tracking-widest text-[#e2136e]">
                            bKash Transaction ID *
                          </label>
                          <input
                            required={paymentMethod === "bkash"}
                            name="transactionId"
                            placeholder="e.g. 8K3B2L9XYZ"
                            value={form.transactionId}
                            onChange={handleField}
                            className="w-full px-5 py-4 border-2 border-[#e2136e]/30 rounded-xl text-sm font-mono focus:border-[#e2136e] outline-none transition-colors bg-white placeholder-nike-black/20 uppercase"
                          />
                          <p className="text-[11px] text-nike-black/40 font-medium">
                            Found in your bKash SMS confirmation after sending payment.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alternative: Call us */}
              <div className="bg-nike-gray/40 border border-nike-black/8 rounded-2xl p-5 mt-4">
                <p className="text-xs font-black uppercase tracking-widest text-nike-black/50 mb-3">Prefer to order by phone?</p>
                <div className="flex flex-wrap gap-3">
                  <a href={`tel:${CONTACT_PHONE}`}
                    className="flex items-center gap-2 px-5 py-3 bg-nike-black text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-nike-black/80 transition-colors">
                    <Phone size={15} /> Call Us
                  </a>
                  <a href={`https://wa.me/${CONTACT_WHATSAPP}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 bg-[#25D366] text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-[#1ebe5d] transition-colors">
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                </div>
                <p className="text-[11px] text-nike-black/35 font-medium mt-3">
                  Call or message us directly and we'll take your order over the phone.
                </p>
              </div>
            </section>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isSubmitting || cart.length === 0}
              className="btn-bold w-full bg-[#e2136e] text-white hover:bg-[#c4115f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#e2136e]/30">
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Placing Order…</>
              ) : (
                "Confirm Order"
              )}
            </button>
          </form>
        </div>

        {/* ── Order Summary ──────────────────────────────────────────────── */}
        <div className="lg:w-1/3">
          <div className="bg-nike-gray/40 p-7 rounded-2xl space-y-5 sticky top-32 border border-nike-black/6">
            <h2 className="text-lg font-black uppercase tracking-tighter">Order Summary</h2>

            <div className="space-y-3">
              {cart.map(item => (
                <div key={`${item.id}-${item.selectedSize}`} className="flex gap-3">
                  <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-grow py-0.5">
                    <p className="text-xs font-black uppercase tracking-tight leading-tight">{item.name}</p>
                    <p className="text-[10px] text-nike-black/50 font-medium uppercase tracking-widest mt-0.5">
                      Qty {item.quantity} · Size {item.selectedSize}
                    </p>
                    <p className="text-xs font-black mt-1">
                      {item.discountedPrice && item.discountedPrice < item.price ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-[10px] font-medium text-nike-muted line-through">৳{(item.price * item.quantity).toLocaleString()}</span>
                          <span className="text-red-600">৳{(item.discountedPrice * item.quantity).toLocaleString()}</span>
                        </span>
                      ) : (
                        <>৳{((item.discountedPrice ?? item.price) * item.quantity).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-nike-black/8 space-y-2 text-sm font-medium">
              <div className="flex justify-between text-nike-black/60 uppercase tracking-widest">
                <span>Subtotal</span><span className="text-nike-black">৳{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-nike-black/60 uppercase tracking-widest">
                <span>Shipping</span><span className="text-nike-black">৳{shipping.toLocaleString()}</span>
              </div>
              <AnimatePresence>
                {discount > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="flex justify-between text-green-700 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Tag size={11} /> {appliedVoucher?.code}</span>
                    <span className="font-black">−৳{discount.toLocaleString()}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="pt-3 border-t border-nike-black/8 flex justify-between text-base font-black">
                <span>Total</span>
                <span className="text-[#e2136e]">৳{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-nike-black/35 font-bold uppercase tracking-widest pt-1">
              <ShieldCheck size={13} />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
