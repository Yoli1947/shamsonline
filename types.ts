
export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  images?: string[];
  imageObjects?: {
    url: string;
    color?: string;
  }[];
  category: string;
  description: string;
  features?: string[];
  variants?: {
    id: string;
    size: string;
    color: string;
    color_code?: string;
    stock: number;
  }[];
  is_published?: boolean;
  is_active?: boolean;
  sort_order?: number;
  brandCardUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedColorCode?: string;
  variantId?: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
