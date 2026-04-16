import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ShoppingBag, ChevronRight, Star } from "lucide-react";
import { motion } from "motion/react";
import { PRODUCTS } from "../constants";
import { useCart } from "../CartContext";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const product = PRODUCTS.find(p => p.id === id);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(product?.colors[0] || "");
  const [activeImage, setActiveImage] = useState(product?.image || "");
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (product) setActiveImage(product.image);
  }, [product?.id]);

  if (!product) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Product Not Found</h1>
        <Link to="/shop" className="text-sm font-bold uppercase tracking-widest underline">Back to Shop</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      setError("Please select a size");
      return;
    }
    setError("");
    addToCart(product, selectedSize, selectedColor);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-nike-black/40 mb-12">
        <Link to="/shop" className="hover:text-nike-black transition-colors">Shop</Link>
        <ChevronRight size={10} />
        <span className="text-nike-black">{product.category}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-0 border border-nike-gray">
        {/* Image Gallery */}
        <div className="lg:w-[60%] flex flex-col border-r border-nike-gray">
          <div className="bg-nike-gray p-12 flex items-center justify-center relative overflow-hidden flex-grow">
            <div className="text-bg-giant opacity-[0.05]">AIRMAX</div>
            <div className="relative z-10 w-full max-w-lg aspect-square">
              <img 
                key={activeImage}
                src={activeImage || product.image} 
                alt={product.name} 
                className="w-full h-full object-cover filter drop-shadow-[0_40px_60px_rgba(0,0,0,0.1)] animate-in fade-in duration-500" 
                referrerPolicy="no-referrer" 
              />
            </div>
          </div>
          {/* Thumbnails */}
          {product.gallery && product.gallery.length > 0 && (
            <div className="flex gap-4 p-6 bg-nike-white overflow-x-auto no-scrollbar border-t border-nike-gray">
              {[product.image, ...product.gallery].map((imgUrl, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-24 h-24 flex-shrink-0 bg-nike-gray border-2 transition-all ${
                    (activeImage || product.image) === imgUrl ? 'border-nike-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100 hover:border-nike-gray'
                  }`}
                >
                  <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={`thumbnail ${i}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="lg:w-[40%] p-12 flex flex-col justify-between border-l border-nike-gray">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-sm font-medium text-nike-black uppercase">Sustainable Materials</p>
              <h1 className="text-4xl font-extrabold uppercase tracking-tighter leading-none">{product.name}</h1>
              <p className="text-lg font-semibold mt-2">${product.price}.00</p>
            </div>

            <div className="description">
              <p className="text-sm leading-relaxed text-nike-muted">
                Taking inspiration from its predecessor, the Air Max Pulse Roam is all about performance meeting the street. Durable, textile-wrapped midsole and vacuum-sealed accents keep the look fresh.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Color Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest">Select Color</h3>
            <div className="flex flex-wrap gap-3">
              {product.colors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                    selectedColor === color ? "border-nike-black bg-nike-black text-nike-white" : "border-nike-black/10 hover:border-nike-black/40"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold uppercase">Select Size</h3>
              <button className="text-sm text-nike-muted hover:text-nike-black transition-colors">Size Guide</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`h-[48px] flex items-center justify-center text-sm border rounded transition-all ${
                    selectedSize === size ? "border-nike-black font-semibold" : "border-nike-gray hover:border-nike-muted"
                  }`}
                >
                  US {size}
                </button>
              ))}
            </div>
            {error && <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleAddToCart}
              className="btn-bold w-full bg-nike-black text-nike-white hover:bg-nike-black/80"
            >
              Add to Bag
            </button>
            <button className="btn-bold w-full border-1.5 border-nike-black/20 text-nike-black hover:border-nike-black">
              Favourite ♡
            </button>
          </div>

          {/* Description */}
          <div className="pt-8 border-t border-nike-black/5 space-y-4">
            <p className="text-sm leading-relaxed text-nike-black/80">{product.description}</p>
            <ul className="text-xs font-bold uppercase tracking-widest space-y-2 list-disc pl-4">
              <li>Shown: {selectedColor}</li>
              <li>Style: NK-{product.id}00-100</li>
            </ul>
          </div>

          {/* Shipping & Returns */}
          <div className="pt-8 border-t border-nike-black/5 space-y-4">
            <div className="flex justify-between items-center group cursor-pointer">
              <h3 className="text-sm font-black uppercase tracking-widest">Shipping & Returns</h3>
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
            <div className="flex justify-between items-center group cursor-pointer">
              <h3 className="text-sm font-black uppercase tracking-widest">Reviews (48)</h3>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4].map(i => <Star key={i} size={12} fill="currentColor" />)}
                <Star size={12} />
                <ChevronRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default ProductDetail;
