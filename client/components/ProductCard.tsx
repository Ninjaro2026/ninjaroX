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
  isCombo,
  comboImages,
  onAddToCart,
  onUpdateQuantity,
}: ProductCardProps) {
  
  // Calculate discount percentage dynamically
  const numPrice = parseInt(price.replace(/[^\d]/g, '')) || 0;
  const numMrp = mrp ? (parseInt(mrp.replace(/[^\d]/g, '')) || 0) : 0;
  const discountPct = numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;

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

        {/* Black Best Seller Badge */}
        {isBestSeller && (
          <span className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 bg-black text-white text-[7px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-xs shadow-xs z-20 tracking-wider">
            Best Seller
          </span>
        )}

        {/* Combo Badge */}
        {isCombo && (
          <span className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-emerald-950 text-white text-[7px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs z-20 tracking-wider">
            Combo Bundle
          </span>
        )}

        {/* Product Image OR Combo Multi-Image Composite Frame */}
        {isCombo && comboImages && comboImages.length > 0 ? (
          <div className="w-full h-full relative flex items-center justify-center p-2 z-10">
            {comboImages.length === 1 && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  src={comboImages[0].src} 
                  alt={comboImages[0].name || imageAlt}
                  className="h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
                />
                {comboImages[0].count && comboImages[0].count > 1 && (
                  <span className="absolute bottom-1 right-2 bg-emerald-950 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-md z-20">
                    {comboImages[0].count}x
                  </span>
                )}
              </div>
            )}

            {comboImages.length === 2 && (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-1/2 h-4/5 -mr-4 transform -rotate-6 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-105 z-10 flex items-center justify-center">
                  <img src={comboImages[0].src} alt={comboImages[0].name || ''} className="w-full h-full object-contain drop-shadow-lg" />
                  {comboImages[0].count && comboImages[0].count > 0 && (
                    <span className="absolute bottom-0 left-0 bg-emerald-950 text-white font-black text-[8px] px-1.5 py-0.5 rounded-md shadow-md z-20">
                      {comboImages[0].count}x
                    </span>
                  )}
                </div>
                <div className="relative w-1/2 h-4/5 transform rotate-6 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105 z-20 flex items-center justify-center">
                  <img src={comboImages[1].src} alt={comboImages[1].name || ''} className="w-full h-full object-contain drop-shadow-lg" />
                  {comboImages[1].count && comboImages[1].count > 0 && (
                    <span className="absolute bottom-0 right-0 bg-emerald-950 text-white font-black text-[8px] px-1.5 py-0.5 rounded-md shadow-md z-20">
                      {comboImages[1].count}x
                    </span>
                  )}
                </div>
              </div>
            )}

            {comboImages.length === 3 && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Left Item */}
                <div className="absolute left-1 w-2/5 h-3/4 transform -rotate-12 -translate-x-1 scale-95 opacity-90 transition-all duration-300 group-hover:-rotate-16 group-hover:-translate-x-2 z-10 flex items-center justify-center">
                  <img src={comboImages[0].src} alt={comboImages[0].name || ''} className="w-full h-full object-contain drop-shadow-md" />
                  {comboImages[0].count && comboImages[0].count > 0 && (
                    <span className="absolute -bottom-1 left-0 bg-emerald-950 text-white font-black text-[7px] px-1.5 py-0.5 rounded-md shadow-sm">
                      {comboImages[0].count}x
                    </span>
                  )}
                </div>
                {/* Center Item */}
                <div className="relative w-2/5 h-full z-30 transform transition-transform duration-300 group-hover:scale-110 flex items-center justify-center">
                  <img src={comboImages[1].src} alt={comboImages[1].name || ''} className="w-full h-full object-contain drop-shadow-xl" />
                  {comboImages[1].count && comboImages[1].count > 0 && (
                    <span className="absolute bottom-0 right-0 bg-emerald-950 text-white font-black text-[8px] px-1.5 py-0.5 rounded-md shadow-md z-40">
                      {comboImages[1].count}x
                    </span>
                  )}
                </div>
                {/* Right Item */}
                <div className="absolute right-1 w-2/5 h-3/4 transform rotate-12 translate-x-1 scale-95 opacity-90 transition-all duration-300 group-hover:rotate-16 group-hover:translate-x-2 z-20 flex items-center justify-center">
                  <img src={comboImages[2].src} alt={comboImages[2].name || ''} className="w-full h-full object-contain drop-shadow-md" />
                  {comboImages[2].count && comboImages[2].count > 0 && (
                    <span className="absolute -bottom-1 right-0 bg-emerald-950 text-white font-black text-[7px] px-1.5 py-0.5 rounded-md shadow-sm">
                      {comboImages[2].count}x
                    </span>
                  )}
                </div>
              </div>
            )}

            {comboImages.length >= 4 && (
              <div className="w-full h-full grid grid-cols-2 gap-1 p-1">
                {comboImages.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="relative w-full h-full flex items-center justify-center p-0.5 bg-white/40 rounded-lg border border-zinc-200/50">
                    <img src={item.src} alt={item.name || ''} className="h-full max-h-20 object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300" />
                    {item.count && item.count > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 bg-emerald-950 text-white font-black text-[7px] px-1 py-0.2 rounded-xs shadow-xs">
                        {item.count}x
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <img 
            className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-300" 
            src={imageSrc}
            alt={imageAlt}
          />
        )}
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
              <span className="text-[8px] sm:text-[9px] line-through text-zinc-400 font-bold tracking-wider">
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
