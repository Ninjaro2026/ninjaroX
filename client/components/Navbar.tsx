"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchProducts, getLoggedInUser, logoutUser } from '../lib/api';
import { Product, DEFAULT_PRODUCTS } from '../lib/store';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  totalCartItems?: number;
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Navbar({ totalCartItems = 0, onOpenCart, searchQuery: externalSearchQuery, onSearchChange }: NavbarProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Search state
  const [internalQuery, setInternalQuery] = useState('');
  const query = externalSearchQuery !== undefined ? externalSearchQuery : internalQuery;
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredResults, setFilteredResults] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(getLoggedInUser());

    // Fetch catalog products for real-time search lookup
    fetchProducts()
      .then(prods => {
        if (prods && prods.length > 0) {
          setAllProducts(prods);
        } else {
          setAllProducts(DEFAULT_PRODUCTS);
        }
      })
      .catch(() => {
        setAllProducts(DEFAULT_PRODUCTS);
      });
  }, []);

  // Filter search results dynamically
  useEffect(() => {
    if (!query.trim()) {
      setFilteredResults([]);
      return;
    }

    const q = query.toLowerCase().trim();
    const matches = allProducts.filter(p => 
      p.showInStorefront !== false && (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      )
    ).slice(0, 5);

    setFilteredResults(matches);
  }, [query, allProducts]);

  // Click outside listener for search & profile dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalQuery(val);
    }
  };

  const handleSelectProduct = (prodId: string) => {
    setIsSearchFocused(false);
    handleQueryChange('');
    router.push(`/products/${prodId}`);
  };

  return (
    <>
      {/* Top Banner Announcement */}
      <div className="bg-emerald-950 text-emerald-100 text-[10px] sm:text-xs font-bold py-1.5 px-4 text-center tracking-wider uppercase flex items-center justify-center gap-2 font-poppins">
        <span>🎁 Special Launch Offer: Free Express Shipping on all orders above ₹249!</span>
        <button 
          onClick={() => {
            if (window.location.pathname !== '/') {
              router.push('/');
            } else {
              const el = document.getElementById('signature-combos') || document.getElementById('combos');
              el?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
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

            {/* Desktop Fully Functional Search Bar */}
            <div ref={searchRef} className="hidden lg:flex relative items-center w-64 xl:w-80">
              <span className="material-symbols-outlined absolute left-3 text-zinc-400 text-lg pointer-events-none">search</span>
              <input 
                type="text" 
                value={query}
                onChange={e => {
                  handleQueryChange(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search mocktails, pouches, jars..." 
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 pl-10 pr-8 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-inner" 
              />

              {query && (
                <button 
                  onClick={() => handleQueryChange('')}
                  className="absolute right-2.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}

              {/* Functional Search Dropdown Overlay */}
              {isSearchFocused && query.trim() !== '' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-zinc-200 py-2.5 z-50 animate-in fade-in duration-200 max-h-96 overflow-y-auto">
                  <div className="px-4 py-1.5 border-b border-zinc-100 mb-1 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Search Results ({filteredResults.length})</p>
                  </div>

                  {filteredResults.length > 0 ? (
                    filteredResults.map(prod => (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod.id)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50/60 cursor-pointer transition-colors border-b border-zinc-50 last:border-0"
                      >
                        <img 
                          src={prod.imageSrc} 
                          alt={prod.name} 
                          className="w-10 h-10 object-contain bg-slate-50 rounded-lg p-1 border border-zinc-100 shrink-0" 
                        />
                        <div className="grow min-w-0">
                          <p className="text-xs font-black text-zinc-900 truncate">{prod.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{prod.category || 'Mocktail'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-emerald-900">₹{prod.price}/-</p>
                          {prod.stock <= 0 && (
                            <span className="text-[8px] font-black text-rose-500 uppercase">Out of stock</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center space-y-1">
                      <span className="material-symbols-outlined text-2xl text-zinc-300">search_off</span>
                      <p className="text-xs font-bold text-zinc-600">No mocktails found for &quot;{query}&quot;</p>
                      <p className="text-[10px] text-zinc-400">Try searching for &apos;Virgin Mojito&apos;, &apos;Pouch&apos;, or &apos;Jar&apos;</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center Column: Logo */}
          <div className="flex-initial flex justify-center items-center">
            <img 
              src="/nin.jpeg" 
              alt="Ninjaro Logo" 
              onClick={() => {
                if (window.location.pathname !== '/') {
                  router.push('/');
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="h-8 md:h-12 w-auto object-contain cursor-pointer select-none" 
            />
          </div>

          {/* Right Column: Actions */}
          <div className="flex-1 flex justify-end items-center gap-1.5 md:gap-3">
            {/* Shop Direct Icon (Left of Avatar) */}
            <button 
              onClick={() => router.push('/shop')}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-zinc-800 transition-colors hover:bg-zinc-100 shrink-0 cursor-pointer"
              aria-label="Shop showcase"
              title="Shop Showcase"
            >
              <span className="material-symbols-outlined text-lg md:text-xl">storefront</span>
            </button>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button 
                onClick={() => {
                  if (currentUser) {
                    setIsProfileMenuOpen(!isProfileMenuOpen);
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-zinc-800 transition-colors hover:bg-zinc-100 shrink-0"
                aria-label="Profile dropdown"
              >
                <span className="material-symbols-outlined text-lg md:text-xl">person</span>
              </button>

              {isProfileMenuOpen && currentUser && (
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-1.5 border-b border-zinc-100 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Account</p>
                    <p className="text-xs font-bold text-zinc-800 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{currentUser.email}</p>
                  </div>
                  <Link 
                    href="/profile" 
                    onClick={() => setIsProfileMenuOpen(false)} 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-50 text-zinc-800"
                  >
                    <span className="material-symbols-outlined text-lg text-zinc-400">account_circle</span>
                    <span className="font-bold text-xs tracking-tight">Profile</span>
                  </Link>
                  <Link 
                    href="/track-order" 
                    onClick={() => setIsProfileMenuOpen(false)} 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-50 text-zinc-800"
                  >
                    <span className="material-symbols-outlined text-lg text-zinc-400">local_shipping</span>
                    <span className="font-bold text-xs tracking-tight">Track Order</span>
                  </Link>
                  {currentUser.role === 'admin' && (
                    <Link 
                      href="/admin" 
                      onClick={() => setIsProfileMenuOpen(false)} 
                      className="flex items-center gap-3 px-4 py-2 hover:bg-emerald-50 text-emerald-800"
                    >
                      <span className="material-symbols-outlined text-lg text-emerald-500">dashboard</span>
                      <span className="font-bold text-xs tracking-tight">Admin Dashboard</span>
                    </Link>
                  )}
                  <div className="mx-4 my-1.5 h-px bg-zinc-100"></div>
                  <button 
                    onClick={() => {
                      logoutUser();
                      setCurrentUser(null);
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 text-left"
                  >
                    <span className="material-symbols-outlined text-lg text-red-600/40">logout</span>
                    <span className="font-bold text-xs tracking-tight">Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cart bag trigger */}
            <button 
              onClick={onOpenCart} 
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100 text-zinc-800 flex items-center justify-center relative hover:scale-105 active:scale-95 transition-all shadow-xs shrink-0"
              aria-label="Open cart"
            >
              <span className="material-symbols-outlined text-lg md:text-[20px]">shopping_bag</span>
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] md:text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white shadow-sm">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Horizontal Navigation Bar (Desktop only) */}
        <div className="hidden lg:flex justify-center border-t border-zinc-100 py-3.5 w-full bg-white">
          <nav className="flex items-center gap-8 text-xs font-black tracking-widest uppercase text-zinc-700">
            <button 
              onClick={() => {
                if (window.location.pathname !== '/') {
                  router.push('/#signature-combos');
                } else {
                  const el = document.getElementById('signature-combos') || document.getElementById('combos');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-black hover:border-b-2 hover:border-black pb-1 -mb-1 transition-colors cursor-pointer text-rose-600 font-extrabold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">local_offer</span> Special Offers
            </button>
            <button 
              onClick={() => {
                if (window.location.pathname !== '/') {
                  router.push('/#20gm-pouch-5pc');
                } else {
                  document.getElementById('20gm-pouch-5pc')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-black hover:border-b-2 hover:border-black pb-1 -mb-1 transition-colors cursor-pointer"
            >
              Pouches
            </button>
            <button 
              onClick={() => {
                if (window.location.pathname !== '/') {
                  router.push('/#jar-500gm');
                } else {
                  document.getElementById('jar-500gm')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-black hover:border-b-2 hover:border-black pb-1 -mb-1 transition-colors cursor-pointer"
            >
              Jars
            </button>
            <button 
              onClick={() => {
                if (window.location.pathname !== '/') {
                  router.push('/#ritual-section');
                } else {
                  document.getElementById('ritual-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-black hover:border-b-2 hover:border-black pb-1 -mb-1 transition-colors cursor-pointer"
            >
              The Ritual
            </button>
            <button 
              onClick={() => {
                if (window.location.pathname !== '/') {
                  router.push('/#reviews');
                } else {
                  document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
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
          <img src="/nin.jpeg" alt="Ninjaro Logo" className="h-9 w-auto object-contain" />
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-9 h-9 rounded-full bg-zinc-200/60 hover:bg-zinc-300 flex items-center justify-center text-zinc-800 hover:text-black transition-all select-none focus:outline-none"
            aria-label="Close mobile menu"
          >
            <span className="material-symbols-outlined text-lg leading-none select-none">close</span>
          </button>
        </div>

        {/* Mobile Search Bar */}
        <div className="p-4 border-b border-zinc-100">
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-3 text-zinc-400 text-lg pointer-events-none">search</span>
            <input 
              type="text" 
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Search mocktails..." 
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all" 
            />
          </div>

          {query.trim() !== '' && filteredResults.length > 0 && (
            <div className="mt-2 bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
              {filteredResults.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSelectProduct(p.id);
                  }}
                  className="p-2 flex items-center gap-2 text-xs font-bold text-zinc-900 hover:bg-emerald-50"
                >
                  <img src={p.imageSrc} alt={p.name} className="w-7 h-7 object-contain bg-slate-50 rounded" />
                  <span className="truncate">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grow p-6 flex flex-col gap-6 text-sm font-black uppercase tracking-wider text-emerald-950">
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (window.location.pathname !== '/') {
                router.push('/#signature-combos');
              } else {
                const el = document.getElementById('signature-combos') || document.getElementById('combos');
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            }} 
            className="text-left py-2 border-b border-emerald-900/5 text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">local_offer</span> Special Offers
          </button>
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (window.location.pathname !== '/') {
                router.push('/#20gm-pouch-5pc');
              } else {
                document.getElementById('20gm-pouch-5pc')?.scrollIntoView({ behavior: 'smooth' });
              }
            }} 
            className="text-left py-2 border-b border-emerald-900/5 hover:text-emerald-600 transition-colors"
          >
            Pouches
          </button>
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (window.location.pathname !== '/') {
                router.push('/#jar-500gm');
              } else {
                document.getElementById('jar-500gm')?.scrollIntoView({ behavior: 'smooth' });
              }
            }} 
            className="text-left py-2 border-b border-emerald-900/5 hover:text-emerald-600 transition-colors"
          >
            Jars
          </button>
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (window.location.pathname !== '/') {
                router.push('/#ritual-section');
              } else {
                document.getElementById('ritual-section')?.scrollIntoView({ behavior: 'smooth' });
              }
            }} 
            className="text-left py-2 border-b border-emerald-900/5 hover:text-emerald-600 transition-colors"
          >
            The Ritual
          </button>
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (window.location.pathname !== '/') {
                router.push('/#reviews');
              } else {
                document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
              }
            }} 
            className="text-left py-2 border-b border-emerald-900/5 hover:text-emerald-600 transition-colors"
          >
            Reviews
          </button>
        </div>
      </div>

      {/* Auth Gate Modal */}
      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          onSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
          }}
        />
      )}
    </>
  );
}
