'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Product } from '@/lib/store';
import { fetchProducts } from '@/lib/api';

export default function ShopShowcasePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('nz_cart');
      if (storedCart) {
        try {
          const parsed = JSON.parse(storedCart);
          if (Array.isArray(parsed)) {
            setCartCount(parsed.reduce((a: number, b: any) => a + (b.quantity || 1), 0));
          }
        } catch (e) {}
      }
    }

    fetchProducts()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(err => console.error('Failed to load showcase products:', err));
  }, []);

  const sugaredItems = [
    { name: 'Blue Lagoon Premix', pouchPrice: 125, jar5pcPrice: 499, jar500gPrice: 1299, image: '/bluelagoonjar.jpeg', desc: 'Natural blueberry extracts, sparkling spring water & wild lavender.' },
    { name: 'Virgin Mojito Premix', pouchPrice: 125, jar5pcPrice: 499, jar500gPrice: 1299, image: '/virginmojitojar.jpeg', desc: 'Crisp spearmint, lime zest & sparkling botanical bubbles.' },
    { name: 'Spicy Guava Premix', pouchPrice: 125, jar5pcPrice: 499, jar500gPrice: 1299, image: '/bluelagoonjar.jpeg', desc: 'Pink guava puree with chili lime seasoning salt.' },
    { name: 'Kala Khatta Premix', pouchPrice: 125, jar5pcPrice: 499, jar500gPrice: 1299, image: '/bluelagoonjar.jpeg', desc: 'Tangy Syzygium cumin plum with roasted cumin spices.' }
  ];

  const zeroSugarItems = [
    { name: 'Zero-Sugar Blue Lagoon', pouchPrice: 125, jar5pcPrice: 499, jar500gPrice: 1299, image: '/bluelagoonjar.jpeg', desc: '0 Calories. 100% Organic Stevia sweetened natural blueberry extracts.' },
    { name: 'Zero-Sugar Virgin Mojito', pouchPrice: 125, jar5pcPrice: 499, jar500gPrice: 1299, image: '/virginmojitojar.jpeg', desc: '0 Calories. Crisp spearmint & lime zest with zero glycemic index.' },
    { name: 'Zero-Sugar Spicy Guava', pouchPrice: 125, jar5pcPrice: 499, jar500gPrice: 1299, image: '/bluelagoonjar.jpeg', desc: '0 Calories. Pink guava flavor with chili lime salt, 100% plant stevia.' },
    { name: 'Zero-Sugar Peach Ice Tea', pouchPrice: 125, jar5pcPrice: 499, jar500gPrice: 1299, image: '/bluelagoonjar.jpeg', desc: '0 Calories. Darjeeling black tea infused with white peach flavor.' }
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] font-poppins text-zinc-900 selection:bg-emerald-200 pb-16">
      <Navbar 
        totalCartItems={isMounted ? cartCount : 0}
        onOpenCart={() => {}}
      />

      {/* Subheader Breadcrumb */}
      <div className="bg-slate-50/90 border-b border-zinc-200/80 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
          <Link href="/" className="hover:text-zinc-900 flex items-center gap-1 text-emerald-800">
            <span className="material-symbols-outlined text-base">home</span> Home
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 font-black">Official Product & Pricing Showcase</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        
        {/* Promotional Hero Billboard */}
        <section className="bg-linear-to-r from-[#032117] via-[#064e3b] to-[#043425] text-white p-8 sm:p-12 rounded-3xl shadow-xl space-y-6 border border-emerald-800/40 relative overflow-hidden text-center sm:text-left">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              Official Botanical Product & Quantity Pricing Showcase
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tight text-white leading-none">
              Craft Sugared & <span className="text-emerald-300 italic">100% Zero-Sugar</span>
            </h1>
            <p className="text-emerald-200/90 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
              Visual comparison chart of our craft botanical premixes. Review formulations, quantity volume discounts, and wholesale jar specifications below.
            </p>
          </div>

          {/* Wholesale Quantity Savings Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-emerald-800/60 relative z-10">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl space-y-1 text-center sm:text-left">
              <span className="text-emerald-400 font-black text-xs uppercase tracking-widest block">Single Retail Pouch</span>
              <span className="text-2xl font-black text-white">₹125/-</span>
              <p className="text-[10px] text-emerald-200/70 font-bold">20g Single-Serve Sachet</p>
            </div>
            <div className="bg-amber-400/20 backdrop-blur-md border border-amber-300/40 p-4 rounded-2xl space-y-1 text-center sm:text-left">
              <span className="text-amber-300 font-black text-xs uppercase tracking-widest block">Pack of 5 Jar (Save 15%)</span>
              <span className="text-2xl font-black text-amber-200">₹499/-</span>
              <p className="text-[10px] text-amber-100/70 font-bold">20g x 5 Pouches Box</p>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 p-4 rounded-2xl space-y-1 text-center sm:text-left">
              <span className="text-emerald-300 font-black text-xs uppercase tracking-widest block">Wholesale 500g Jar (Save 25%)</span>
              <span className="text-2xl font-black text-emerald-200">₹1,299/-</span>
              <p className="text-[10px] text-emerald-100/70 font-bold">Makes 25 Glasses • Free Express Courier</p>
            </div>
          </div>
        </section>

        {/* Non-Interactive Side-by-Side Showcase Board */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT SIDE: Classic Sugared Showcase Board */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-900/10 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">cookie</span> Classic Sugared Formula
                </span>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Natural Cane Notes</span>
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900">Sugared Flavors Catalog</h2>
              <p className="text-zinc-500 text-xs font-medium">Authentic fruit puree balanced with real cane sweetness & bar-quality fizz.</p>
            </div>

            {/* Visual Non-Interactive Table List */}
            <div className="space-y-4">
              {sugaredItems.map((item, idx) => (
                <div key={idx} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/70 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-zinc-200 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-black text-xs sm:text-sm text-zinc-900 truncate">{item.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-semibold line-clamp-1">{item.desc}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="font-black text-xs text-emerald-900">₹{item.pouchPrice} <span className="text-[9px] text-zinc-400 font-normal">/ pouch</span></p>
                    <p className="font-bold text-[10px] text-amber-800">5-Pack: ₹{item.jar5pcPrice}</p>
                    <p className="font-bold text-[10px] text-emerald-700">500g Jar: ₹{item.jar500gPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: 100% Zero-Sugar Stevia Showcase Board */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-900/10 shadow-sm space-y-6">
            <div className="border-b border-zinc-100 pb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">eco</span> 100% Plant Stevia Formula
                </span>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">0 Calories • 0 Guilt</span>
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900">Zero Sugar Diet Series</h2>
              <p className="text-zinc-500 text-xs font-medium">Sweetened with 100% organic plant stevia extract for diabetic-friendly mixing.</p>
            </div>

            {/* Visual Non-Interactive Table List */}
            <div className="space-y-4">
              {zeroSugarItems.map((item, idx) => (
                <div key={idx} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-zinc-200 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-xs sm:text-sm text-zinc-900 truncate">{item.name}</h4>
                        <span className="bg-emerald-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">0 Cal</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-semibold line-clamp-1">{item.desc}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="font-black text-xs text-emerald-900">₹{item.pouchPrice} <span className="text-[9px] text-zinc-400 font-normal">/ pouch</span></p>
                    <p className="font-bold text-[10px] text-amber-800">5-Pack: ₹{item.jar5pcPrice}</p>
                    <p className="font-bold text-[10px] text-emerald-700">500g Jar: ₹{item.jar500gPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* Bottom CTA Banner leading to Storefront to Purchase */}
        <section className="bg-white p-8 rounded-3xl border border-zinc-200/80 text-center space-y-4 shadow-xs">
          <h3 className="text-xl sm:text-2xl font-black italic uppercase text-zinc-900">Ready to Experience Ninjaro Mocktails?</h3>
          <p className="text-zinc-500 text-xs font-semibold max-w-md mx-auto">Visit our interactive storefront catalog to select quantities, customize flavors, and checkout with SSL encrypted Razorpay security.</p>
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 bg-emerald-900 hover:bg-emerald-800 text-white font-black px-8 py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">shopping_cart</span>
              Explore Storefront & Order Now
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
