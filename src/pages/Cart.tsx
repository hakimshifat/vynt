import React from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../CartContext";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

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
                    <p className="text-sm sm:text-lg font-bold">${item.price * item.quantity}</p>
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
            <div className="space-y-4 text-sm font-medium uppercase">
              <div className="flex justify-between">
                <span className="text-nike-muted">Subtotal</span>
                <span className="font-semibold">${cartTotal}.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nike-muted">Estimated Shipping</span>
                <span className="font-semibold">$8.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nike-muted">Tax</span>
                <span className="font-semibold">$12.40</span>
              </div>
              <div className="pt-4 border-t border-nike-gray border-dashed flex justify-between text-lg font-black">
                <span>Total</span>
                <span>${cartTotal + 20.4}.00</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="btn-bold w-full bg-nike-black text-nike-white hover:bg-nike-black/80"
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
