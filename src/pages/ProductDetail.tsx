import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ShoppingBag, ChevronRight, Star } from "lucide-react";
import { motion } from "motion/react";
import { useProducts } from "../ProductContext";
import { useCart } from "../CartContext";
import { useFavourites } from "../FavouriteContext";
import SizeGuideModal from "../components/SizeGuideModal";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const product = products.find(p => p.id === id);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(product?.colors[0] || "");
  const [activeImage, setActiveImage] = useState(product?.image || "");
  const [error, setError] = useState("");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });

  const { toggleFavourite, isFavourite } = useFavourites();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setBgPos({ x, y });
  };

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
            <div className="relative z-10 w-full max-w-lg aspect-square group cursor-crosshair">
              <div
                className="absolute inset-0 overflow-hidden"
                onMouseMove={handleMouseMove}
              >
                <img
                  key={activeImage}
                  src={activeImage || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover filter drop-shadow-[0_40px_60px_rgba(0,0,0,0.1)] animate-in fade-in duration-500 transition-transform duration-[400ms] group-hover:scale-[1.8] ease-out transform-gpu pointer-events-none"
                  style={{ transformOrigin: `${bgPos.x}% ${bgPos.y}%` }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
          {/* Thumbnails */}
          {product.gallery && product.gallery.length > 0 && (
            <div className="flex gap-4 p-6 bg-nike-white overflow-x-auto no-scrollbar border-t border-nike-gray">
              {[product.image, ...product.gallery.filter(g => g !== product.image)].map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-24 h-24 flex-shrink-0 bg-nike-gray border-2 transition-all ${(activeImage || product.image) === imgUrl ? 'border-nike-black opacity-100' : 'border-transparent opacity-60 hover:opacity-100 hover:border-nike-gray'
                    }`}
                >
                  <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={`thumbnail ${i}`}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
              <p className="text-lg font-semibold mt-2">৳{product.price.toLocaleString()}</p>
            </div>

            <div className="space-y-4">
              {product.subtitle && (
                <div className="description">
                  <p className="text-sm leading-relaxed text-nike-muted">
                    {product.subtitle}
                  </p>
                </div>
              )}
              {product.scarcityMessage && (
                <div className="bg-red-50 border border-red-100 text-red-600 font-bold text-[10px] uppercase tracking-widest py-1.5 px-3 rounded-md w-fit">
                  {product.scarcityMessage}
                </div>
              )}
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
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedColor === color ? "border-nike-black bg-nike-black text-nike-white" : "border-nike-black/10 hover:border-nike-black/40"
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
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-sm text-nike-muted hover:text-nike-black transition-colors underline"
                >
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-[48px] flex items-center justify-center text-sm border rounded transition-all ${selectedSize === size ? "border-nike-black font-semibold" : "border-nike-gray hover:border-nike-muted"
                      }`}
                  >
                    BD {size}
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
              <button
                onClick={() => toggleFavourite(product.id)}
                className={`btn-bold w-full border-1.5 transition-colors flex items-center justify-center gap-2 ${isFavourite(product.id) ? "bg-red-500 text-white border-red-500 hover:bg-red-600" : "border-nike-black/20 text-nike-black hover:border-nike-black"}`}
              >
                <Heart size={16} className={isFavourite(product.id) ? "fill-white" : ""} />
                {isFavourite(product.id) ? "Favourited" : "Favourite ♡"}
              </button>
              <a
                href="https://wa.me/8801922160036"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-bold w-full border-1.5 transition-colors flex items-center justify-center gap-2 bg-[#25D366] text-white border-[#25D366] hover:bg-[#1ebe57] hover:border-[#1ebe57]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Order Now: +8801922160036
              </a>
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

        <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
      </div>
    </div>
  );
};

export default ProductDetail;
