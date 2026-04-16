import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { PRODUCTS } from "../constants";
import ProductCard from "../components/ProductCard";

const Home = () => {
  const featuredProducts = PRODUCTS.filter(p => p.isFeatured);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] sm:h-[90vh] overflow-hidden flex items-center justify-center bg-nike-gray">
        <img 
          src="https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=2000" 
          alt="Hero Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 object-center pointer-events-none mix-blend-multiply transition-transform duration-[10s] hover:scale-105" 
          referrerPolicy="no-referrer"
        />
        <div className="text-bg-giant">AIRMAX</div>
        <div className="relative z-10 text-center space-y-6 px-4">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-nike-black text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter uppercase leading-[0.8]"
          >
            Nike Air <br />
            Pulse Roam
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-nike-muted text-sm sm:text-lg font-medium max-w-xl mx-auto uppercase tracking-widest"
          >
            Sustainable Materials. Performance meeting the street.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/shop"
              className="btn-bold bg-nike-black text-nike-white px-12 hover:bg-nike-black/80 w-full sm:w-auto"
            >
              Add to Bag
            </Link>
            <Link
              to="/shop"
              className="btn-bold border-1.5 border-nike-black/20 text-nike-black px-12 hover:border-nike-black w-full sm:w-auto"
            >
              Favourite ♡
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-nike-black/40">The Latest</p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">Featured Drops</h2>
          </div>
          <Link to="/shop" className="flex items-center text-sm font-bold uppercase tracking-widest hover:underline group">
            Shop All <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* Full Width Banner */}
      <section className="relative h-[60vh] overflow-hidden group cursor-pointer">
        <img
          src="https://images.unsplash.com/photo-1514444917591-1aa748c18b3a?auto=format&fit=crop&q=80&w=2000"
          alt="Banner"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-nike-black/80 via-transparent to-transparent flex flex-col justify-end p-8 sm:p-16 space-y-4">
          <h2 className="text-nike-white text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none">
            Jordan <br /> Essentials
          </h2>
          <p className="text-nike-white/80 text-sm font-medium uppercase tracking-widest">
            The season's must-have styles.
          </p>
          <div>
            <Link
              to="/shop"
              className="inline-block bg-nike-white text-nike-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-nike-accent transition-colors"
            >
              Shop Jordan
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Sneakers", img: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=1000" },
            { name: "Running", img: "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&q=80&w=1000" },
          ].map((cat, i) => (
            <Link key={cat.name} to="/shop" className="relative h-[400px] overflow-hidden group">
              <img
                src={cat.img}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-nike-black/20 group-hover:bg-nike-black/40 transition-colors flex items-end p-8">
                <span className="bg-nike-white text-nike-black px-6 py-2 rounded-full font-bold uppercase tracking-widest">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
