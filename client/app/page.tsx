"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProductCard } from '../components/ProductCard';
import { Navbar } from '../components/Navbar';
import { getStoredProducts, getStoredCart, saveStoredCart, Product, getProductStock, DEFAULT_PRODUCTS } from '../lib/store';
import { AuthModal } from '../components/AuthModal';
import { fetchProducts, getLoggedInUser, logoutUser } from '../lib/api';
import { ProductCardSkeleton, StorefrontLoader } from '../components/Skeleton';

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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic categories resolver with search filtering
  const visibleProducts = (products.length > 0 ? products : DEFAULT_PRODUCTS)
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

  // Removed unused refs

  useEffect(() => {
    setIsMounted(true);
    setCurrentUser(getLoggedInUser());
    setIsLoadingProducts(true);

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
      <Navbar 
        totalCartItems={isMounted ? totalItems : 0}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main>
{/* Storefront Left-aligned Promo Tag & Entrance Anchor */}
<div id="storefront" className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-12 pt-4 pb-2 bg-white animate-fade-in">
  <div className="inline-flex bg-neutral-950 text-white text-[9px] sm:text-xs font-black uppercase px-4 py-2 rounded-sm shadow-xs tracking-wider items-center gap-1.5 select-none">
    <span>🎁 Free Shipping Order Above ₹249 & Apply 5% Discount on Checkout</span>
  </div>
</div>
{isLoadingProducts ? (
  <section className="py-12 md:py-16 px-4 sm:px-6 md:px-12 font-poppins bg-white">
    <div className="max-w-screen-2xl mx-auto space-y-8">
      <StorefrontLoader title="Crafting Botanical Flavors..." subtitle="Fetching catalog premixes" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
      className={`pb-6 md:pb-8 px-4 sm:px-6 md:px-12 font-poppins ${catIdx % 2 === 0 ? 'bg-white' : 'bg-[#f4fdf8]'} ${
        catIdx === 0 
          ? 'pt-2 md:pt-3 border-t-0' 
          : 'pt-4 md:pt-6 border-t border-emerald-900/5'
      }`} 
      id={sectionId}
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 md:mb-6 gap-3 w-full">
          <div className="space-y-1">
            <h2 className="font-limelight text-lg sm:text-2xl md:text-3xl uppercase text-emerald-950 tracking-tight leading-none flex flex-wrap items-center gap-2">
              {isComboCategory(category) ? (
                <>
                  <span>Special Offers</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                    Best Value Deals
                  </span>
                </>
              ) : (
                category
              )}
            </h2>
            <p className="text-emerald-900/70 text-xs sm:text-sm font-medium max-w-xl">
              {isComboCategory(category)
                ? "Exclusive curated packs & special value deals for true mocktail lovers."
                : category === "20gm Pouch (5pc)" 
                ? "Premium single-serving pouches designed for quick mixing." 
                : category === "Jar 500gm"
                ? "Bulk jars designed for heavy mixers, bars, and premium sharing." 
                : "Curated selections to shift your state."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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



        <section id="ritual-section" className="py-6 md:py-10 px-4 sm:px-6 md:px-12 bg-white relative overflow-hidden font-poppins">
  {/* Header */}
  <header className="max-w-3xl mx-auto text-center mb-6 md:mb-10 relative">
    <div className="absolute inset-0 bg-emerald-50/80 backdrop-blur-3xl rounded-3xl -z-10 transform -rotate-2 scale-105"></div>
    <h2 className="font-limelight text-lg sm:text-2xl md:text-5xl tracking-tight text-emerald-950 mb-2 leading-none uppercase">
      The 30-Second <br/>
      <span className="text-emerald-600 italic">Ritual</span>
    </h2>
    <p className="text-xs sm:text-sm text-emerald-900/70 max-w-xl mx-auto leading-relaxed font-medium">
      Transform any moment into an occasion. A meticulously crafted experience that requires nothing more than water, ice, and a moment of anticipation.
    </p>
  </header>

  <div className="max-w-5xl mx-auto relative space-y-8 md:space-y-12">
    {/* Step 01 */}
    <article className="relative flex flex-col md:flex-row items-center gap-6 lg:gap-12">
      <div className="absolute -left-4 md:-left-12 top-0 md:-top-8 text-[4rem] md:text-[7rem] font-black text-emerald-50 select-none z-0 tracking-tighter">01</div>
      
      <div className="w-full md:w-5/12 relative z-10 group">
        <div className="aspect-4/5 rounded-3xl overflow-hidden shadow-lg relative max-w-xs mx-auto md:max-w-none">
          <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Preparation" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy4Fl0CLLUldmlFqc9t_p8x9GNpV3njZbRfd_ufqjfGuCrzOLvSuNx7xAc6sAFmiNAvMWX2EZz6Glug9ObwPJq90AAMt1PhGeQTSlB2AFQEWQcGqzBJP14_jMYzGufVTA65Qpac7Z0Wen8tnI_O1lS8clXU3rRAYkjUEuuWX7Jr0bRQ_WkWsMetuyfrZ_WkoJ9tOQSSeNe4RBo93xcmDQKbZfRpH1zHXfSDPTIZZuDv1rotQsCVWJH1neMWDgi5-SKn9JR1Nv_UGjR" />
          <div className="absolute inset-0 bg-linear-to-tr from-emerald-900/20 to-transparent mix-blend-overlay"></div>
        </div>
        <div className="absolute -bottom-4 -right-4 bg-emerald-950 text-emerald-50 px-4 py-1.5 rounded-lg font-bold tracking-widest uppercase shadow-md transform rotate-2 z-20 text-xs">
          Preparation
        </div>
      </div>

      <div className="w-full md:w-7/12 relative z-10 md:pl-6">
        <div className="glass-panel bg-emerald-50/50 backdrop-blur-2xl rounded-3xl p-5 md:p-8 border border-emerald-900/5 shadow-md relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40"></div>
          <h3 className="text-xl sm:text-2xl font-black italic uppercase text-emerald-950 mb-2 tracking-tight">Empty</h3>
          <div className="w-8 h-1 bg-emerald-500 rounded-full mb-3"></div>
          <p className="text-xs sm:text-sm text-emerald-900/70 leading-relaxed font-medium">
            Tear open a single-serve sachet and pour into your favorite glass. The foundation of flavor begins with the finest botanical extracts, carefully preserved for this precise moment.
          </p>
        </div>
      </div>
    </article>

    {/* Step 02 */}
    <article className="relative flex flex-col md:flex-row-reverse items-center gap-6 lg:gap-12">
      <div className="absolute -right-4 md:-right-12 top-0 md:-top-8 text-[4rem] md:text-[7rem] font-black text-emerald-50 select-none z-0 tracking-tighter">02</div>
      
      <div className="w-full md:w-5/12 relative z-10 group">
        <div className="aspect-square md:aspect-4/3 rounded-3xl overflow-hidden shadow-lg relative ml-auto max-w-xs md:max-w-none">
          <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Hydration" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFoewPJKDCpdx1WIvxotYHlIN154t4zIqTWaUVceSDrI6wTYHMQH5Wy0Oo0a98TGAk-5rSNZJGCGInzsZ472nsvHJJVLForPFz2klYNVfmlcLqtu1fB-BNm1zFlRVwWL0g3M3UqGHoser9ESYL8dBtZvBGu2Rhu97TSBw7GeYD6Zq_smDBPWJP_cpiZG_7tRWwgc30ewa65Vbvc7Fpzwt_pqguW80QdAp4klRLZ-qae5A3Csu6DiuqnYejpqWl5CAMyrGADOyctP1I" />
          <div className="absolute inset-0 bg-linear-to-bl from-white/20 to-transparent"></div>
        </div>
        <div className="absolute -top-4 -left-4 bg-teal-800 text-teal-50 px-4 py-1.5 rounded-lg font-bold tracking-widest uppercase shadow-md transform -rotate-2 z-20 text-xs">
          Hydration
        </div>
      </div>

      <div className="w-full md:w-7/12 relative z-10 md:pr-6 text-left md:text-right flex flex-col md:items-end">
        <div className="bg-emerald-50 rounded-3xl p-5 md:p-8 relative overflow-hidden border border-emerald-900/5 shadow-md">
          <h3 className="text-xl sm:text-2xl font-black italic uppercase text-teal-900 mb-2 tracking-tight">Add</h3>
          <div className="w-8 h-1 bg-teal-500 rounded-full mb-3 md:ml-auto"></div>
          <p className="text-xs sm:text-sm text-emerald-900/70 leading-relaxed font-medium">
            Just add 6oz of chilled water and a generous handful of crisp ice cubes. Watch as the botanicals awaken, blooming instantly upon contact with hydration.
          </p>
        </div>
      </div>
    </article>

    {/* Step 03 */}
    <article className="relative flex flex-col items-center max-w-3xl mx-auto text-center mt-4 md:mt-10">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[6rem] md:text-[10rem] font-black text-emerald-50 select-none z-0 tracking-tighter pointer-events-none">03</div>
      
      <div className="glass-panel bg-white/80 backdrop-blur-3xl rounded-3xl p-6 md:p-10 border border-emerald-900/10 shadow-xl relative z-10 w-full overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-400/5 to-teal-400/10"></div>
        <div className="relative z-20 max-w-lg mx-auto">
          <div className="absolute -top-3 -left-6 bg-amber-400 text-amber-950 px-3 py-1 rounded-md font-bold text-[10px] uppercase tracking-widest transform -rotate-12 shadow-xs">Tart</div>
          <div className="absolute top-8 -right-8 bg-emerald-400 text-emerald-950 px-3 py-1 rounded-md font-bold text-[10px] uppercase tracking-widest transform rotate-6 shadow-xs">Sparkling</div>
          
          <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-emerald-900 mb-3 tracking-tight">Shake & Sip</h3>
          <p className="text-xs sm:text-sm text-emerald-900/70 leading-relaxed mb-6 font-medium">
            Shake or stir vigorously for 10 seconds, garnish, and enjoy the complex symphony of flavors. A masterpiece in your hand, crafted by you.
          </p>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('signature-combos') || document.getElementById('combos');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-block bg-emerald-900 text-white px-6 py-2.5 rounded-full font-black tracking-widest uppercase text-xs shadow-md hover:bg-emerald-800 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Experience The Collection
          </button>
        </div>
      </div>

      <div className="absolute -bottom-10 -right-4 md:-right-8 w-32 md:w-44 aspect-3/4 rounded-2xl overflow-hidden shadow-xl z-30 transform rotate-6 hidden sm:block border-4 border-white">
        <img className="w-full h-full object-cover" alt="Garnish" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBa-e0nMC1kQCZ6A0KjUSmmtVZHhIul7iCWdYXT6FyBNJRN8D3cdJCKugiA0AdTCvQzloKX137MncG9WJJ8sRWc60JpleHZi9spS7dWQ_t6ojBXuAIiMMrPwptoGKhR5i3K9IJUVNaIj01Nf7v8HleuRhBXXNqJ5JdTdNXWysd21ogjrDl4gML-cACMgKvabqnmixVsLa_a0v9wReGQ6q4AjWO20cjkgE2GES0c22gMyvid1QRigmaeDWI5-lLYFwY3quSCdfWHhXvX" />
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

<footer className="relative bg-[#032117] text-white pt-10 md:pt-14 pb-10 overflow-hidden border-t-4 border-emerald-500 font-poppins">
  {/* Abstract Liquid background effects */}
  <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[90px] opacity-50"></div>
  <div className="absolute bottom-0 right-1/4 w-100 h-100 bg-teal-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-50"></div>

  <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
    <div className="flex flex-col lg:flex-row justify-between gap-8 border-b border-emerald-800/60 pb-8">
      
      {/* Brand & Newsletter */}
      <div className="lg:w-1/2 space-y-3">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white italic tracking-tight leading-none">
          STAY<br/><span className="text-emerald-400">REFRESHED.</span>
        </h2>
        <p className="text-emerald-200/70 text-xs sm:text-sm font-medium max-w-sm">
          Elevate your daily hydration with botanical mocktail premixes.
        </p>
      </div>

      {/* Links Grid */}
      <div className="lg:w-1/2 grid grid-cols-2 sm:grid-cols-3 gap-6 pt-2">
        <div className="space-y-3">
          <h4 className="text-emerald-400 font-black tracking-widest uppercase text-xs">The Bar</h4>
          <ul className="space-y-2.5 text-xs font-semibold">
            <li><a href="#" className="text-emerald-100/90 hover:text-white transition-colors">Shop All</a></li>
            <li><a href="#" className="text-emerald-100/90 hover:text-white transition-colors">Ingredients</a></li>
            <li><a href="#" className="text-emerald-100/90 hover:text-white transition-colors">Recipes</a></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-emerald-400 font-black tracking-widest uppercase text-xs">Company</h4>
          <ul className="space-y-2.5 text-xs font-semibold">
            <li><a href="#" className="text-emerald-100/90 hover:text-white transition-colors">Our Story</a></li>
            <li><a href="#" className="text-emerald-100/90 hover:text-white transition-colors">Wholesale</a></li>
            <li><a href="#" className="text-emerald-100/90 hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-emerald-400 font-black tracking-widest uppercase text-xs">Socials</h4>
          <div className="flex gap-3">
            <a href="#" className="w-9 h-9 rounded-full bg-emerald-900/60 flex items-center justify-center text-emerald-200 hover:bg-emerald-500 hover:text-emerald-950 transition-all border border-emerald-700/50 shadow-sm">
              <span className="material-symbols-outlined text-lg">photo_camera</span>
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-emerald-900/60 flex items-center justify-center text-emerald-200 hover:bg-emerald-500 hover:text-emerald-950 transition-all border border-emerald-700/50 shadow-sm">
              <span className="material-symbols-outlined text-lg">public</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Footer */}
    <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-emerald-400/80 text-xs font-bold tracking-wider uppercase">
      <p>© 2026 Ninjaro✧. Crafted with care.</p>
      <div className="flex gap-6">
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <a href="#" className="hover:text-white transition-colors">Terms</a>
        <a href="#" className="hover:text-white transition-colors">Shipping</a>
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

      {/* Grid Modal Overlay removed */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsProfileMenuOpen(true);
        }} 
      />
    </>
  );
}
