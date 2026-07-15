"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProductCard } from '../components/ProductCard';
import { getStoredProducts, getStoredCart, saveStoredCart, Product, getProductStock, DEFAULT_PRODUCTS } from '../lib/store';

const REVIEWS = [
  {
    text: "Absolutely mind-blowing. The depth of flavor in the Green Mango is something I never thought possible from a premix.",
    author: "Elena R.",
    role: "Mixologist"
  },
  {
    text: "The easiest way to impress guests. The Virgin Mojito tastes like it was just muddled at a high-end bar.",
    author: "James T.",
    role: "Event Host"
  },
  {
    text: "I love the complex botanical notes. Blue Lagoon is not just a drink, it's an entire mood.",
    author: "Sarah L.",
    role: "Lifestyle Blogger"
  }
];

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState<{name: string, price: string, img: string, quantity: number}[]>([]);
  const [currentReview, setCurrentReview] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);

  // Dynamic categories resolver
  const visibleProducts = (products.length > 0 ? products : DEFAULT_PRODUCTS).filter(p => p.showInStorefront !== false);
  const categoryOrder = ["20gm Pouch (5pc)", "Jar 500gm", "Combos"];
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

  // Removed unused refs

  useEffect(() => {
    setIsMounted(true);
    setProducts(getStoredProducts());
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
    if (!targetProduct) return;
    const currentQty = getItemQuantity(item.name);
    if (currentQty >= targetProduct.stock) {
      alert(`Sorry, only ${targetProduct.stock} items of ${item.name} are available in stock.`);
      return;
    }

    setCartItems(prev => {
      let newCart;
      const existing = prev.find(i => i.name === item.name);
      if (existing) {
        newCart = prev.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        newCart = [...prev, { ...item, quantity: 1 }];
      }

      saveStoredCart(newCart.map(c => ({
        name: c.name,
        price: parseInt(c.price.replace(/[^\d]/g, '')) || 666,
        img: c.img,
        quantity: c.quantity
      })));
      return newCart;
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (name: string, delta: number) => {
    if (delta > 0) {
      const targetProduct = products.find(p => p.name === name);
      if (targetProduct) {
        const currentQty = getItemQuantity(name);
        if (currentQty >= targetProduct.stock) {
          alert(`Sorry, only ${targetProduct.stock} items of ${name} are available in stock.`);
          return;
        }
      }
    }

    setCartItems(prev => {
      const newCart = prev.map(item => {
        if (item.name === name) {
          return { ...item, quantity: item.quantity + delta };
        }
        return item;
      }).filter(item => item.quantity > 0);

      saveStoredCart(newCart.map(c => ({
        name: c.name,
        price: parseInt(c.price.replace(/[^\d]/g, '')) || 666,
        img: c.img,
        quantity: c.quantity
      })));
      return newCart;
    });
  };

  const getItemQuantity = (name: string) => {
    return cartItems.find(i => i.name === name)?.quantity || 0;
  };

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Carousels removed

  return (
    <>
      {/* Top Promotional Announcement Bar */}
      <div className="bg-[#e55353] text-white text-[10px] md:text-xs font-black py-2.5 px-4 text-center tracking-wider flex items-center justify-center gap-1.5 relative z-50 animate-fade-in border-b border-white/5">
        <span>Flat ₹75 Cashback on your 1st MobiKwik UPI payment! (Min. order ₹399*)</span>
        <button 
          onClick={() => document.getElementById('storefront')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-[#ffeb3b] underline font-black hover:scale-105 active:scale-95 transition-transform ml-1 uppercase whitespace-nowrap"
        >
          Shop Now
        </button>
      </div>

      {/* Sticky Navigation Header */}
      <header className="sticky top-0 w-full z-40 bg-white border-b border-zinc-200 shadow-xs transition-all duration-300 font-poppins">
        {/* Row 1: Logo, Search, and Actions */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 h-14 md:h-20 flex items-center justify-between gap-4">
          
          {/* Left Column: Hamburger (Mobile) / Search Bar (Desktop) */}
          <div className="flex-1 flex justify-start items-center">
            {/* Hamburger Trigger (Mobile only) */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="lg:hidden text-zinc-800 w-9 h-9 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors shrink-0"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            {/* Desktop Search Bar */}
            <div className="hidden lg:flex relative items-center w-60 xl:w-72">
              <span className="material-symbols-outlined absolute left-3 text-zinc-400 text-lg">search</span>
              <input 
                type="text" 
                placeholder="Search for products..." 
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 pl-10 pr-4 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all shadow-inner" 
              />
            </div>
          </div>

          {/* Center Column: Logo */}
          <div className="flex-initial flex justify-center items-center">
            <img 
              src="/nin.png" 
              alt="Ninjaro Logo" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="h-8 md:h-12 w-auto object-contain cursor-pointer select-none" 
            />
          </div>

          {/* Right Column: Actions */}
          <div className="flex-1 flex justify-end items-center gap-1.5 md:gap-3">
            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-zinc-800 transition-colors hover:bg-zinc-100 shrink-0"
                aria-label="Profile dropdown"
              >
                <span className="material-symbols-outlined text-lg md:text-xl">person</span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 text-zinc-800">
                    <span className="material-symbols-outlined text-lg text-zinc-400">account_circle</span>
                    <span className="font-bold text-xs tracking-tight">Profile</span>
                  </Link>
                  <Link href="/track-order" className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 text-zinc-800">
                    <span className="material-symbols-outlined text-lg text-zinc-400">local_shipping</span>
                    <span className="font-bold text-xs tracking-tight">Track Order</span>
                  </Link>
                  <div className="mx-4 my-1 h-px bg-zinc-100"></div>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 text-left">
                    <span className="material-symbols-outlined text-lg text-red-600/40">logout</span>
                    <span className="font-bold text-xs tracking-tight">Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cartbag count Trigger */}
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100 text-zinc-800 flex items-center justify-center relative hover:scale-105 active:scale-95 transition-all shadow-xs shrink-0"
              aria-label="Open cart"
            >
              <span className="material-symbols-outlined text-lg md:text-[20px]">shopping_bag</span>
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] md:text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Horizontal Navigation Bar (Desktop only) */}
        <div className="hidden lg:flex justify-center border-t border-zinc-100 py-3.5 w-full bg-white">
          <nav className="flex items-center gap-8 text-xs font-black tracking-widest uppercase text-zinc-700">
            <button 
              onClick={() => document.getElementById('20gm-pouch-5pc')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-black hover:border-b-2 hover:border-black pb-1 -mb-1 transition-colors cursor-pointer"
            >
              Pouches
            </button>
            <button 
              onClick={() => document.getElementById('jar-500gm')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-black hover:border-b-2 hover:border-black pb-1 -mb-1 transition-colors cursor-pointer"
            >
              Jars
            </button>
            <button 
              onClick={() => document.getElementById('combos')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-black hover:border-b-2 hover:border-black pb-1 -mb-1 transition-colors cursor-pointer"
            >
              Combos
            </button>
            <button 
              onClick={() => document.getElementById('ritual-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-black hover:border-b-2 hover:border-black pb-1 -mb-1 transition-colors cursor-pointer"
            >
              The Ritual
            </button>
            <button 
              onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-black hover:border-b-2 hover:border-black pb-1 -mb-1 transition-colors cursor-pointer"
            >
              Reviews
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-3xl z-55 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden flex flex-col font-poppins border-r border-emerald-900/10 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-emerald-900/10 bg-emerald-50/50">
          <img src="/nin.png" alt="Ninjaro Logo" className="h-9 w-auto object-contain" />
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-9 h-9 rounded-full bg-emerald-900/5 flex items-center justify-center text-emerald-950 hover:bg-emerald-900 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        <div className="grow p-6 flex flex-col gap-6 text-sm font-black uppercase tracking-wider text-emerald-950">
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('20gm-pouch-5pc')?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="text-left py-2 border-b border-emerald-900/5 hover:text-emerald-600 transition-colors"
          >
            Pouches
          </button>
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('jar-500gm')?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="text-left py-2 border-b border-emerald-900/5 hover:text-emerald-600 transition-colors"
          >
            Jars
          </button>
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('combos')?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="text-left py-2 border-b border-emerald-900/5 hover:text-emerald-600 transition-colors"
          >
            Combos
          </button>
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('ritual-section')?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="text-left py-2 border-b border-emerald-900/5 hover:text-emerald-600 transition-colors"
          >
            The Ritual
          </button>
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="text-left py-2 border-b border-emerald-900/5 hover:text-emerald-600 transition-colors"
          >
            Reviews
          </button>
        </div>
        <div className="p-6 border-t border-emerald-900/10 bg-emerald-50/50 text-center text-xs font-bold text-emerald-900/50">
          © 2026 Ninjaro✧
        </div>
      </div>

      <main>
{/* Storefront Left-aligned Promo Tag & Entrance Anchor */}
<div id="storefront" className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-12 pt-4 pb-2 bg-white animate-fade-in">
  <div className="inline-flex bg-neutral-950 text-white text-[9px] sm:text-xs font-black uppercase px-4 py-2 rounded-sm shadow-xs tracking-wider items-center gap-1.5 select-none">
    <span>🎁 Free Shipping Order Above ₹249 & Apply 5% Discount on Checkout</span>
  </div>
</div>
{sortedCategories.map((category, catIdx) => {
  const catProducts = getProductsByCategory(category);
  if (catProducts.length === 0) return null;
  const sectionId = category.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return (
    <section 
      key={category} 
      className={`pb-8 md:pb-12 px-4 sm:px-6 md:px-12 font-poppins ${catIdx % 2 === 0 ? 'bg-white' : 'bg-[#f4fdf8]'} ${
        catIdx === 0 
          ? 'pt-2 md:pt-3 border-t-0' 
          : 'pt-6 md:pt-8 border-t border-emerald-900/5'
      }`} 
      id={sectionId}
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-5 md:mb-8 gap-4 w-full">
          <div className="space-y-1.5 md:space-y-2">
            <h2 className="font-limelight text-xl sm:text-3xl md:text-5xl uppercase text-emerald-950 tracking-tighter leading-none">
              {category}
            </h2>
            <p className="text-emerald-900/70 text-xs sm:text-sm md:text-base font-medium max-w-xl">
              {category === "20gm Pouch (5pc)" 
                ? "Premium single-serving pouches designed for quick mixing." 
                : category === "Jar 500gm"
                ? "Bulk jars designed for heavy mixers, bars, and premium sharing." 
                : category === "Combos"
                ? "Try all mocktail flavors in our specially curated combo boxes."
                : "Curated selections to shift your state."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {catProducts.map((product) => {
            const priceStr = `₹${product.price}/-`;
            const mrpStr = product.mrp ? `₹${product.mrp}/-` : undefined;
            const stockVal = getProductStock(product, products.length > 0 ? products : DEFAULT_PRODUCTS);
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

<section id="ritual-section" className="py-8 md:py-16 px-6 md:px-12 bg-white relative overflow-hidden font-poppins">
  {/* Header */}
  <header className="max-w-4xl mx-auto text-center mb-10 md:mb-16 relative">
    <div className="absolute inset-0 bg-emerald-50/80 backdrop-blur-3xl rounded-[3rem] -z-10 transform -rotate-2 scale-105"></div>
    <h2 className="font-limelight text-5xl md:text-7xl tracking-tighter text-emerald-950 mb-6 leading-none uppercase">
      The 30-Second <br/>
      <span className="text-emerald-600 italic">Ritual</span>
    </h2>
    <p className="text-lg md:text-xl text-emerald-900/70 max-w-2xl mx-auto leading-relaxed font-medium">
      Transform any moment into an occasion. A meticulously crafted experience that requires nothing more than water, ice, and a moment of anticipation.
    </p>
  </header>

  <div className="max-w-7xl mx-auto relative space-y-12 md:space-y-24">
    {/* Step 01 */}
    <article className="relative flex flex-col md:flex-row items-center gap-12 lg:gap-24">
      <div className="absolute -left-8 md:-left-24 top-0 md:-top-16 text-[8rem] md:text-[14rem] font-black text-emerald-50 select-none z-0 tracking-tighter">01</div>
      
      <div className="w-full md:w-5/12 relative z-10 group">
        <div className="aspect-4/5 rounded-4xl overflow-hidden shadow-2xl relative">
          <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Preparation" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy4Fl0CLLUldmlFqc9t_p8x9GNpV3njZbRfd_ufqjfGuCrzOLvSuNx7xAc6sAFmiNAvMWX2EZz6Glug9ObwPJq90AAMt1PhGeQTSlB2AFQEWQcGqzBJP14_jMYzGufVTA65Qpac7Z0Wen8tnI_O1lS8clXU3rRAYkjUEuuWX7Jr0bRQ_WkWsMetuyfrZ_WkoJ9tOQSSeNe4RBo93xcmDQKbZfRpH1zHXfSDPTIZZuDv1rotQsCVWJH1neMWDgi5-SKn9JR1Nv_UGjR" />
          <div className="absolute inset-0 bg-linear-to-tr from-emerald-900/20 to-transparent mix-blend-overlay"></div>
        </div>
        <div className="absolute -bottom-6 -right-6 bg-emerald-950 text-emerald-50 px-6 py-3 rounded-xl font-bold tracking-widest uppercase shadow-xl transform rotate-3 z-20 text-sm">
          Preparation
        </div>
      </div>

      <div className="w-full md:w-7/12 relative z-10 md:pl-12">
        <div className="glass-panel bg-emerald-50/50 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 border border-emerald-900/5 shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          <h3 className="text-4xl md:text-5xl font-black italic uppercase text-emerald-950 mb-4 tracking-tighter">Empty</h3>
          <div className="w-12 h-1 bg-emerald-500 rounded-full mb-6"></div>
          <p className="text-xl text-emerald-900/70 leading-relaxed font-medium">
            Tear open a single-serve sachet and pour into your favorite glass. The foundation of flavor begins with the finest botanical extracts, carefully preserved for this precise moment.
          </p>
        </div>
      </div>
    </article>

    {/* Step 02 */}
    <article className="relative flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24">
      <div className="absolute -right-8 md:-right-24 top-0 md:-top-16 text-[8rem] md:text-[14rem] font-black text-emerald-50 select-none z-0 tracking-tighter">02</div>
      
      <div className="w-full md:w-6/12 relative z-10 group">
        <div className="aspect-square md:aspect-4/3 rounded-4xl overflow-hidden shadow-2xl relative ml-auto">
          <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Hydration" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFoewPJKDCpdx1WIvxotYHlIN154t4zIqTWaUVceSDrI6wTYHMQH5Wy0Oo0a98TGAk-5rSNZJGCGInzsZ472nsvHJJVLForPFz2klYNVfmlcLqtu1fB-BNm1zFlRVwWL0g3M3UqGHoser9ESYL8dBtZvBGu2Rhu97TSBw7GeYD6Zq_smDBPWJP_cpiZG_7tRWwgc30ewa65Vbvc7Fpzwt_pqguW80QdAp4klRLZ-qae5A3Csu6DiuqnYejpqWl5CAMyrGADOyctP1I" />
          <div className="absolute inset-0 bg-linear-to-bl from-white/20 to-transparent"></div>
        </div>
        <div className="absolute -top-6 -left-6 bg-teal-800 text-teal-50 px-6 py-3 rounded-xl font-bold tracking-widest uppercase shadow-xl transform -rotate-2 z-20 text-sm">
          Hydration
        </div>
      </div>

      <div className="w-full md:w-6/12 relative z-10 md:pr-12 text-left md:text-right flex flex-col md:items-end">
        <div className="bg-emerald-50 rounded-[3rem] p-8 md:p-12 relative overflow-hidden border border-emerald-900/5 shadow-xl">
          <h3 className="text-4xl md:text-5xl font-black italic uppercase text-teal-900 mb-4 tracking-tighter">Add</h3>
          <div className="w-12 h-1 bg-teal-500 rounded-full mb-6 md:ml-auto"></div>
          <p className="text-xl text-emerald-900/70 leading-relaxed font-medium">
            Just add 6oz of chilled water and a generous handful of crisp ice cubes. Watch as the botanicals awaken, blooming instantly upon contact with hydration.
          </p>
        </div>
      </div>
    </article>

    {/* Step 03 */}
    <article className="relative flex flex-col items-center max-w-5xl mx-auto text-center mt-6 md:mt-24">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[12rem] md:text-[20rem] font-black text-emerald-50 select-none z-0 tracking-tighter pointer-events-none">03</div>
      
      <div className="glass-panel bg-white/80 backdrop-blur-3xl rounded-[4rem] p-12 md:p-20 border border-emerald-900/10 shadow-2xl relative z-10 w-full overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-400/5 to-teal-400/10"></div>
        <div className="relative z-20 max-w-2xl mx-auto">
          <div className="absolute -top-4 -left-8 bg-amber-400 text-amber-950 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transform -rotate-12 shadow-md">Tart</div>
          <div className="absolute top-12 -right-12 bg-emerald-400 text-emerald-950 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transform rotate-6 shadow-md">Sparkling</div>
          
          <h3 className="text-5xl md:text-6xl font-black italic uppercase text-emerald-950 mb-8 tracking-tighter">Shake & Sip</h3>
          <p className="text-2xl text-emerald-900/70 leading-relaxed mb-12 font-medium">
            Shake or stir vigorously for 10 seconds, garnish, and enjoy the complex symphony of flavors. A masterpiece in your hand, crafted by you.
          </p>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('flavors')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-block bg-emerald-950 text-white px-10 py-5 rounded-full font-black tracking-widest uppercase text-sm shadow-xl hover:bg-emerald-800 transition-all duration-300 transform hover:-translate-y-1"
          >
            Experience The Collection
          </button>
        </div>
      </div>

      <div className="absolute -bottom-16 -right-8 md:-right-16 w-48 md:w-64 aspect-3/4 rounded-3xl overflow-hidden shadow-2xl z-30 transform rotate-6 hidden sm:block border-8 border-white">
        <img className="w-full h-full object-cover" alt="Garnish" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBa-e0nMC1kQCZ6A0KjUSmmtVZHhIul7iCWdYXT6FyBNJRN8D3cdJCKugiA0AdTCvQzloKX137MncG9WJJ8sRWc60JpleHZi9spS7dWQ_t6ojBXuAIiMMrPwptoGKhR5i3K9IJUVNaIj01Nf7v8HleuRhBXXNqJ5JdTdNXWysd21ogjrDl4gML-cACMgKvabqnmixVsLa_a0v9wReGQ6q4AjWO20cjkgE2GES0c22gMyvid1QRigmaeDWI5-lLYFwY3quSCdfWHhXvX" />
      </div>
    </article>
  </div>
</section>
<section className="py-8 md:py-16 px-6 md:px-12 bg-linear-to-br from-[#f0fdf6] to-[#e0f2fe] relative overflow-hidden" id="reviews">
  {/* Background decorative elements */}
  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-emerald-300/40 blur-[100px] rounded-full pointer-events-none"></div>
  <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-indigo-300/30 blur-[100px] rounded-full pointer-events-none"></div>

  <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
    <div className="text-amber-400 mb-6 md:mb-12 flex gap-2 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">
      {[1, 2, 3, 4, 5].map(star => <span key={star} className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
    </div>
    
    <div className="grid grid-cols-1 grid-rows-1 w-full max-w-5xl place-items-center">
      {REVIEWS.map((review, index) => (
        <div 
          key={index}
          className={`col-start-1 row-start-1 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] w-full text-center flex flex-col items-center gap-8 ${
            index === currentReview ? 'opacity-100 translate-x-0 scale-100 z-10' : 
            index < currentReview ? 'opacity-0 -translate-x-32 scale-95 pointer-events-none -z-10' : 'opacity-0 translate-x-32 scale-95 pointer-events-none -z-10'
          }`}
        >
          <h3 className="text-3xl md:text-5xl lg:text-6xl font-black italic text-emerald-950 leading-tight tracking-tight px-4 drop-shadow-sm">
            "{review.text}"
          </h3>
          <div className="flex flex-col items-center gap-1 mt-4">
            <p className="text-emerald-700 font-black tracking-widest uppercase text-sm md:text-base">{review.author}</p>
            <p className="text-emerald-900/50 text-xs md:text-sm font-bold tracking-wider uppercase">{review.role}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="flex items-center gap-6 mt-8 md:mt-16">
      <button 
        onClick={() => setCurrentReview(prev => (prev === 0 ? REVIEWS.length - 1 : prev - 1))}
        className="w-14 h-14 rounded-full border border-emerald-900/10 flex items-center justify-center text-emerald-950 hover:bg-emerald-900/5 hover:border-emerald-900/20 transition-all active:scale-95 bg-white/50 backdrop-blur-md shadow-sm"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      <div className="flex items-center gap-3 px-6 bg-white/50 backdrop-blur-md h-14 rounded-full border border-emerald-900/10 shadow-sm">
        {REVIEWS.map((_, index) => (
          <button 
            key={index}
            onClick={() => setCurrentReview(index)}
            className={`h-2.5 rounded-full transition-all duration-500 ${index === currentReview ? 'bg-emerald-500 w-8 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-emerald-900/10 hover:bg-emerald-900/30 w-2.5'}`}
          />
        ))}
      </div>
      <button 
        onClick={() => setCurrentReview(prev => (prev + 1) % REVIEWS.length)}
        className="w-14 h-14 rounded-full border border-emerald-900/10 flex items-center justify-center text-emerald-950 hover:bg-emerald-900/5 hover:border-emerald-900/20 transition-all active:scale-95 bg-white/50 backdrop-blur-md shadow-sm"
      >
        <span className="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
  </div>
</section>
</main>
{/**/}
<footer className="relative bg-emerald-950 pt-12 md:pt-20 pb-12 overflow-hidden border-t-8 border-emerald-500 font-poppins">
  {/* Abstract Liquid background effects */}
  <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50"></div>
  <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50"></div>

  <div className="max-w-screen-2xl mx-auto px-6 md:px-12 relative z-10">
    <div className="flex flex-col lg:flex-row justify-between gap-16 border-b border-emerald-800/50 pb-16">
      
      {/* Brand & Newsletter */}
      <div className="lg:w-1/2 space-y-8">
        <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none">
          STAY<br/>REFRESHED.
        </h2>

        <div className="flex w-full max-w-md bg-emerald-900/50 rounded-full p-2 border border-emerald-700/50 backdrop-blur-sm shadow-xl">
        
        </div>
      </div>

      {/* Links Grid */}
      <div className="lg:w-1/2 grid grid-cols-2 sm:grid-cols-3 gap-8 pt-4">
        <div className="space-y-6">
          <h4 className="text-emerald-500 font-black tracking-widest uppercase text-xs">The Bar</h4>
          <ul className="space-y-4 text-sm font-medium">
            <li><a href="#" className="text-emerald-100/70 hover:text-white transition-colors">Shop All</a></li>
            <li><a href="#" className="text-emerald-100/70 hover:text-white transition-colors">Ingredients</a></li>
            <li><a href="#" className="text-emerald-100/70 hover:text-white transition-colors">Recipes</a></li>
          </ul>
        </div>
        <div className="space-y-6">
          <h4 className="text-emerald-500 font-black tracking-widest uppercase text-xs">Company</h4>
          <ul className="space-y-4 text-sm font-medium">
            <li><a href="#" className="text-emerald-100/70 hover:text-white transition-colors">Our Story</a></li>
            <li><a href="#" className="text-emerald-100/70 hover:text-white transition-colors">Wholesale</a></li>
            <li><a href="#" className="text-emerald-100/70 hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
        <div className="space-y-6">
          <h4 className="text-emerald-500 font-black tracking-widest uppercase text-xs">Socials</h4>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-emerald-800/50 flex items-center justify-center text-emerald-200 hover:bg-emerald-500 hover:text-emerald-950 transition-all shadow-lg border border-emerald-700/50">
              <span className="material-symbols-outlined text-[20px]" data-icon="photo_camera">photo_camera</span>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-emerald-800/50 flex items-center justify-center text-emerald-200 hover:bg-emerald-500 hover:text-emerald-950 transition-all shadow-lg border border-emerald-700/50">
              <span className="material-symbols-outlined text-[20px]" data-icon="public">public</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Footer */}
    <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-emerald-500/60 text-xs font-bold tracking-widest uppercase">
      <p>© 2026 Ninjaro✧. Crafted with care.</p>
      <div className="flex gap-6">
        <a href="#" className="hover:text-emerald-300 transition-colors">Privacy</a>
        <a href="#" className="hover:text-emerald-300 transition-colors">Terms</a>
        <a href="#" className="hover:text-emerald-300 transition-colors">Shipping</a>
      </div>
    </div>
  </div>
</footer>

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
        <div className="p-6 flex items-center justify-between border-b border-emerald-900/10 bg-emerald-50/50">
          <h2 className="text-2xl font-black italic uppercase text-emerald-950 tracking-widest">Your Cart</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="w-10 h-10 rounded-full bg-emerald-900/5 flex items-center justify-center text-emerald-950 hover:bg-emerald-900 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-xl" data-icon="close">close</span>
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

      {/* Grid Modal Overlay removed */}
    </>
  );
}
