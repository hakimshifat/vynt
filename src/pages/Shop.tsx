import React, { useState } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useProducts } from "../ProductContext";
import ProductCard from "../components/ProductCard";

const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const { products } = useProducts();

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-2xl font-black uppercase tracking-tighter">
          {selectedCategory} ({filteredProducts.length})
        </h1>
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center text-sm font-bold uppercase tracking-widest hover:text-nike-black/60 transition-colors"
          >
            {isFilterOpen ? "Hide Filters" : "Show Filters"} <Filter size={16} className="ml-2" />
          </button>
          <button className="flex items-center text-sm font-bold uppercase tracking-widest hover:text-nike-black/60 transition-colors">
            Sort By <ChevronDown size={16} className="ml-2" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar Filters */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full md:w-64 space-y-8"
            >
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest">Categories</h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`block text-sm font-medium transition-colors hover:text-nike-black ${
                        selectedCategory === cat ? "text-nike-black font-bold" : "text-nike-black/60"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-nike-black/5">
                <h3 className="text-sm font-black uppercase tracking-widest">Shop By Price</h3>
                <div className="space-y-2">
                  {["Under ৳5,000", "৳5,000 - ৳10,000", "৳10,000 - ৳15,000", "Over ৳15,000"].map(price => (
                    <label key={price} className="flex items-center space-x-3 cursor-pointer group">
                      <div className="w-5 h-5 border-2 border-nike-black/20 rounded group-hover:border-nike-black transition-colors" />
                      <span className="text-sm font-medium text-nike-black/60 group-hover:text-nike-black">{price}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Removed Color Filter */}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div className="flex-grow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
