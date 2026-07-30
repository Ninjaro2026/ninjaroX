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
                  <span className="material-symbols-outlined text-base">photo_camera</span>
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
