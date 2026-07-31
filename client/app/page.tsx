"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProductCard } from '../components/ProductCard';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getStoredProducts, getStoredCart, saveStoredCart, Product, getProductStock, DEFAULT_PRODUCTS } from '../lib/store';
import { AuthModal } from '../components/AuthModal';
import { fetchProducts, fetchTopOfferText, getLoggedInUser, logoutUser } from '../lib/api';
import { ProductCardSkeleton, StorefrontLoader } from '../components/Skeleton';

const REVIEWS = [
  {
    text: "Absolutely mind-blowing. The depth of flavor in the Green Mango is something I never thought possible from a premix.",
    author: "Anindita Roy",
    role: "Beverage Consultant & Mixologist"
  },
  {
    text: "The easiest way to impress guests. The Virgin Mojito tastes like it was just muddled at a high-end bar in Kolkata.",
    author: "Subhajit Mukherjee",
    role: "Event Host & Hospitality Partner"
  },
  {
    text: "I love the complex botanical notes. Blue Lagoon is not just a drink, it's an entire mood for summer parties.",
    author: "Priyanka Sengupta",
    role: "Lifestyle Blogger"
  }
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<{name: string, price: string, img: string, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentReview, setCurrentReview] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [topOfferText, setTopOfferText] = useState('🎁 Free Shipping Order Above ₹249 & Apply 5% Discount on Checkout');

  // Filter products by search query
  const visibleProducts = products
    .filter(p => p.showInStorefront !== false)
    .filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    });
  const categoryOrder = ["Combos", "20gm Pouch (5pc)", "Jar 500gm"];
  const isComboCategory = (cat: string) => cat === "Signature Combos" || cat === "Combos";
  const activeCategories = Array.from(new Set(visibleProducts.map(p => p.category || 'Uncategorized')));
  const sortedCategories = activeCategories.sort((a, b) => {
    const idxA = categoryOrder.indexOf(a);
    const idxB = categoryOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const getProductsByCategory = (cat: string) => {
    return visibleProducts
      .filter(p => (p.category || 'Uncategorized') === cat)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  };

  useEffect(() => {
    setIsMounted(true);
    setCurrentUser(getLoggedInUser());
    setIsLoadingProducts(true);

    fetchTopOfferText().then(text => {
      if (text) setTopOfferText(text);
    });

    fetchProducts()
      .then(data => {
        setProducts(data);
        localStorage.setItem('nz_products', JSON.stringify(data));
      })
      .catch(err => {
        console.warn('API error fetching products, using fallback localStorage products', err);
        setProducts(getStoredProducts());
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });

    const cart = getStoredCart();
    setCartItems(cart.map(c => ({
      name: c.name,
      price: `₹${c.price}/-`,
      img: c.img,
      quantity: c.quantity
    })));

    const timer = setInterval(() => {
      setCurrentReview(prev => (prev + 1) % REVIEWS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const addToCart = (item: {name: string, price: string, img: string}) => {
    const targetProduct = products.find(p => p.name === item.name);
    const availableStock = targetProduct ? getProductStock(targetProduct, products) : 999;
    
    setCartItems(prev => {
      const existing = prev.find(i => i.name === item.name);
      if (existing) {
        if (existing.quantity >= availableStock) {
          alert(`Sorry! Maximum available stock for ${item.name} is ${availableStock}.`);
          return prev;
        }
        const updated = prev.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i);
        saveStoredCart(updated.map(u => ({ name: u.name, price: parseInt(u.price.replace(/[^\d]/g, '')), img: u.img, quantity: u.quantity })));
        return updated;
      }
      if (availableStock < 1) {
        alert(`Sorry! ${item.name} is currently out of stock.`);
        return prev;
      }
      const updated = [...prev, { ...item, quantity: 1 }];
      saveStoredCart(updated.map(u => ({ name: u.name, price: parseInt(u.price.replace(/[^\d]/g, '')), img: u.img, quantity: u.quantity })));
      return updated;
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (name: string, delta: number) => {
    const targetProduct = products.find(p => p.name === name);
    const availableStock = targetProduct ? getProductStock(targetProduct, products) : 999;

    setCartItems(prev => {
      const existing = prev.find(i => i.name === name);
      if (existing && delta > 0 && existing.quantity >= availableStock) {
        alert(`Sorry! Maximum available stock for ${name} is ${availableStock}.`);
        return prev;
      }
      const updated = prev.map(item => {
        if (item.name === name) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as {name: string, price: string, img: string, quantity: number}[];

      saveStoredCart(updated.map(u => ({ name: u.name, price: parseInt(u.price.replace(/[^\d]/g, '')), img: u.img, quantity: u.quantity })));
      return updated;
    });
  };

  const getItemQuantity = (name: string) => {
    const item = cartItems.find(i => i.name === name);
    return item ? item.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-[#063326] text-slate-100 flex flex-col font-poppins selection:bg-emerald-500 selection:text-white">
      {/* Navigation */}
      <Navbar 
        totalCartItems={isMounted ? cartItems.reduce((acc, i) => acc + i.quantity, 0) : 0} 
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="w-full min-h-screen bg-white">
{/* Storefront Centered Promo Announcement Bar */}
<div id="storefront" className="w-full bg-white animate-fade-in">
  <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-12 pt-4 pb-2 text-center flex justify-center items-center">
    <div className="inline-flex bg-neutral-950 text-white text-[9px] sm:text-xs font-black uppercase px-4 py-2 rounded-sm shadow-xs tracking-wider items-center justify-center gap-1.5 select-none text-center">
      <span>{topOfferText}</span>
    </div>
  </div>
</div>
{isLoadingProducts ? (
  <section className="py-12 md:py-16 px-4 sm:px-6 md:px-12 font-poppins bg-white w-full">
    <div className="max-w-screen-2xl mx-auto space-y-8">
      <StorefrontLoader />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    </div>
  </section>
) : sortedCategories.map((category, catIdx) => {
  const catProducts = getProductsByCategory(category);
  if (catProducts.length === 0) return null;
  const sectionId = category.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return (
    <section 
      key={category} 
      className={`w-full pb-8 md:pb-12 px-4 sm:px-6 md:px-12 font-poppins ${catIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} ${
        catIdx === 0 
          ? 'pt-2 md:pt-3 border-t-0' 
          : 'pt-6 md:pt-8 border-t border-slate-100'
      }`} 
      id={sectionId}
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8 space-y-1.5 flex flex-col items-center justify-center">
          <h2 className="font-outfit font-bold text-lg sm:text-2xl md:text-3xl uppercase text-emerald-950 tracking-wide leading-none flex flex-wrap items-center justify-center gap-2 text-center">
            {isComboCategory(category) ? (
              <>
                <span>Special Offers</span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                  Best Value Deals
                </span>
              </>
            ) : (
              category
            )}
          </h2>
          <p className="text-emerald-900/70 text-xs sm:text-sm font-medium max-w-xl text-center mx-auto">
            {isComboCategory(category)
              ? "Exclusive curated packs & special value deals for true mocktail lovers."
              : category === "20gm Pouch (5pc)" 
              ? "Premium single-serving pouches designed for quick mixing." 
              : category === "Jar 500gm"
              ? "Bulk jars designed for heavy mixers, bars, and premium sharing." 
              : "Curated selections to shift your state."}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {catProducts.map((product) => {
            const priceStr = `₹${product.price}/-`;
            const mrpStr = product.mrp ? `₹${product.mrp}/-` : undefined;
            const stockVal = getProductStock(product, products.length > 0 ? products : DEFAULT_PRODUCTS);
            const comboImages = product.isCombo && product.comboItems && product.comboItems.length > 0
              ? product.comboItems.map(item => {
                  const comp = (products.length > 0 ? products : DEFAULT_PRODUCTS).find(p => p.id === item.productId);
                  return {
                    src: comp?.imageSrc || '/bluelagoonjar.jpeg',
                    count: item.quantity,
                    name: comp?.name || ''
                  };
                })
              : undefined;

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={priceStr}
                imageSrc={product.imageSrc}
                imageAlt={product.imageAlt}
                topBgColor={product.topBgColor}
                bottomBgColor={product.bottomBgColor}
                buttonTextColor={product.buttonTextColor}
                quantity={getItemQuantity(product.name)}
                stock={stockVal}
                mrp={mrpStr}
                isBestSeller={product.isBestSeller}
                customTag={product.customTag}
                tagPosition={product.tagPosition}
                tagColor={product.tagColor}
                isCombo={product.isCombo}
                comboImages={comboImages}
                onAddToCart={() => addToCart({ name: product.name, price: priceStr, img: product.imageSrc })}
                onUpdateQuantity={(delta) => updateQuantity(product.name, delta)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
})}



        <section id="ritual-section" className="w-full py-8 md:py-14 px-4 sm:px-6 md:px-12 bg-white relative overflow-hidden font-poppins">
  {/* Header */}
  <header className="max-w-4xl mx-auto text-center mb-8 md:mb-12 relative">
    <div className="absolute inset-0 bg-emerald-50/80 backdrop-blur-3xl rounded-3xl -z-10 transform -rotate-2 scale-105"></div>
    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest bg-emerald-900 text-white px-3.5 py-1 rounded-full shadow-xs mb-3 inline-block">
      ✨ Soo Easy To Make!
    </span>
    <h2 className="font-outfit font-bold text-2xl sm:text-3xl md:text-5xl tracking-wide text-emerald-950 mb-2 leading-tight uppercase">
      The 30-Second <br/>
      <span className="text-emerald-600 italic">Ritual</span>
    </h2>
    <p className="text-xs sm:text-sm text-emerald-900/70 max-w-xl mx-auto leading-relaxed font-medium">
      Transform any moment into an occasion. A meticulously crafted cafe-style experience requiring nothing more than water, powder, and 30 seconds.
    </p>

    {/* 4-Step Quick Infographic Bar */}
    <div className="mt-8 bg-emerald-900 text-white p-4 sm:p-6 rounded-3xl shadow-xl grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-emerald-800/80">
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-10 h-10 rounded-2xl bg-white text-emerald-950 font-black text-sm flex items-center justify-center shadow-md mb-2">01</div>
        <span className="text-xs font-black uppercase tracking-wider">Add 250-300ml</span>
        <span className="text-[10px] text-emerald-200 font-semibold mt-0.5">Soda or Water</span>
      </div>

      <div className="flex flex-col items-center text-center p-2 pt-4 md:pt-2">
        <div className="w-10 h-10 rounded-2xl bg-white text-emerald-950 font-black text-sm flex items-center justify-center shadow-md mb-2">02</div>
        <span className="text-xs font-black uppercase tracking-wider">Pouring 20g</span>
        <span className="text-[10px] text-emerald-200 font-semibold mt-0.5">Mocktail Powder</span>
      </div>

      <div className="flex flex-col items-center text-center p-2 pt-4 md:pt-2">
        <div className="w-10 h-10 rounded-2xl bg-white text-emerald-950 font-black text-sm flex items-center justify-center shadow-md mb-2">03</div>
        <span className="text-xs font-black uppercase tracking-wider">Mix It</span>
        <span className="text-[10px] text-emerald-200 font-semibold mt-0.5">Properly</span>
      </div>

      <div className="flex flex-col items-center text-center p-2 pt-4 md:pt-2">
        <div className="w-10 h-10 rounded-2xl bg-white text-emerald-950 font-black text-sm flex items-center justify-center shadow-md mb-2">04</div>
        <span className="text-xs font-black uppercase tracking-wider">Garnish</span>
        <span className="text-[10px] text-emerald-200 font-semibold mt-0.5">& Serve Fresh</span>
      </div>
    </div>
  </header>

  <div className="max-w-5xl mx-auto relative space-y-8 md:space-y-12">
    {/* Step 01 */}
    <article className="relative flex flex-col md:flex-row items-center gap-6 lg:gap-12">
      <div className="absolute -left-4 md:-left-12 top-0 md:-top-8 text-[4rem] md:text-[7rem] font-black text-emerald-50 select-none z-0 tracking-tighter">01</div>
      
      <div className="w-full md:w-5/12 relative z-10 group">
        <div className="aspect-4/3 rounded-3xl overflow-hidden shadow-lg relative max-w-xs mx-auto md:max-w-none">
          <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Add Soda / Water" src="/ninjaro jar banner.png" />
          <div className="absolute inset-0 bg-linear-to-tr from-emerald-900/20 to-transparent mix-blend-overlay"></div>
        </div>
        <div className="absolute -bottom-4 -right-4 bg-emerald-950 text-emerald-50 px-4 py-1.5 rounded-lg font-bold tracking-widest uppercase shadow-md transform rotate-2 z-20 text-xs">
          Hydration
        </div>
      </div>

      <div className="w-full md:w-7/12 relative z-10 md:pl-6">
        <div className="glass-panel bg-emerald-50/50 backdrop-blur-2xl rounded-3xl p-5 md:p-8 border border-emerald-900/5 shadow-md relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40"></div>
          <h3 className="text-xl sm:text-2xl font-black italic uppercase text-emerald-950 mb-2 tracking-tight">Add 250-300ml Soda / Water</h3>
          <div className="w-8 h-1 bg-emerald-500 rounded-full mb-3"></div>
          <p className="text-xs sm:text-sm text-emerald-900/70 leading-relaxed font-medium">
            Fill your glass with 250-300ml of chilled water or sparkling soda over crisp ice cubes. The clean base prepares the canvas for instant mocktail perfection.
          </p>
        </div>
      </div>
    </article>

    {/* Step 02 */}
    <article className="relative flex flex-col md:flex-row-reverse items-center gap-6 lg:gap-12">
      <div className="absolute -right-4 md:-right-12 top-0 md:-top-8 text-[4rem] md:text-[7rem] font-black text-emerald-50 select-none z-0 tracking-tighter">02</div>
      
      <div className="w-full md:w-5/12 relative z-10 group">
        <div className="aspect-4/3 rounded-3xl overflow-hidden shadow-lg relative ml-auto max-w-xs md:max-w-none">
          <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Pouring Powder" src="/ninjaro sassay img.png" />
          <div className="absolute inset-0 bg-linear-to-bl from-white/20 to-transparent"></div>
        </div>
        <div className="absolute -top-4 -left-4 bg-teal-800 text-teal-50 px-4 py-1.5 rounded-lg font-bold tracking-widest uppercase shadow-md transform -rotate-2 z-20 text-xs">
          Preparation
        </div>
      </div>

      <div className="w-full md:w-7/12 relative z-10 md:pr-6 text-left md:text-right flex flex-col md:items-end">
        <div className="bg-emerald-50 rounded-3xl p-5 md:p-8 relative overflow-hidden border border-emerald-900/5 shadow-md">
          <h3 className="text-xl sm:text-2xl font-black italic uppercase text-teal-900 mb-2 tracking-tight">Pouring 20g Powder</h3>
          <div className="w-8 h-1 bg-teal-500 rounded-full mb-3 md:ml-auto"></div>
          <p className="text-xs sm:text-sm text-emerald-900/70 leading-relaxed font-medium">
            Tear open a sachet or scoop 20g of Ninjaro zero-sugar mocktail premix powder. Pour into the glass and watch the botanical flavors activate instantly.
          </p>
        </div>
      </div>
    </article>

    {/* Step 03 */}
    <article className="relative flex flex-col md:flex-row items-center gap-6 lg:gap-12">
      <div className="absolute -left-4 md:-left-12 top-0 md:-top-8 text-[4rem] md:text-[7rem] font-black text-emerald-50 select-none z-0 tracking-tighter">03</div>
      
      <div className="w-full md:w-5/12 relative z-10 group">
        <div className="aspect-4/3 rounded-3xl overflow-hidden shadow-lg relative max-w-xs mx-auto md:max-w-none">
          <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Mix It Properly" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBa-e0nMC1kQCZ6A0KjUSmmtVZHhIul7iCWdYXT6FyBNJRN8D3cdJCKugiA0AdTCvQzloKX137MncG9WJJ8sRWc60JpleHZi9spS7dWQ_t6ojBXuAIiMMrPwptoGKhR5i3K9IJUVNaIj01Nf7v8HleuRhBXXNqJ5JdTdNXWysd21ogjrDl4gML-cACMgKvabqnmixVsLa_a0v9wReGQ6q4AjWO20cjkgE2GES0c22gMyvid1QRigmaeDWI5-lLYFwY3quSCdfWHhXvX" />
          <div className="absolute inset-0 bg-linear-to-tr from-emerald-900/20 to-transparent mix-blend-overlay"></div>
        </div>
        <div className="absolute -bottom-4 -right-4 bg-emerald-950 text-emerald-50 px-4 py-1.5 rounded-lg font-bold tracking-widest uppercase shadow-md transform rotate-2 z-20 text-xs">
          Mix & Dissolve
        </div>
      </div>

      <div className="w-full md:w-7/12 relative z-10 md:pl-6">
        <div className="glass-panel bg-emerald-50/50 backdrop-blur-2xl rounded-3xl p-5 md:p-8 border border-emerald-900/5 shadow-md relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40"></div>
          <h3 className="text-xl sm:text-2xl font-black italic uppercase text-emerald-950 mb-2 tracking-tight">Mix It Properly</h3>
          <div className="w-8 h-1 bg-emerald-500 rounded-full mb-3"></div>
          <p className="text-xs sm:text-sm text-emerald-900/70 leading-relaxed font-medium">
            Stir or shake vigorously for 10-15 seconds until the premix powder is completely dissolved into a vibrant, sparkling mocktail infusion.
          </p>
        </div>
      </div>
    </article>

    {/* Step 04 */}
    <article className="relative flex flex-col items-center max-w-3xl mx-auto text-center mt-4 md:mt-10">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[6rem] md:text-[10rem] font-black text-emerald-50 select-none z-0 tracking-tighter pointer-events-none">04</div>
      
      <div className="glass-panel bg-white/80 backdrop-blur-3xl rounded-3xl p-6 md:p-10 border border-emerald-900/10 shadow-xl relative z-10 w-full overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-400/5 to-teal-400/10"></div>
        <div className="relative z-20 max-w-lg mx-auto">
          <div className="absolute -top-3 -left-6 bg-amber-400 text-amber-950 px-3 py-1 rounded-md font-bold text-[10px] uppercase tracking-widest transform -rotate-12 shadow-xs">Mint & Lemon</div>
          <div className="absolute top-8 -right-8 bg-emerald-400 text-emerald-950 px-3 py-1 rounded-md font-bold text-[10px] uppercase tracking-widest transform rotate-6 shadow-xs">Zero Sugar</div>
          
          <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-emerald-900 mb-3 tracking-tight">Garnish & Serve</h3>
          <p className="text-xs sm:text-sm text-emerald-900/70 leading-relaxed mb-6 font-medium">
            Add fresh mint leaves, a slice of lemon, or extra ice. Garnish, serve chilled, and enjoy your instant cafe-style premium mocktail!
          </p>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('signature-combos') || document.getElementById('combos');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-block bg-emerald-900 text-white px-6 py-2.5 rounded-full font-black tracking-widest uppercase text-xs shadow-md hover:bg-emerald-800 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
          >
            Experience The Collection
          </button>
        </div>
      </div>
    </article>
  </div>
</section>

<section className="py-6 md:py-10 px-4 sm:px-6 md:px-12 bg-linear-to-br from-[#f0fdf6] to-[#e0f2fe] relative overflow-hidden" id="reviews">
  {/* Background decorative elements */}
  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-emerald-300/30 blur-[80px] rounded-full pointer-events-none"></div>
  <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-indigo-300/20 blur-[80px] rounded-full pointer-events-none"></div>

  <div className="max-w-5xl mx-auto flex flex-col items-center relative z-10">
    <div className="text-amber-400 mb-4 md:mb-6 flex gap-1.5 drop-shadow-xs">
      {[1, 2, 3, 4, 5].map(star => <span key={star} className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
    </div>
    
    <div className="grid grid-cols-1 grid-rows-1 w-full max-w-3xl place-items-center">
      {REVIEWS.map((review, index) => (
        <div 
          key={index}
          className={`col-start-1 row-start-1 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] w-full text-center flex flex-col items-center gap-4 ${
            index === currentReview ? 'opacity-100 translate-x-0 scale-100 z-10' : 
            index < currentReview ? 'opacity-0 -translate-x-20 scale-95 pointer-events-none -z-10' : 'opacity-0 translate-x-20 scale-95 pointer-events-none -z-10'
          }`}
        >
          <h3 className="text-base sm:text-xl md:text-2xl font-black italic text-emerald-900 leading-relaxed tracking-tight px-4 drop-shadow-xs">
            &quot;{review.text}&quot;
          </h3>
          <div className="flex flex-col items-center gap-0.5 mt-2">
            <p className="text-emerald-700 font-black tracking-widest uppercase text-xs sm:text-sm">{review.author}</p>
            <p className="text-emerald-900/50 text-[10px] sm:text-xs font-bold tracking-wider uppercase">{review.role}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="flex items-center gap-4 mt-6 md:mt-10">
      <button 
        onClick={() => setCurrentReview(prev => (prev === 0 ? REVIEWS.length - 1 : prev - 1))}
        className="w-10 h-10 rounded-full border border-emerald-900/10 flex items-center justify-center text-emerald-950 hover:bg-emerald-900/5 hover:border-emerald-900/20 transition-all active:scale-95 bg-white/60 backdrop-blur-md shadow-xs"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
      </button>
      <div className="flex items-center gap-2 px-4 bg-white/60 backdrop-blur-md h-10 rounded-full border border-emerald-900/10 shadow-xs">
        {REVIEWS.map((_, index) => (
          <button 
            key={index}
            onClick={() => setCurrentReview(index)}
            className={`h-2 rounded-full transition-all duration-300 ${index === currentReview ? 'bg-emerald-500 w-6' : 'bg-emerald-900/15 hover:bg-emerald-900/30 w-2'}`}
          />
        ))}
      </div>
      <button 
        onClick={() => setCurrentReview(prev => (prev + 1) % REVIEWS.length)}
        className="w-10 h-10 rounded-full border border-emerald-900/10 flex items-center justify-center text-emerald-950 hover:bg-emerald-900/5 hover:border-emerald-900/20 transition-all active:scale-95 bg-white/60 backdrop-blur-md shadow-xs"
      >
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </button>
    </div>
  </div>
</section>
</main>

<Footer />

      {/* Cart Sidebar Overlay */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 transition-opacity duration-300"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Cart Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white/95 backdrop-blur-3xl z-70 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col font-poppins border-l border-emerald-900/10 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-emerald-900/10 bg-emerald-50/50 select-none">
          <h2 className="text-2xl font-black italic uppercase text-emerald-950 tracking-widest select-none">Your Cart</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="w-9 h-9 rounded-full bg-zinc-200/60 hover:bg-zinc-300 flex items-center justify-center text-zinc-800 hover:text-black transition-all select-none focus:outline-none"
            aria-label="Close cart"
          >
            <span className="material-symbols-outlined text-lg select-none">close</span>
          </button>
        </div>

        <div className="grow p-6 overflow-y-auto space-y-4">
          {!isMounted ? (
            <div className="h-full flex flex-col items-center justify-center text-emerald-900/30 space-y-4">
              <span className="material-symbols-outlined text-6xl opacity-50 animate-pulse" data-icon="shopping_basket">shopping_basket</span>
              <p className="text-lg font-bold">Loading Cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-emerald-900/30 space-y-4">
              <span className="material-symbols-outlined text-6xl opacity-50" data-icon="shopping_basket">shopping_basket</span>
              <p className="text-lg font-bold">Your cart is empty</p>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div key={index} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-emerald-900/5 shadow-sm hover:shadow-md transition-all">
                <div className="w-16 h-16 rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={item.img} alt={item.name} className="w-12 h-12 object-contain" />
                </div>
                <div className="grow">
                  <h4 className="text-emerald-950 font-bold tracking-wider text-sm">{item.name}</h4>
                  <p className="text-emerald-600 font-bold mt-1 text-xs">{item.price}</p>
                </div>
                <div className="flex items-center bg-emerald-50 rounded-full h-8 overflow-hidden shrink-0 border border-emerald-900/5">
                  <button onClick={() => updateQuantity(item.name, -1)} className="w-8 h-full flex items-center justify-center text-emerald-950 hover:bg-emerald-100 transition-colors">
                    <span className="material-symbols-outlined text-[16px]" data-icon="remove">remove</span>
                  </button>
                  <span className="w-6 text-center text-emerald-950 text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.name, 1)} className="w-8 h-full flex items-center justify-center text-emerald-950 hover:bg-emerald-100 transition-colors">
                    <span className="material-symbols-outlined text-[16px]" data-icon="add">add</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {isMounted && cartItems.length > 0 && (
          <div className="p-6 border-t border-emerald-900/10 bg-emerald-50/50 space-y-4">
            <div className="flex justify-between items-center text-emerald-900/70">
              <span className="font-medium">Subtotal</span>
              <span className="font-black text-emerald-950 text-xl tracking-tight">
                ₹{cartItems.reduce((acc, item) => {
                  const priceNum = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
                  return acc + (priceNum * item.quantity);
                }, 0)}/-
              </span>
            </div>
            <Link href="/checkout" className="block w-full py-4 rounded-2xl bg-emerald-900 text-white font-black tracking-widest uppercase text-center hover:bg-emerald-800 active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/20">
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={(user) => {
          setCurrentUser(user);
        }} 
      />
    </div>
  );
}
