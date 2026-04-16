import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative"
    >
      <Link to={`/product/${product.id}`} className="block overflow-hidden bg-nike-gray aspect-square relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        {product.isNew && (
          <span className="absolute top-4 left-4 bg-nike-white text-nike-black text-[10px] font-black uppercase px-2 py-1 tracking-widest">
            New
          </span>
        )}
      </Link>
      <div className="mt-4 space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-extrabold uppercase tracking-tighter group-hover:underline">
            <Link to={`/product/${product.id}`}>{product.name}</Link>
          </h3>
          <p className="text-sm font-semibold">৳{product.price.toLocaleString()}</p>
        </div>
        <p className="text-xs text-nike-muted font-medium uppercase">{product.category}</p>
      </div>
    </motion.div>
  );
};

export default ProductCard;
