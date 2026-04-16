/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from "react";
import { HashRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { ShoppingBag, Search, Menu, X, Instagram, Twitter, Facebook, Youtube } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CartProvider, useCart } from "./CartContext";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));

const Navbar = () => {
  const { cartCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-nike-white border-b border-nike-gray h-[60px] flex items-center">
      <div className="max-w-7xl mx-auto px-12 w-full">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-black tracking-tighter uppercase">
            NIKE
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-6 items-center">
            {["Men", "Women", "Kids", "Sale", "Custom"].map((item) => (
              <Link
                key={item}
                to="/shop"
                className="text-sm font-medium hover:text-nike-muted transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button className="p-2 hover:bg-nike-gray rounded-full transition-colors">
              <Search size={20} />
            </button>
            <Link to="/cart" className="p-2 hover:bg-nike-gray rounded-full transition-colors relative">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-nike-black text-nike-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-nike-gray rounded-full transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-nike-white border-b border-nike-black/5 px-4 pt-2 pb-6"
          >
            {["New Drops", "Men", "Women", "Kids", "Sale"].map((item) => (
              <Link
                key={item}
                to="/shop"
                onClick={() => setIsMenuOpen(false)}
                className="block py-3 text-lg font-bold uppercase tracking-widest border-b border-nike-black/5"
              >
                {item}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-nike-black text-nike-white pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest">Find a Store</h4>
          <h4 className="text-xs font-black uppercase tracking-widest">Become a Member</h4>
          <h4 className="text-xs font-black uppercase tracking-widest">Send Us Feedback</h4>
        </div>
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest">Get Help</h4>
          <ul className="text-xs text-nike-white/60 space-y-2">
            <li>Order Status</li>
            <li>Shipping & Delivery</li>
            <li>Returns</li>
            <li>Payment Options</li>
            <li>Contact Us</li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest">About Nike</h4>
          <ul className="text-xs text-nike-white/60 space-y-2">
            <li>News</li>
            <li>Careers</li>
            <li>Investors</li>
            <li>Sustainability</li>
          </ul>
        </div>
        <div className="flex flex-wrap justify-start md:justify-end gap-4">
          <Twitter size={20} className="text-nike-white/60 hover:text-nike-white cursor-pointer" />
          <Facebook size={20} className="text-nike-white/60 hover:text-nike-white cursor-pointer" />
          <Youtube size={20} className="text-nike-white/60 hover:text-nike-white cursor-pointer" />
          <Instagram size={20} className="text-nike-white/60 hover:text-nike-white cursor-pointer" />
        </div>
      </div>
      <div className="pt-8 border-t border-nike-white/10 flex flex-col md:flex-row justify-between items-center text-[10px] text-nike-white/40 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <span className="text-nike-white">© 2024 Nike, Inc. All Rights Reserved</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 md:mt-0">
          <span>Guides</span>
          <span>Terms of Sale</span>
          <span>Terms of Use</span>
          <span>Nike Privacy Policy</span>
        </div>
      </div>
    </div>
  </footer>
);

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

export default function App() {
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow pt-[60px]">
            <Suspense fallback={
              <div className="h-screen w-full flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-nike-black border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                  <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
                  <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
                  <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
                  <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}
