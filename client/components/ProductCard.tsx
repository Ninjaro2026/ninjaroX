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
    <div className="group flex flex-col rounded-2xl overflow-hidden shadow-xs border border-zinc-200/80 bg-white font-poppins relative hover:shadow-lg transition-all duration-300">
      {/* Compact Clean Image Container with Link */}
      <Link href={`/products/${id}`} className="relative h-44 sm:h-52 md:h-56 p-3 flex flex-col justify-center items-center overflow-hidden bg-slate-50/60 border-b border-zinc-100 cursor-pointer">
        {/* Low Stock Badge */}
        {stock > 0 && stock < 10 && (
          <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-amber-500 text-white font-extrabold tracking-wider text-[7px] sm:text-[9px] uppercase px-2 py-0.5 rounded-full shadow-xs z-20 animate-pulse">
            Only {stock} Left!
          </span>
        )}

        {/* Dynamic Red Discount Tag */}
        {discountPct > 0 && (
          <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-[#f43f5e] text-white text-[7px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs z-20">
            {discountPct}% OFF
          </span>
        )}

        {/* Custom Tag Badge */}
        {activeTagText && (
          <span className={`absolute ${getTagPositionClass(tagPosition)} ${getTagColorClass(tagColor)} text-[7px] sm:text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md shadow-xs z-20 tracking-wider`}>
            {activeTagText}
          </span>
        )}

        {/* Combo Badge */}
        {isCombo && (
          <span className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-emerald-950 text-white text-[7px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs z-20 tracking-wider">
            Combo Bundle
          </span>
        )}

        {/* Product Image */}
        <img 
          className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-300" 
          src={imageSrc}
          alt={imageAlt}
        />
      </Link>

      {/* Info card text and buttons */}
      <div className="p-3 sm:p-4 flex flex-col justify-between grow bg-white">
        <div>
          <Link href={`/products/${id}`} className="block hover:underline">
            <h3 className="text-zinc-900 font-extrabold text-xs sm:text-sm uppercase tracking-wide leading-tight group-hover:text-emerald-950 transition-colors truncate">{name}</h3>
          </Link>
          <p className="text-[9px] sm:text-[10px] text-zinc-500 font-medium leading-normal mt-1 h-6 sm:h-8 overflow-hidden line-clamp-2">{description}</p>
        </div>

        {/* Price & Buy Button container */}
        <div className="mt-2.5 sm:mt-3.5 pt-2.5 sm:pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {mrp && (
              <span className="text-[10px] sm:text-xs line-through text-red-600 font-extrabold tracking-wider">
                MRP: {mrp}
              </span>
            )}
            <span className="text-xs sm:text-base font-black text-zinc-900 tracking-tight">{price}</span>
          </div>

          <div className="w-24 sm:w-28 flex justify-end shrink-0">
            {stock <= 0 ? (
              <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-500 border border-red-200 px-2 py-1 rounded-full shadow-xs text-center w-full">
                Out of Stock
              </span>
            ) : quantity > 0 ? (
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-900/10 h-7 sm:h-8 w-full rounded-full flex items-center justify-between shadow-xs overflow-hidden">
                <button 
                  onClick={() => onUpdateQuantity(-1)} 
                  className="w-6 sm:w-7 h-full flex items-center justify-center hover:bg-emerald-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs font-bold">remove</span>
                </button>
                <span className="text-center font-black text-xs">{quantity}</span>
                <button 
                  onClick={() => onUpdateQuantity(1)} 
                  className="w-6 sm:w-7 h-full flex items-center justify-center hover:bg-emerald-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs font-bold">add</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={onAddToCart} 
                className="bg-emerald-950 hover:bg-emerald-800 text-white font-black tracking-widest uppercase text-[8px] sm:text-[9px] py-1.5 px-3 rounded-full shadow-xs hover:shadow-md active:scale-95 transition-all w-full flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-xs hidden sm:inline-block">shopping_cart</span>
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
