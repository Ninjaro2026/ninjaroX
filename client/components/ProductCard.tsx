import React from 'react';

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
  onAddToCart,
  onUpdateQuantity,
}: ProductCardProps) {
  
  // Calculate discount percentage dynamically
  const numPrice = parseInt(price.replace(/[^\d]/g, '')) || 0;
  const numMrp = mrp ? (parseInt(mrp.replace(/[^\d]/g, '')) || 0) : 0;
  const discountPct = numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;

  // Custom radial studio gradient backdrops matching the signature flavor colors
  const getFlavorGradient = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('blue lagoon')) {
      return 'radial-gradient(circle at center, #f0f7fa 0%, #cce3ec 100%)';
    } else if (lowerName.includes('virgin mojito')) {
      return 'radial-gradient(circle at center, #f2fbf6 0%, #d1f0e0 100%)';
    } else if (lowerName.includes('green mango')) {
      return 'radial-gradient(circle at center, #f2faf6 0%, #cbebe0 100%)';
    } else if (lowerName.includes('orange tang')) {
      return 'radial-gradient(circle at center, #fff9f0 0%, #ffe6cc 100%)';
    } else {
      // Warm golden glow for combos / default
      return 'radial-gradient(circle at center, #faf8f5 0%, #ebdcc5 100%)';
    }
  };

  return (
    <div className="group flex flex-col rounded-3xl overflow-hidden shadow-lg border border-zinc-100 bg-white font-poppins relative">
      {/* Image container with flavor studio backdrop */}
      <div 
        className="relative h-48 sm:h-64 md:h-72 p-4 sm:p-6 flex flex-col justify-center items-center overflow-hidden"
        style={{ background: getFlavorGradient(name) }}
      >
        {/* Low Stock Badge */}
        {stock > 0 && stock < 10 && (
          <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-amber-500 text-white font-extrabold tracking-wider text-[8px] sm:text-[10px] uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md z-20 animate-pulse">
            Only {stock} Left!
          </span>
        )}

        {/* Dynamic Red Discount Tag */}
        {discountPct > 0 && (
          <span className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#f43f5e] text-white text-[8px] sm:text-[10px] font-black uppercase px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md shadow-md z-20">
            {discountPct}% OFF
          </span>
        )}

        {/* Black Best Seller Badge */}
        {isBestSeller && (
          <span className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-black text-white text-[8px] sm:text-[10px] font-black uppercase px-2 py-1 sm:px-3 sm:py-1.5 rounded-sm shadow-md z-20 tracking-wider">
            Best Seller
          </span>
        )}

        {/* 3D Pedestal Stand */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-6 sm:h-8 select-none pointer-events-none z-0">
          {/* Top Platform Face */}
          <div className="w-full h-4 sm:h-5 bg-[#eae4d3] rounded-[100%] border border-[#ddd6c2] shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.7),0_2px_4px_rgba(0,0,0,0.05)] relative z-10"></div>
          {/* Cylinder Body Shading */}
          <div className="w-full h-3 sm:h-4 bg-linear-to-b from-[#eae4d3] to-[#cfc4a6] rounded-b-[100%] -mt-2 sm:-mt-3 shadow-[0_5px_8px_rgba(0,0,0,0.12)]"></div>
        </div>

        {/* Contact shadow right under the product */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-2 bg-black/15 rounded-[100%] blur-[2px] z-10 pointer-events-none"></div>

        {/* Product Image with bobbing floating animation and drop shadow */}
        <img 
          className="w-full h-[85%] object-contain filter drop-shadow-[0_8px_6px_rgba(0,0,0,0.18)] sm:drop-shadow-[0_12px_10px_rgba(0,0,0,0.22)] z-10 relative" 
          src={imageSrc}
          alt={imageAlt}
        />
      </div>

      {/* Info card text and buttons */}
      <div className="p-4 sm:p-6 flex flex-col justify-between grow bg-white">
        <div>
          <h3 className="text-zinc-900 font-extrabold text-xs sm:text-base md:text-lg uppercase tracking-wide leading-tight group-hover:text-emerald-950 transition-colors">{name}</h3>
          <p className="text-[9px] sm:text-[11px] text-zinc-500 font-medium leading-relaxed mt-1 h-8 sm:h-12 overflow-hidden">{description}</p>
        </div>

        {/* Price & Buy Button container */}
        <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-baseline sm:flex-col gap-2 sm:gap-0.5">
            {mrp && (
              <span className="text-[8px] sm:text-[10px] line-through text-zinc-400 font-bold tracking-wider mb-0.5">
                MRP: {mrp}
              </span>
            )}
            <span className="text-sm sm:text-lg font-black text-zinc-900 tracking-tight">{price}</span>
          </div>

          <div className="w-full sm:w-32 flex justify-end">
            {stock <= 0 ? (
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-500 border border-red-200 px-2 py-1 rounded-full shadow-sm text-center w-full">
                Out of Stock
              </span>
            ) : quantity > 0 ? (
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-900/10 h-7 sm:h-10 w-full rounded-full flex items-center justify-between shadow-inner overflow-hidden">
                <button 
                  onClick={() => onUpdateQuantity(-1)} 
                  className="w-6 sm:w-9 h-full flex items-center justify-center hover:bg-emerald-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs sm:text-[16px] font-bold">remove</span>
                </button>
                <span className="text-center font-black text-xs sm:text-sm">{quantity}</span>
                <button 
                  onClick={() => onUpdateQuantity(1)} 
                  className="w-6 sm:w-9 h-full flex items-center justify-center hover:bg-emerald-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xs sm:text-[16px] font-bold">add</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={onAddToCart} 
                className="bg-emerald-950 hover:bg-emerald-800 text-white font-black tracking-widest uppercase text-[8px] sm:text-[10px] py-1.5 px-2.5 sm:py-2.5 sm:px-4 rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all w-full flex items-center justify-center gap-1 sm:gap-1.5"
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

