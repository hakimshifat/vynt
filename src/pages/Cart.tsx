import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight, Tag, X, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../CartContext";
import { useVouchers } from "../VoucherContext";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { appliedVoucher, discountAmount, applyCode, removeApplied } = useVouchers();

  const [codeInput, setCodeInput] = useState("");
  const [voucherMsg, setVoucherMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [applying, setApplying] = useState(false);

  const shipping = 800;
  const tax = 1200;
  const discount = appliedVoucher
    ? (appliedVoucher.type === "percent"
        ? Math.round((cartTotal * appliedVoucher.value) / 100)
        : Math.min(appliedVoucher.value, cartTotal))
    : 0;
  const finalTotal = cartTotal + shipping + tax - discount;

  const handleApply = () => {
    if (!codeInput.trim()) return;
    setApplying(true);
    const result = applyCode(codeInput, cartTotal);
    setVoucherMsg({ text: result.message, ok: result.success });
    if (result.success) setCodeInput("");
    setApplying(false);
    setTimeout(() => setVoucherMsg(null), 4000);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center space-y-6">
        <h1 className="text-4xl font-black uppercase tracking-tighter">Your Bag is Empty</h1>
        <p className="text-sm font-medium text-nike-black/60 uppercase tracking-widest">
          There are no items in your bag.
        </p>
        <Link
          to="/shop"
          className="inline-block bg-nike-black text-nike-white px-12 py-4 rounded-full font-black uppercase tracking-widest hover:bg-nike-black/80 transition-colors"
        >
          Go Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-12">Bag</h1>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Cart Items */}
        <div className="lg:w-2/3 space-y-8">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex gap-6 pb-8 border-b border-nike-black/5"
              >
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-nike-gray overflow-hidden flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-grow space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm sm:text-lg font-black uppercase tracking-tight">{item.name}</h3>
                    <p className="text-sm sm:text-lg font-bold">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <p className="text-xs sm:text-sm text-nike-black/60 font-medium uppercase tracking-widest">{item.category}</p>
                  <p className="text-xs sm:text-sm text-nike-black/60 font-medium uppercase tracking-widest">
                    Size: {item.selectedSize} | Color: {item.selectedColor}
                  </p>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center border border-nike-black/10 rounded-full px-4 py-1 space-x-4">
                      <button
                        onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                        className="p-1 hover:text-nike-black/40 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                        className="p-1 hover:text-nike-black/40 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                      className="text-nike-black/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:w-1/3">
          <div className="bg-nike-gray/30 p-8 rounded-2xl space-y-6 sticky top-32 border border-nike-gray">
            <h2 className="text-xl font-black uppercase tracking-tighter">Summary</h2>

            {/* Voucher input */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-nike-black/40 flex items-center gap-1.5">
                <Tag size={10} /> Voucher Code
              </p>

              {appliedVoucher ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-green-700 uppercase tracking-wider">{appliedVoucher.code}</p>
                      <p className="text-[10px] text-green-600/80 font-medium">
                        {appliedVoucher.type === "percent"
                          ? `${appliedVoucher.value}% off`
                          : `৳${appliedVoucher.value.toLocaleString()} off`}
                        {" "}applied
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { removeApplied(); setVoucherMsg(null); }}
                    className="p-1 text-green-600/60 hover:text-red-500 transition-colors"
                    title="Remove voucher"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="voucher-input"
                    className="flex-grow px-4 py-2.5 border border-nike-black/10 rounded-xl text-sm focus:border-nike-black outline-none transition-colors font-medium uppercase tracking-widest placeholder-normal-case placeholder:normal-case placeholder:tracking-normal"
                    placeholder="Enter code"
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === "Enter") handleApply(); }}
                  />
                  <button
                    id="apply-voucher-btn"
                    onClick={handleApply}
                    disabled={applying}
                    className="px-4 py-2.5 bg-nike-black text-nike-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-nike-black/80 transition-colors shrink-0 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              )}

              {/* Voucher feedback */}
              <AnimatePresence>
                {voucherMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl ${
                      voucherMsg.ok
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}
                  >
                    {voucherMsg.ok
                      ? <CheckCircle2 size={13} />
                      : <AlertCircle size={13} />}
                    {voucherMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Totals */}
            <div className="space-y-3 text-sm font-medium uppercase">
              <div className="flex justify-between">
                <span className="text-nike-muted">Subtotal</span>
                <span className="font-semibold">৳{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nike-muted">Shipping</span>
                <span className="font-semibold">৳{shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nike-muted">Tax</span>
                <span className="font-semibold">৳{tax.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex justify-between text-green-700"
                >
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    Voucher ({appliedVoucher?.code})
                  </span>
                  <span className="font-black">−৳{discount.toLocaleString()}</span>
                </motion.div>
              )}
              <div className="pt-4 border-t border-nike-gray border-dashed flex justify-between text-lg font-black">
                <span>Total</span>
                <span>৳{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="btn-bold w-full bg-nike-black text-nike-white hover:bg-nike-black/80"
            >
              Checkout <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
