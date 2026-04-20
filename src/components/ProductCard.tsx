import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { Product } from "../types";
import { useFavourites } from "../FavouriteContext";

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  const { toggleFavourite, isFavourite } = useFavourites();
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
          <span className="absolute top-4 left-4 bg-nike-white text-nike-black text-[10px] font-black uppercase px-2 py-1 tracking-widest pointer-events-none">
            New
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavourite(product.id); }}
          className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full transition-colors z-10 opacity-0 group-hover:opacity-100 sm:opacity-100"
        >
          <Heart size={16} className={isFavourite(product.id) ? "fill-red-500 text-red-500" : "text-nike-black"} />
        </button>
      </Link>
      <div className="mt-4 space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-extrabold uppercase tracking-tighter group-hover:underline">
            <Link to={`/product/${product.id}`}>{product.name}</Link>
          </h3>
          <p className="text-sm font-semibold">৳{product.price.toLocaleString()}</p>
        </div>
        <p className="text-xs text-nike-muted font-medium uppercase">{product.category}</p>
        {product.scarcityMessage && (
          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">
            {product.scarcityMessage}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
