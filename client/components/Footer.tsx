import React from 'react';

export function Footer() {
  return (
    <footer className="relative bg-[#032117] text-white pt-10 md:pt-14 pb-10 overflow-hidden border-t-4 border-emerald-500 font-poppins">
      {/* Abstract Liquid background effects */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[90px] opacity-50"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full mix-blend-screen filter blur-[100px] opacity-50"></div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-emerald-800/60 pb-10">
          
          {/* Left Column: Brand & Tagline */}
          <div className="space-y-3 md:max-w-md">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white italic tracking-tight leading-none">
              NINJARO<span className="text-emerald-400">✧</span>
            </h2>
            <p className="text-emerald-200/80 text-xs sm:text-sm font-medium leading-relaxed">
              Botanical state-shifting mocktail premixes. Elevate your hydration ritual with bar-quality craft taste anywhere.
            </p>
          </div>

          {/* Right Column: Reach Out To Us & Socials */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 text-left">
            {/* Reach Out To Us */}
            <div className="space-y-3">
              <h4 className="text-emerald-400 font-black tracking-widest uppercase text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">location_on</span> Reach Out To Us
              </h4>
              <div className="space-y-2 text-xs font-semibold text-emerald-100/90 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-400 mt-0.5 shrink-0">home</span>
                  <span>Madhyamgram, Dist: Kolkata, West Bengal - 700129</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-400 shrink-0">call</span>
                  <a href="tel:8582938152" className="hover:text-white transition-colors">ph no: 8582938152</a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-400 shrink-0">mail</span>
                  <a href="mailto:ninjaro.in@gmail.com" className="hover:text-white transition-colors">email: ninjaro.in@gmail.com</a>
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <h4 className="text-emerald-400 font-black tracking-widest uppercase text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">share</span> Social Links
              </h4>
              <div className="flex items-center gap-3">
                <a 
                  href="https://www.instagram.com/ninjarox.in?igsh=MTB5cHZsdjR5cTFrcw==" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/80 hover:bg-emerald-500 hover:text-emerald-950 text-emerald-200 font-bold text-xs transition-all border border-emerald-700/60 shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram (@ninjarox.in)</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-emerald-400/80 text-xs font-bold tracking-wider uppercase">
          <p>© 2026 Ninjaro✧. All rights reserved.</p>
          <p className="text-[10px] text-emerald-300/60">Crafted with care in Kolkata, West Bengal</p>
        </div>
      </div>
    </footer>
  );
}
