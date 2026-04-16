import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, CreditCard, Truck, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useCart } from "../CartContext";

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      clearCart();
      navigate("/");
    }, 3000);
  };

  if (isSuccess) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6 text-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12 }}
        >
          <CheckCircle size={80} className="text-nike-accent bg-nike-black rounded-full p-2" />
        </motion.div>
        <h1 className="text-4xl font-black uppercase tracking-tighter">Order Placed!</h1>
        <p className="text-sm font-medium text-nike-black/60 uppercase tracking-widest max-w-md">
          Thank you for your purchase. We've sent a confirmation email to your inbox.
        </p>
        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Redirecting to home...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-12">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Checkout Form */}
        <div className="lg:w-2/3">
          <form onSubmit={handlePlaceOrder} className="space-y-12">
            {/* Delivery Options */}
            <section className="space-y-6">
              <div className="flex items-center space-x-2">
                <Truck size={20} />
                <h2 className="text-xl font-black uppercase tracking-tighter">Delivery Options</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 border-2 border-nike-black rounded-xl space-y-2 cursor-pointer">
                  <p className="text-sm font-black uppercase tracking-widest">Standard Delivery</p>
                  <p className="text-xs text-nike-black/60 font-medium uppercase tracking-widest">Free | 3-5 Business Days</p>
                </div>
                <div className="p-6 border-2 border-nike-black/10 rounded-xl space-y-2 cursor-pointer hover:border-nike-black/40 transition-colors">
                  <p className="text-sm font-black uppercase tracking-widest">Express Delivery</p>
                  <p className="text-xs text-nike-black/60 font-medium uppercase tracking-widest">৳2,500 | 1-2 Business Days</p>
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tighter">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required placeholder="First Name" className="w-full px-6 py-4 border border-nike-black/10 rounded-xl text-sm focus:border-nike-black outline-none transition-colors" />
                <input required placeholder="Last Name" className="w-full px-6 py-4 border border-nike-black/10 rounded-xl text-sm focus:border-nike-black outline-none transition-colors" />
                <input required placeholder="Address Line 1" className="w-full px-6 py-4 border border-nike-black/10 rounded-xl text-sm focus:border-nike-black outline-none transition-colors sm:col-span-2" />
                <input placeholder="Address Line 2 (Optional)" className="w-full px-6 py-4 border border-nike-black/10 rounded-xl text-sm focus:border-nike-black outline-none transition-colors sm:col-span-2" />
                <input required placeholder="City" className="w-full px-6 py-4 border border-nike-black/10 rounded-xl text-sm focus:border-nike-black outline-none transition-colors" />
                <input required placeholder="Postal Code" className="w-full px-6 py-4 border border-nike-black/10 rounded-xl text-sm focus:border-nike-black outline-none transition-colors" />
              </div>
            </section>

            {/* Payment */}
            <section className="space-y-6">
              <div className="flex items-center space-x-2">
                <CreditCard size={20} />
                <h2 className="text-xl font-black uppercase tracking-tighter">Payment</h2>
              </div>
              <div className="space-y-4">
                {/* Card Option */}
                <div 
                  onClick={() => setPaymentMethod("card")}
                  className={`p-6 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${paymentMethod === "card" ? "border-nike-black" : "border-nike-black/10 hover:border-nike-black/40"}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-6 bg-nike-black rounded flex items-center justify-center text-[8px] text-nike-white font-bold">VISA</div>
                    <span className="text-sm font-bold uppercase tracking-widest">Credit or Debit Card</span>
                  </div>
                  <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${paymentMethod === "card" ? "border-nike-black" : "border-nike-black/20"}`}>
                    {paymentMethod === "card" && <div className="w-2 h-2 bg-nike-black rounded-full" />}
                  </div>
                </div>

                {/* bKash Option */}
                <div 
                  onClick={() => setPaymentMethod("bkash")}
                  className={`p-6 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${paymentMethod === "bkash" ? "border-[#e2136e]" : "border-nike-black/10 hover:border-nike-black/40"}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="px-3 py-1 bg-[#e2136e] rounded flex items-center justify-center text-[10px] text-white font-black tracking-widest">bKash</div>
                    <span className="text-sm font-bold uppercase tracking-widest">Pay with bKash</span>
                  </div>
                  <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${paymentMethod === "bkash" ? "border-[#e2136e]" : "border-nike-black/20"}`}>
                    {paymentMethod === "bkash" && <div className="w-2 h-2 bg-[#e2136e] rounded-full" />}
                  </div>
                </div>

                {paymentMethod === "card" ? (
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <input required placeholder="Card Number" className="w-full px-6 py-4 border border-nike-black/10 rounded-xl text-sm focus:border-nike-black outline-none transition-colors" />
                    <div className="grid grid-cols-2 gap-4">
                      <input required placeholder="MM/YY" className="w-full px-6 py-4 border border-nike-black/10 rounded-xl text-sm focus:border-nike-black outline-none transition-colors" />
                      <input required placeholder="CVV" className="w-full px-6 py-4 border border-nike-black/10 rounded-xl text-sm focus:border-nike-black outline-none transition-colors" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <input required placeholder="bKash Account Number" className="w-full px-6 py-4 border border-[#e2136e]/20 rounded-xl text-sm focus:border-[#e2136e] outline-none transition-colors" />
                  </div>
                )}
              </div>
            </section>

            <button
              type="submit"
              className="btn-bold w-full bg-nike-black text-nike-white hover:bg-nike-black/80"
            >
              Place Order
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-nike-gray/50 p-8 rounded-2xl space-y-6 sticky top-32">
            <h2 className="text-xl font-black uppercase tracking-tighter">Order Summary</h2>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4">
                  <div className="w-16 h-16 bg-nike-gray rounded overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-black uppercase tracking-tight">{item.name}</p>
                    <p className="text-[10px] text-nike-black/60 font-medium uppercase tracking-widest">Qty {item.quantity} | Size {item.selectedSize}</p>
                    <p className="text-xs font-bold mt-1">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-nike-black/10 space-y-2 text-sm font-medium uppercase tracking-widest">
              <div className="flex justify-between">
                <span className="text-nike-black/60">Subtotal</span>
                <span>৳{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nike-black/60">Shipping & Tax</span>
                <span>৳2,000</span>
              </div>
              <div className="pt-4 border-t border-nike-black/10 flex justify-between text-lg font-black">
                <span>Total</span>
                <span>৳{(cartTotal + 2000).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-nike-black/40 font-bold uppercase tracking-widest">
              <ShieldCheck size={14} />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
