"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchProducts, fetchProductById, addProductReview, getLoggedInUser } from '../../../lib/api';
import { Product, getStoredCart, saveStoredCart, getProductStock, DEFAULT_PRODUCTS } from '../../../lib/store';
import { ProductCard } from '../../../components/ProductCard';
import { ProductCardSkeleton } from '../../../components/Skeleton';
import { AuthModal } from '../../../components/AuthModal';
import { Navbar } from '../../../components/Navbar';
import { Footer } from '../../../components/Footer';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified?: boolean;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = (params.id as string) || '';

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cart & Auth state
  const [cartItems, setCartItems] = useState<{name: string, price: string, img: string, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  // Recently Viewed State
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  // Interactive Mouse Pointer Zoom State (Amazon / Flipkart Style)
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  // Review Form State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setCurrentUser(getLoggedInUser());
    
    // Load stored cart
    const cart = getStoredCart();
    setCartItems(cart.map(c => ({
      name: c.name,
      price: `₹${c.price}/-`,
      img: c.img,
      quantity: c.quantity
    })));

    if (!productId) return;

    setLoading(true);
    Promise.all([fetchProducts(), fetchProductById(productId)])
      .then(([productsList, currentProd]) => {
        const prodList = productsList && productsList.length > 0 ? productsList : DEFAULT_PRODUCTS;
        setAllProducts(prodList);

        const foundProd = currentProd || prodList.find((p: Product) => p.id === productId);
        if (foundProd) {
          setProduct(foundProd);
          setReviews(foundProd.reviews || getInitialMockReviews(foundProd.name));

          // Save to Recently Viewed in localStorage
          updateRecentlyViewed(foundProd, prodList);
        } else {
          setError('Product not found.');
        }
      })
      .catch(err => {
        console.warn('API error fetching product details:', err);
        const prodList = DEFAULT_PRODUCTS;
        setAllProducts(prodList);
        const found = prodList.find(p => p.id === productId);
        if (found) {
          setProduct(found);
          setReviews(getInitialMockReviews(found.name));
          updateRecentlyViewed(found, prodList);
        } else {
          setError('Could not load product details.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  const updateRecentlyViewed = (current: Product, list: Product[]) => {
    try {
      const storedIds: string[] = JSON.parse(localStorage.getItem('nz_recently_viewed') || '[]');
      const filteredIds = [current.id, ...storedIds.filter(id => id !== current.id)].slice(0, 6);
      localStorage.setItem('nz_recently_viewed', JSON.stringify(filteredIds));

      const recentProds = filteredIds
        .map(id => list.find(p => p.id === id))
        .filter((p): p is Product => p !== undefined && p.id !== current.id);
      setRecentlyViewed(recentProds);
    } catch (e) {
      console.warn('Error updating recently viewed products', e);
    }
  };

  const getInitialMockReviews = (name: string): Review[] => [
    {
      id: 'rev-1',
      userName: 'Aarav Sharma',
      rating: 5,
      comment: `Incredible taste! The ${name} is so authentic and refreshing. Tastes just like a luxury cocktail lounge drink.`,
      date: 'July 14, 2026',
      verified: true
    },
    {
      id: 'rev-2',
      userName: 'Priya Patel',
      rating: 5,
      comment: 'Super easy 30-second preparation. Mixed with chilled water and ice, perfect for house parties!',
      date: 'July 10, 2026',
      verified: true
    },
    {
      id: 'rev-3',
      userName: 'Rohan Mehta',
      rating: 4,
      comment: 'Great flavor balance and premium packaging. Will definitely order the combo next time.',
      date: 'June 28, 2026',
      verified: true
    }
  ];

  // Mouse move handler for Flipkart / Amazon Zoom lens effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    const stockVal = getProductStock(product, allProducts);
    const existingInCart = cartItems.find(i => i.name === product.name)?.quantity || 0;
    
    if (existingInCart + quantity > stockVal) {
      alert(`Sorry, only ${stockVal} units of ${product.name} are available in stock.`);
      return;
    }

    const priceStr = `₹${product.price}/-`;
    const newCart = [...cartItems];
    const existingIdx = newCart.findIndex(i => i.name === product.name);
    if (existingIdx > -1) {
      newCart[existingIdx].quantity += quantity;
    } else {
      newCart.push({
        name: product.name,
        price: priceStr,
        img: product.imageSrc,
        quantity: quantity
      });
    }

    setCartItems(newCart);
    saveStoredCart(newCart.map(c => ({
      name: c.name,
      price: parseInt(c.price.replace(/[^\d]/g, '')) || product.price,
      img: c.img,
      quantity: c.quantity
    })));

    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    const loggedUser = getLoggedInUser();
    if (!loggedUser) {
      setIsAuthModalOpen(true);
    } else {
      router.push('/checkout');
    }
  };

  const updateCartQuantity = (name: string, delta: number) => {
    const newCart = cartItems.map(c => {
      if (c.name === name) {
        return { ...c, quantity: c.quantity + delta };
      }
      return c;
    }).filter(c => c.quantity > 0);

    setCartItems(newCart);
    saveStoredCart(newCart.map(c => ({
      name: c.name,
      price: parseInt(c.price.replace(/[^\d]/g, '')) || 0,
      img: c.img,
      quantity: c.quantity
    })));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewComment.trim() || !product) return;

    setSubmittingReview(true);
    try {
      const res = await addProductReview(product.id, {
        userName: reviewerName.trim(),
        rating: reviewRating,
        comment: reviewComment.trim()
      });

      if (res && res.reviews) {
        setReviews(res.reviews);
      } else {
        const newRev: Review = {
          id: 'rev-' + Date.now(),
          userName: reviewerName.trim(),
          rating: reviewRating,
          comment: reviewComment.trim(),
          date: 'Just now',
          verified: true
        };
        setReviews(prev => [newRev, ...prev]);
      }

      setReviewComment('');
      setIsWritingReview(false);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf8] font-poppins p-6 md:p-12">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-xl w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="h-96 bg-slate-200 rounded-3xl"></div>
            <div className="space-y-4">
              <div className="h-10 bg-slate-200 rounded-xl w-3/4"></div>
              <div className="h-6 bg-slate-200 rounded-xl w-1/2"></div>
              <div className="h-32 bg-slate-200 rounded-2xl w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#f7faf8] font-poppins flex flex-col items-center justify-center p-6 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-emerald-900/30">search_off</span>
        <h2 className="text-2xl font-black text-emerald-900 uppercase tracking-tight">Product Not Found</h2>
        <p className="text-sm font-semibold text-emerald-900/60 max-w-md">The requested product premix may have been updated or is currently unavailable.</p>
        <Link href="/" className="bg-emerald-900 text-white px-6 py-3 rounded-full font-black uppercase text-xs tracking-widest hover:bg-emerald-800 transition-all shadow-md">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const stockVal = getProductStock(product, allProducts);
  const numPrice = product.price;
  const numMrp = product.mrp || 0;
  const discountPct = numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;
  const relatedProducts = allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);
  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1);

  const rawGalleryPhotos = [
    ...(product.imageSrc ? [product.imageSrc] : []),
    ...(Array.isArray(product.images) ? product.images.filter(Boolean) : [])
  ];
  const galleryPhotos = Array.from(new Set(rawGalleryPhotos));
  if (galleryPhotos.length === 0) galleryPhotos.push('/bluelagoonjar.jpeg');

  const currentActivePhoto = galleryPhotos[activeImageIndex] || galleryPhotos[0] || product.imageSrc;

  const handlePrevPhoto = () => {
    setActiveImageIndex(prev => (prev === 0 ? galleryPhotos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setActiveImageIndex(prev => (prev === galleryPhotos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] font-poppins text-emerald-900 selection:bg-emerald-200">
      
      {/* Universal Consistent Header */}
      <Navbar 
        totalCartItems={cartItems.reduce((a, b) => a + b.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Breadcrumb Bar */}
      <div className="bg-slate-50/90 border-b border-zinc-200/80 py-2.5 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider overflow-x-auto no-scrollbar whitespace-nowrap">
          <Link href="/" className="hover:text-zinc-900 flex items-center gap-1 shrink-0 text-emerald-800">
            <span className="material-symbols-outlined text-base">home</span>
            <span>Home</span>
          </Link>
          <span className="text-zinc-300 shrink-0">/</span>
          <span className="text-zinc-500 shrink-0 max-w-30 sm:max-w-none truncate">
            {product.category || 'Mocktail'}
          </span>
          <span className="text-zinc-300 shrink-0">/</span>
          <span className="text-zinc-900 font-black truncate max-w-35 sm:max-w-none shrink-0">
            {product.name}
          </span>
        </div>
      </div>

      {/* Main Product Showcase Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 sm:space-y-16 pb-24 lg:pb-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Mouse Pointer Zoom Image Gallery */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24">
            <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-md overflow-hidden group">
              
              {/* Product Badges */}
              <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                {stockVal > 0 && stockVal < 10 && (
                  <span className="bg-amber-500 text-white text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs animate-pulse">
                    Only {stockVal} Left
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="bg-rose-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-0.5 sm:py-1 rounded-md shadow-xs">
                    {discountPct}% OFF
                  </span>
                )}
              </div>

              {/* Photo Count Pill */}
              {galleryPhotos.length > 1 && (
                <div className="absolute top-3 right-3 z-20 bg-slate-900/80 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/20 font-bold shadow-xs">
                  {activeImageIndex + 1} / {galleryPhotos.length}
                </div>
              )}

              {/* Left / Right Slider Control Arrows */}
              {galleryPhotos.length > 1 && (
                <>
                  <button 
                    type="button"
                    onClick={handlePrevPhoto}
                    aria-label="Previous Photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-emerald-900 shadow-lg flex items-center justify-center border border-slate-200/80 transition-all active:scale-90 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg sm:text-xl font-bold">chevron_left</span>
                  </button>

                  <button 
                    type="button"
                    onClick={handleNextPhoto}
                    aria-label="Next Photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 hover:text-emerald-900 shadow-lg flex items-center justify-center border border-slate-200/80 transition-all active:scale-90 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg sm:text-xl font-bold">chevron_right</span>
                  </button>
                </>
              )}

              {/* Main Interactive Zoom Box */}
              <div 
                ref={imgRef}
                onMouseEnter={() => setIsZooming(true)}
                onMouseLeave={() => setIsZooming(false)}
                onMouseMove={handleMouseMove}
                className="relative h-64 sm:h-80 md:h-105 lg:h-115 w-full flex items-center justify-center p-4 sm:p-6 cursor-crosshair overflow-hidden"
              >
                {/* Standard Photo */}
                <img 
                  src={currentActivePhoto} 
                  alt={product.imageAlt || product.name}
                  className={`w-full h-full object-contain transition-opacity duration-200 ${isZooming ? 'opacity-20' : 'opacity-100'}`}
                />

                {/* Amazon / Flipkart Style Magnifying Lens Box */}
                {isZooming && (
                  <div 
                    className="absolute inset-0 z-30 pointer-events-none transition-all duration-75"
                    style={{
                      backgroundImage: `url(${currentActivePhoto})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: '280%',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    <div className="absolute bottom-4 left-4 bg-emerald-900/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
                      <span className="material-symbols-outlined text-xs">zoom_in</span> Ultra Magnified HD View
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Hover Instruction helper */}
              <div className="hidden md:flex items-center justify-center gap-1.5 bg-slate-50 border-t border-zinc-200/60 py-2.5 px-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <span className="material-symbols-outlined text-sm">filter_center_focus</span> Hover cursor over image to magnify details
              </div>
            </div>

            {/* Interactive Thumbnail Carousel Strip */}
            {galleryPhotos.length > 1 && (
              <div className="flex items-center gap-3 sm:gap-3.5 overflow-x-auto custom-scrollbar p-2 -mx-1">
                {galleryPhotos.map((photoUrl, idx) => {
                  const isActive = idx === activeImageIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border bg-white p-1.5 overflow-hidden transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'border-emerald-600 ring-2 ring-emerald-600/40 shadow-md scale-105 z-10'
                          : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <img 
                        src={photoUrl} 
                        alt={`${product.name} photo ${idx + 1}`} 
                        className="w-full h-full object-contain"
                      />
                      {isActive && (
                        <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-600"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Product Specifications, Pricing & Actions */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            
            {/* Header info */}
            <div className="space-y-2 border-b border-zinc-200/80 pb-4 sm:pb-6">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-900 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                  {product.category || 'Premium Mocktail'}
                </span>
                {product.isCombo && (
                  <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                    Combo Bundle
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black italic uppercase tracking-tight text-zinc-900 leading-tight">{product.name}</h1>
              
              {/* Rating Summary Pill */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1 bg-emerald-900 text-white px-2.5 py-0.5 rounded-lg text-xs font-black shadow-xs">
                  <span>{avgRating}</span>
                  <span className="material-symbols-outlined text-xs leading-none">star</span>
                </div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{reviews.length} Verified Reviews</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-xs space-y-2 sm:space-y-3">
              <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap">
                <span className="text-2xl sm:text-4xl font-black text-emerald-900">₹{product.price}/-</span>
                {numMrp > numPrice && (
                  <span className="text-sm sm:text-lg text-red-600 line-through font-extrabold">MRP: ₹{numMrp}/-</span>
                )}
                {discountPct > 0 && (
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-600 px-2.5 py-0.5 sm:py-1 rounded-lg border border-rose-200">
                    Save {discountPct}%
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-emerald-600">verified</span> Inclusive of all taxes & free shipping above ₹249
              </p>
            </div>

            {/* Description */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Product Details & Highlights</span>
              <p className="text-xs sm:text-sm font-semibold text-zinc-800 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Action Buttons & Quantity */}
            {(() => {
              const inCartQty = cartItems.find(i => i.name === product.name)?.quantity || 0;
              return (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-900">Quantity:</span>
                      <div className="flex items-center bg-white border border-zinc-300 rounded-xl h-10 px-1 shadow-xs">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-full flex items-center justify-center text-zinc-900 hover:bg-zinc-100 rounded-lg active:scale-95"
                        >
                          <span className="material-symbols-outlined text-xs font-bold">remove</span>
                        </button>
                        <span className="w-8 text-center font-black text-xs text-zinc-900">{quantity}</span>
                        <button 
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-8 h-full flex items-center justify-center text-zinc-900 hover:bg-zinc-100 rounded-lg active:scale-95"
                        >
                          <span className="material-symbols-outlined text-xs font-bold">add</span>
                        </button>
                      </div>
                    </div>

                    {inCartQty > 0 && (
                      <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-950 px-3 py-1.5 rounded-full border border-emerald-300 text-xs font-black uppercase tracking-wider shadow-xs animate-in zoom-in-95">
                        <span className="material-symbols-outlined text-sm text-emerald-700">check_circle</span>
                        <span>{inCartQty} in Cart</span>
                      </div>
                    )}
                  </div>

                  {/* Desktop CTA Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button 
                      onClick={handleAddToCart}
                      disabled={stockVal <= 0}
                      className="bg-emerald-900 hover:bg-emerald-800 text-white font-black py-3 sm:py-3.5 px-3 sm:px-6 rounded-2xl uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50 min-h-11"
                    >
                      <span className="material-symbols-outlined text-base">shopping_bag</span>
                      {inCartQty > 0 ? `Add +${quantity} More to Bag` : 'Add to Bag'}
                    </button>

                    <button 
                      onClick={handleBuyNow}
                      disabled={stockVal <= 0}
                      className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black py-3 sm:py-3.5 px-3 sm:px-6 rounded-2xl uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50 min-h-11"
                    >
                      <span className="material-symbols-outlined text-base">bolt</span>
                      Buy Now
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Value Props Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-zinc-200/80">
              <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-zinc-200/80 text-center space-y-0.5">
                <span className="material-symbols-outlined text-lg sm:text-xl text-emerald-700">bolt</span>
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-900">30-Sec Mix</p>
              </div>
              <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-zinc-200/80 text-center space-y-0.5">
                <span className="material-symbols-outlined text-lg sm:text-xl text-emerald-700">eco</span>
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-900">100% Vegan</p>
              </div>
              <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-zinc-200/80 text-center space-y-0.5">
                <span className="material-symbols-outlined text-lg sm:text-xl text-emerald-700">local_shipping</span>
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-900">Fast Express</p>
              </div>
            </div>

          </div>
        </div>

        {/* CUSTOMER REVIEWS SECTION (Read & Write) */}
        <section className="bg-white p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-zinc-900">Customer Reviews</h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-0.5">Verified buyer ratings & feedback</p>
            </div>

            <button 
              onClick={() => setIsWritingReview(!isWritingReview)}
              className="bg-emerald-900 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-sm">rate_review</span>
              {isWritingReview ? 'Close Form' : 'Write Review'}
            </button>
          </div>

          {/* Write Review Form */}
          {isWritingReview && (
            <form onSubmit={handleReviewSubmit} className="bg-zinc-50 p-4 sm:p-6 rounded-2xl border border-zinc-200 space-y-3 animate-in fade-in duration-300">
              <h4 className="font-black uppercase text-xs text-zinc-900 tracking-wider">Share Your Experience</h4>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Overall Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-amber-500 hover:scale-125 transition-transform"
                    >
                      <span className="material-symbols-outlined text-xl sm:text-2xl">
                        {star <= reviewRating ? 'star' : 'star_outline'}
                      </span>
                    </button>
                  ))}
                  <span className="text-xs font-black text-zinc-900 ml-2">{reviewRating} Stars</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Your Name</label>
                <input 
                  type="text"
                  required
                  value={reviewerName}
                  onChange={e => setReviewerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-emerald-600 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Review Feedback</label>
                <textarea 
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Tell us what you loved about the flavor and mixing experience..."
                  className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-600 transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={submittingReview}
                className="bg-emerald-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-900 shadow-xs disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Post Verified Review'}
              </button>
            </form>
          )}

          {/* Review Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-zinc-50/80 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 space-y-2.5 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-black text-xs sm:text-sm text-zinc-900">{rev.userName}</h5>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-xs text-emerald-600">verified</span> Verified Purchaser
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">{rev.date}</span>
                </div>

                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-sm">
                      {i < rev.rating ? 'star' : 'star_outline'}
                    </span>
                  ))}
                </div>

                <p className="text-xs font-semibold text-zinc-700 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RECENTLY VIEWED PRODUCTS CAROUSEL / ROW */}
        {recentlyViewed.length > 0 && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-lg">history</span> Recently Viewed Products
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {recentlyViewed.map((item) => {
                const priceStr = `₹${item.price}/-`;
                const mrpStr = item.mrp ? `₹${item.mrp}/-` : undefined;
                const stockValItem = getProductStock(item, allProducts);
                return (
                  <ProductCard 
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    description={item.description}
                    price={priceStr}
                    imageSrc={item.imageSrc}
                    imageAlt={item.imageAlt}
                    topBgColor={item.topBgColor}
                    bottomBgColor={item.bottomBgColor}
                    buttonTextColor={item.buttonTextColor}
                    quantity={cartItems.find(c => c.name === item.name)?.quantity || 0}
                    stock={stockValItem}
                    mrp={mrpStr}
                    isBestSeller={item.isBestSeller}
                    onAddToCart={() => {
                      const newCart = [...cartItems, { name: item.name, price: priceStr, img: item.imageSrc, quantity: 1 }];
                      setCartItems(newCart);
                      saveStoredCart(newCart.map(c => ({ name: c.name, price: parseInt(c.price.replace(/[^\d]/g, '')) || item.price, img: c.img, quantity: c.quantity })));
                      setIsCartOpen(true);
                    }}
                    onUpdateQuantity={(delta) => {
                      const newCart = cartItems.map(c => c.name === item.name ? { ...c, quantity: c.quantity + delta } : c).filter(c => c.quantity > 0);
                      setCartItems(newCart);
                      saveStoredCart(newCart.map(c => ({ name: c.name, price: parseInt(c.price.replace(/[^\d]/g, '')) || item.price, img: c.img, quantity: c.quantity })));
                    }}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-black italic uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-lg">recommend</span> Recommended Flavors
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((item) => {
                const priceStr = `₹${item.price}/-`;
                const mrpStr = item.mrp ? `₹${item.mrp}/-` : undefined;
                const stockValItem = getProductStock(item, allProducts);
                return (
                  <ProductCard 
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    description={item.description}
                    price={priceStr}
                    imageSrc={item.imageSrc}
                    imageAlt={item.imageAlt}
                    topBgColor={item.topBgColor}
                    bottomBgColor={item.bottomBgColor}
                    buttonTextColor={item.buttonTextColor}
                    quantity={cartItems.find(c => c.name === item.name)?.quantity || 0}
                    stock={stockValItem}
                    mrp={mrpStr}
                    isBestSeller={item.isBestSeller}
                    onAddToCart={() => {
                      const newCart = [...cartItems, { name: item.name, price: priceStr, img: item.imageSrc, quantity: 1 }];
                      setCartItems(newCart);
                      saveStoredCart(newCart.map(c => ({ name: c.name, price: parseInt(c.price.replace(/[^\d]/g, '')) || item.price, img: c.img, quantity: c.quantity })));
                      setIsCartOpen(true);
                    }}
                    onUpdateQuantity={(delta) => {
                      const newCart = cartItems.map(c => c.name === item.name ? { ...c, quantity: c.quantity + delta } : c).filter(c => c.quantity > 0);
                      setCartItems(newCart);
                      saveStoredCart(newCart.map(c => ({ name: c.name, price: parseInt(c.price.replace(/[^\d]/g, '')) || item.price, img: c.img, quantity: c.quantity })));
                    }}
                  />
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <Footer />

      {/* MOBILE STICKY BOTTOM ACTION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 p-3 px-4 flex items-center justify-between gap-3 shadow-[0_-8px_25px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={product.imageSrc} alt={product.name} className="w-10 h-10 object-contain rounded-lg bg-zinc-50 p-1 border border-zinc-200 shrink-0" />
          <div className="min-w-0">
            <p className="font-black text-xs text-zinc-900 truncate">{product.name}</p>
            <p className="font-black text-sm text-emerald-900">₹{product.price}/-</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleBuyNow}
            disabled={stockVal <= 0}
            className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black py-2.5 px-6 rounded-xl uppercase tracking-wider text-xs flex items-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">bolt</span>
            Buy Now
          </button>
        </div>
      </div>

      {/* Cart Sidebar Overlay */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 transition-opacity duration-300"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Cart Sidebar Drawer */}
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
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-emerald-900/30 space-y-4">
              <span className="material-symbols-outlined text-6xl opacity-50">shopping_basket</span>
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
                  <button onClick={() => updateCartQuantity(item.name, -1)} className="w-8 h-full flex items-center justify-center text-emerald-950 hover:bg-emerald-100 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span className="w-6 text-center text-emerald-950 text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.name, 1)} className="w-8 h-full flex items-center justify-center text-emerald-950 hover:bg-emerald-100 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
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

      {/* Auth Gate Modal */}
      {isAuthModalOpen && (
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          onSuccess={(user: any) => {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
