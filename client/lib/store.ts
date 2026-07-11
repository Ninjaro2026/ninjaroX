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
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number; // total price for this item (unitPrice * quantity)
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

export const DEFAULT_PRODUCTS: Product[] = [
  // 20gm Pouch (5pc Jar) section
  {
    id: 'prod-1',
    name: 'Blue Lagoon (20gm Pouch)',
    description: 'Natural blueberry extracts, sparkling spring water, and a hint of wild lavender. Pack of 5 pouches.',
    price: 125,
    mrp: 150,
    category: '20gm Pouch (5pc Jar)',
    showInStorefront: true,
    priority: 1,
    imageSrc: '/blulagoonbox.png',
    imageAlt: 'blue lagoon pouch',
    topBgColor: 'bg-[#00485c]',
    bottomBgColor: 'bg-[#006884]',
    buttonTextColor: 'text-[#006884]',
    stock: 120
  },
  {
    id: 'prod-2',
    name: 'Virgin Mojito (20gm Pouch)',
    description: 'Fresh garden mint, hand-squeezed lime, and artisanal agave nectar syrup. Pack of 5 pouches.',
    price: 125,
    mrp: 150,
    category: '20gm Pouch (5pc Jar)',
    showInStorefront: true,
    priority: 2,
    imageSrc: '/virginmojitobox.png',
    imageAlt: 'virgin mojito pouch',
    topBgColor: 'bg-[#1b8858]',
    bottomBgColor: 'bg-[#25b07a]',
    buttonTextColor: 'text-[#2fd696]',
    stock: 95
  },
  {
    id: 'prod-3',
    name: 'Green Mango (20gm Pouch)',
    description: 'Real citrus pulp, unripe mango nectar, and a whisper of Himalayan salt. Pack of 5 pouches.',
    price: 125,
    mrp: 150,
    category: '20gm Pouch (5pc Jar)',
    showInStorefront: true,
    priority: 3,
    imageSrc: '/greentangbox.png',
    imageAlt: 'green mango pouch',
    topBgColor: 'bg-[#004930]',
    bottomBgColor: 'bg-[#00704a]',
    buttonTextColor: 'text-[#00704a]',
    stock: 110
  },
  {
    id: 'prod-4',
    name: 'Orange Tang (20gm Pouch)',
    description: 'Blood orange concentrate, cold-pressed ginger, and sparkling tangerine water. Pack of 5 pouches.',
    price: 125,
    mrp: 150,
    category: '20gm Pouch (5pc Jar)',
    showInStorefront: true,
    priority: 4,
    imageSrc: '/orangetangbox.png',
    imageAlt: 'orange tang pouch',
    topBgColor: 'bg-[#ff9500]',
    bottomBgColor: 'bg-[#e87903]',
    buttonTextColor: 'text-[#ff9500]',
    stock: 80
  },
  {
    id: 'combo-1',
    name: '4in One Combo (20gm)',
    description: 'Perfect 4-in-1 pack of 20gm mocktail premixes. Try all flavors in one single box!',
    price: 399,
    mrp: 600,
    category: '20gm Pouch (5pc Jar)',
    showInStorefront: true,
    priority: 0,
    imageSrc: '/blulagoonbox.png',
    imageAlt: '4in One Combo box',
    topBgColor: 'bg-[#00485c]',
    bottomBgColor: 'bg-[#e87903]',
    buttonTextColor: 'text-[#006884]',
    stock: 0,
    isCombo: true,
    comboItems: [
      { productId: 'prod-1', quantity: 1 },
      { productId: 'prod-2', quantity: 1 },
      { productId: 'prod-3', quantity: 1 },
      { productId: 'prod-4', quantity: 1 }
    ]
  },
  // Jar 500gm section
  {
    id: 'prod-5',
    name: 'Blue Lagoon (500gm Jar)',
    description: 'Natural blueberry extracts, sparkling spring water, and wild lavender in a bulk 500gm jar.',
    price: 399,
    mrp: 499,
    category: 'Jar 500gm',
    showInStorefront: true,
    priority: 5,
    imageSrc: '/blulagoonbox.png',
    imageAlt: 'blue lagoon 500g jar',
    topBgColor: 'bg-[#00485c]',
    bottomBgColor: 'bg-[#006884]',
    buttonTextColor: 'text-[#006884]',
    stock: 50
  },
  {
    id: 'prod-6',
    name: 'Virgin Mojito (500gm Jar)',
    description: 'Fresh garden mint, hand-squeezed lime, and agave nectar syrup in a bulk 500gm jar.',
    price: 399,
    mrp: 499,
    category: 'Jar 500gm',
    showInStorefront: true,
    priority: 6,
    imageSrc: '/virginmojitobox.png',
    imageAlt: 'virgin mojito 500g jar',
    topBgColor: 'bg-[#1b8858]',
    bottomBgColor: 'bg-[#25b07a]',
    buttonTextColor: 'text-[#2fd696]',
    stock: 40
  },
  {
    id: 'prod-7',
    name: 'Green Mango (500gm Jar)',
    description: 'Real citrus pulp, unripe mango nectar, and a whisper of Himalayan salt in a bulk 500gm jar.',
    price: 399,
    mrp: 499,
    category: 'Jar 500gm',
    showInStorefront: true,
    priority: 7,
    imageSrc: '/greentangbox.png',
    imageAlt: 'green mango 500g jar',
    topBgColor: 'bg-[#004930]',
    bottomBgColor: 'bg-[#00704a]',
    buttonTextColor: 'text-[#00704a]',
    stock: 35
  },
  {
    id: 'prod-8',
    name: 'Orange Tang (500gm Jar)',
    description: 'Blood orange concentrate, cold-pressed ginger, and sparkling tangerine in a bulk 500gm jar.',
    price: 399,
    mrp: 499,
    category: 'Jar 500gm',
    showInStorefront: true,
    priority: 8,
    imageSrc: '/orangetangbox.png',
    imageAlt: 'orange tang 500g jar',
    topBgColor: 'bg-[#ff9500]',
    bottomBgColor: 'bg-[#e87903]',
    buttonTextColor: 'text-[#ff9500]',
    stock: 30
  }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'NZ-9942',
    date: 'Oct 26, 2026',
    status: 'Out for Delivery',
    total: 1998,
    eta: 'Today, 4:30 PM',
    trackingStep: 3,
    customerName: 'James T.',
    shippingAddress: '456 Mixology Tower, BKC',
    shippingCity: 'Mumbai',
    shippingZip: '400051',
    shippingMethod: 'express',
    items: [
      { name: 'Blue Lagoon', quantity: 2, price: 1332, img: '/blulagoonbox.png' },
      { name: 'Orange Tang', quantity: 1, price: 666, img: '/orangetangbox.png' }
    ]
  },
  {
    id: 'NZ-8821',
    date: 'Oct 12, 2026',
    status: 'Delivered',
    total: 666,
    trackingStep: 4,
    customerName: 'Elena R.',
    shippingAddress: '123 Botanical Avenue',
    shippingCity: 'Mumbai',
    shippingZip: '400001',
    shippingMethod: 'standard',
    items: [{ name: 'Green Mango', quantity: 1, price: 666, img: '/greentangbox.png' }]
  },
  {
    id: 'NZ-7740',
    date: 'Sep 28, 2026',
    status: 'Delivered',
    total: 2664,
    trackingStep: 4,
    customerName: 'Sarah L.',
    shippingAddress: '789 Lifestyle Boulevard',
    shippingCity: 'Delhi',
    shippingZip: '110001',
    shippingMethod: 'standard',
    items: [
      { name: 'Blue Lagoon', quantity: 2, price: 1332, img: '/blulagoonbox.png' },
      { name: 'Virgin Mojito', quantity: 2, price: 1332, img: '/virginmojitobox.png' }
    ]
  }
];

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
  if (!stored || !stored.includes('"category"')) {
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
