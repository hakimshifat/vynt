export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  colors: string[];
  sizes: string[];
  gallery?: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  subtitle?: string;
  scarcityMessage?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}
