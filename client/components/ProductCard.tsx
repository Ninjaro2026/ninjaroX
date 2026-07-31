import React from 'react';
import Link from 'next/link';

export interface ComboItemInfo {
  src: string;
  count?: number;
  name?: string;
}

export interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: string;
  imageSrc: string;
  imageAlt: string;
  topBgColor: string;
  bottomBgColor: string;
  buttonTextColor: string;
  quantity: number;
  stock: number;
  mrp?: string;
  isBestSeller?: boolean;
  customTag?: string;
  tagPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  tagColor?: string;
  isCombo?: boolean;
  comboImages?: ComboItemInfo[];
  onAddToCart: () => void;
  onUpdateQuantity: (delta: number) => void;
}

export function ProductCard({
  id,
  name,
  description,
  price,
  imageSrc,
  imageAlt,
  topBgColor,
  bottomBgColor,
  buttonTextColor,
  quantity,
  stock,
  mrp,
  isBestSeller,
  customTag,
  tagPosition = 'top-left',
  tagColor = 'black',
  isCombo,
  comboImages,
  onAddToCart,
  onUpdateQuantity,
}: ProductCardProps) {
  
  // Calculate discount percentage dynamically
  const numPrice = parseInt(price.replace(/[^\d]/g, '')) || 0;
  const numMrp = mrp ? (parseInt(mrp.replace(/[^\d]/g, '')) || 0) : 0;
  const discountPct = numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;

  // Resolve custom tag text
  const activeTagText = customTag ? customTag.trim() : (isBestSeller ? 'Best Seller' : null);

  // Resolve tag placement class
  const getTagPositionClass = (pos: string) => {
    switch (pos) {
      case 'top-right': return 'top-2.5 right-2.5 sm:top-3 sm:right-3';
      case 'bottom-right': return 'bottom-2.5 right-2.5 sm:bottom-3 sm:right-3';
      case 'bottom-left': return 'bottom-2.5 left-2.5 sm:bottom-3 sm:left-3';
      case 'top-left':
      default: return 'top-2.5 left-2.5 sm:top-3 sm:left-3';
    }
  };

  // Resolve tag color theme class
  const getTagColorClass = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-900 text-white';
      case 'amber': return 'bg-amber-500 text-white';
      case 'rose': return 'bg-rose-600 text-white';
      case 'indigo': return 'bg-indigo-600 text-white';
      case 'purple': return 'bg-purple-600 text-white';
      case 'black':
      default: return 'bg-black text-white';
    }
  };

  return (
    <div className="group flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-zinc-200/80 bg-white font-poppins relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full">
      {/* Compact Clean Image Container with Link */}
      <Link href={`/products/${id}`} className="relative h-44 sm:h-52 md:h-56 lg:h-60 p-2 sm:p-3 flex flex-col justify-center items-center overflow-hidden bg-slate-50/60 border-b border-zinc-100 cursor-pointer">
        {/* TOP LEFT BADGES COLUMN */}
        <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 z-20 flex flex-col items-start gap-1 pointer-events-none">
          {activeTagText && tagPosition !== 'top-right' && (
            <span className={`${getTagColorClass(tagColor)} text-[8px] sm:text-[10px] font-black uppercase px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs tracking-wider select-none`}>
              {activeTagText}
            </span>
          )}
          {stock > 0 && stock < 10 && (
            <span className="bg-amber-500 text-white font-extrabold tracking-wider text-[8px] sm:text-[10px] uppercase px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs animate-pulse select-none">
              Only {stock} Left!
            </span>
          )}
        </div>

        {/* TOP RIGHT BADGES COLUMN */}
        <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-20 flex flex-col items-end gap-1 pointer-events-none">
          {activeTagText && tagPosition === 'top-right' && (
            <span className={`${getTagColorClass(tagColor)} text-[8px] sm:text-[10px] font-black uppercase px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs tracking-wider select-none`}>
              {activeTagText}
            </span>
          )}
          {discountPct > 0 && (
            <span className="bg-[#f43f5e] text-white text-[8px] sm:text-[10px] font-black uppercase px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs select-none">
              {discountPct}% OFF
            </span>
          )}
          {isCombo && (
            <span className="bg-emerald-950 text-white text-[8px] sm:text-[10px] font-black uppercase px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-xs tracking-wider select-none">
              Combo Bundle
            </span>
          )}
        </div>

        {/* Product Image */}
        <img 
          className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-300" 
          src={imageSrc}
          alt={imageAlt}
        />
      </Link>

      {/* Info card text and buttons */}
      <div className="p-3.5 sm:p-5 flex flex-col justify-between grow bg-white">
        <div>
          <Link href={`/products/${id}`} className="block hover:underline">
            <h3 className="font-outfit text-zinc-900 font-bold text-xs sm:text-sm uppercase tracking-wide leading-snug group-hover:text-emerald-950 transition-colors wrap-break-word">{name}</h3>
          </Link>
          <p className="font-jakarta text-[10px] sm:text-xs text-zinc-500 font-medium leading-normal mt-1.5 h-7 sm:h-9 overflow-hidden line-clamp-2 whitespace-pre-line">{description}</p>
        </div>

        {/* Price & Buy Button container */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-3.5 border-t border-zinc-100 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-col">
            {mrp && (
              <span className="font-outfit text-[11px] sm:text-xs line-through text-red-500 font-bold tracking-wide">
                MRP: {mrp}
              </span>
            )}
            <span className="font-outfit text-base sm:text-xl font-extrabold text-zinc-900 tracking-tight">{price}</span>
          </div>

          <div className="w-24 sm:w-32 flex justify-end shrink-0">
            {stock <= 0 ? (
              <span className="font-outfit text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-500 border border-red-200 px-2 py-1.5 rounded-xl shadow-xs text-center w-full">
                Out of Stock
              </span>
            ) : quantity > 0 ? (
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-900/10 h-8 sm:h-10 w-full rounded-xl sm:rounded-2xl flex items-center justify-between shadow-xs overflow-hidden">
                <button 
                  onClick={() => onUpdateQuantity(-1)} 
                  className="w-7 sm:w-9 h-full flex items-center justify-center hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs sm:text-sm font-bold">remove</span>
                </button>
                <span className="font-outfit text-center font-bold text-xs sm:text-sm">{quantity}</span>
                <button 
                  onClick={() => onUpdateQuantity(1)} 
                  className="w-7 sm:w-9 h-full flex items-center justify-center hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs sm:text-sm font-bold">add</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={onAddToCart} 
                className="font-outfit bg-emerald-950 hover:bg-emerald-800 text-white font-bold tracking-wider uppercase text-[9px] sm:text-xs h-8 sm:h-10 px-3 sm:px-4 rounded-xl sm:rounded-2xl shadow-xs hover:shadow-md active:scale-95 transition-all w-full flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs sm:text-sm hidden sm:inline-block">shopping_cart</span>
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
