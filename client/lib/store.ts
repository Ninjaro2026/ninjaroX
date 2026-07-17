export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageSrc: string;
  imageAlt: string;
  topBgColor: string;
  bottomBgColor: string;
  buttonTextColor: string;
  stock: number;
  isCombo?: boolean;
  comboItems?: { productId: string; quantity: number }[];
  mrp?: number;
  category?: string;
  showInStorefront?: boolean;
  priority?: number;
  isBestSeller?: boolean;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number; // total price for this quantity (unitPrice * quantity)
  img: string;
}

export interface Order {
  id: string;
  date: string;
  status: 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  total: number;
  items: OrderItem[];
  eta?: string;
  trackingStep: number;
  customerName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;
  shippingMethod?: string;
  isPOS?: boolean;
  posPaymentMode?: 'Cash' | 'Card' | 'UPI';
  posCustomerPhone?: string;
}

export interface CartItem {
  name: string;
  price: number;
  img: string;
  quantity: number;
}

export const DEFAULT_PRODUCTS: Product[] = [];

export const DEFAULT_ORDERS: Order[] = [];

export function getProductStock(product: Product, allProducts: Product[]): number {
  if (product.isCombo && product.comboItems) {
    let minStock = Infinity;
    product.comboItems.forEach(item => {
      const comp = allProducts.find(p => p.id === item.productId);
      if (comp) {
        const stockForCombo = Math.floor(comp.stock / item.quantity);
        if (stockForCombo < minStock) {
          minStock = stockForCombo;
        }
      } else {
        minStock = 0;
      }
    });
    return minStock === Infinity ? 0 : minStock;
  }
  return product.stock;
}

export function decrementProductStock(productId: string, quantity: number, allProducts: Product[]): Product[] {
  const target = allProducts.find(p => p.id === productId);
  if (!target) return allProducts;

  if (target.isCombo && target.comboItems) {
    return allProducts.map(p => {
      const comboItem = target.comboItems?.find(item => item.productId === p.id);
      if (comboItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - (comboItem.quantity * quantity))
        };
      }
      return p;
    });
  } else {
    return allProducts.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          stock: Math.max(0, p.stock - quantity)
        };
      }
      return p;
    });
  }
}

export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return DEFAULT_PRODUCTS;
  const stored = localStorage.getItem('nz_products');
  if (!stored) {
    localStorage.setItem('nz_products', JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nz_products', JSON.stringify(products));
  }
}

export function getStoredOrders(): Order[] {
  if (typeof window === 'undefined') return DEFAULT_ORDERS;
  const stored = localStorage.getItem('nz_orders');
  if (!stored) {
    localStorage.setItem('nz_orders', JSON.stringify(DEFAULT_ORDERS));
    return DEFAULT_ORDERS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_ORDERS;
  }
}

export function saveStoredOrders(orders: Order[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nz_orders', JSON.stringify(orders));
  }
}

export function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('nz_cart');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

export function saveStoredCart(cart: CartItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nz_cart', JSON.stringify(cart));
  }
}
