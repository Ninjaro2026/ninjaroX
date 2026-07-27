import React from 'react';

// Product Card Skeleton matching ProductCard design
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-3xl overflow-hidden shadow-sm border border-emerald-900/10 bg-white font-poppins relative">
      {/* Top Image Studio Placeholder */}
      <div className="relative h-48 sm:h-64 md:h-72 p-6 flex items-center justify-center bg-emerald-950/5 overflow-hidden">
        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl animate-skeleton"></div>
      </div>

      {/* Content Section Placeholder */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-4">
        <div className="space-y-2">
          {/* Category Tag */}
          <div className="w-20 h-3 rounded-full animate-skeleton"></div>
          {/* Title */}
          <div className="w-3/4 h-5 rounded-lg animate-skeleton"></div>
          {/* Description */}
          <div className="w-full h-3 rounded-md animate-skeleton"></div>
          <div className="w-2/3 h-3 rounded-md animate-skeleton"></div>
        </div>

        {/* Footer: Price & Add to Cart button */}
        <div className="pt-3 border-t border-emerald-900/5 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="w-16 h-5 rounded-md animate-skeleton"></div>
            <div className="w-10 h-3 rounded-md animate-skeleton"></div>
          </div>
          <div className="w-24 h-10 sm:h-12 rounded-xl sm:rounded-2xl animate-skeleton"></div>
        </div>
      </div>
    </div>
  );
}

// Brand Loading Spinner Banner
export function StorefrontLoader({ title = "Loading Botanical Premixes...", subtitle = "Ninjaro✧ • Shifting your state" }: { title?: string; subtitle?: string }) {
  return (
    <div className="w-full py-16 md:py-24 flex flex-col items-center justify-center space-y-5 text-center animate-fade-in font-poppins">
      <div className="relative">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-emerald-900/10 border-t-emerald-900 animate-spin-ring flex items-center justify-center"></div>
        <div className="absolute inset-0 flex items-center justify-center text-emerald-900 text-lg font-black italic select-none">
          ✧
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-emerald-950">{title}</h3>
        <p className="text-xs sm:text-sm text-emerald-900/60 font-medium tracking-widest uppercase">{subtitle}</p>
      </div>
    </div>
  );
}

// Table Skeleton Rows for Admin Pages
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full divide-y divide-emerald-900/5 animate-fade-in">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="p-4 sm:p-5 grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div 
              key={cIdx} 
              className={`h-4 rounded-md animate-skeleton ${cIdx === 0 ? 'w-3/4 font-bold' : cIdx === cols - 1 ? 'w-1/2 justify-self-end' : 'w-2/3'}`}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Stat Card Skeleton for KPIs
export function StatCardSkeleton() {
  return (
    <div className="glass-panel bg-white/40 p-6 rounded-3xl border border-white/60 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <div className="w-24 h-3 rounded-full animate-skeleton"></div>
        <div className="w-8 h-8 rounded-full animate-skeleton"></div>
      </div>
      <div className="w-32 h-8 rounded-lg animate-skeleton"></div>
      <div className="w-20 h-3 rounded-md animate-skeleton"></div>
    </div>
  );
}

// Order Card Skeleton for Orders Dashboard & Customer Profile
export function OrderCardSkeleton() {
  return (
    <div className="glass-panel bg-white/40 p-6 rounded-3xl border border-white/60 shadow-sm space-y-4 font-poppins">
      <div className="flex justify-between items-center">
        <div className="w-28 h-4 rounded-md animate-skeleton"></div>
        <div className="w-20 h-6 rounded-full animate-skeleton"></div>
      </div>
      <div className="space-y-2 border-y border-emerald-900/5 py-3">
        <div className="w-3/4 h-4 rounded-md animate-skeleton"></div>
        <div className="w-1/2 h-3 rounded-md animate-skeleton"></div>
      </div>
      <div className="flex justify-between items-center pt-1">
        <div className="w-20 h-5 rounded-md animate-skeleton"></div>
        <div className="w-24 h-8 rounded-xl animate-skeleton"></div>
      </div>
    </div>
  );
}
