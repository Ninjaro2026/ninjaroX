"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('nz_admin_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setAuthError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('nz_admin_auth', 'true');
      }
    } else {
      setAuthError('Invalid credentials. Please enter admin123.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nz_admin_auth');
    }
  };

  // Page title mapping
  let pageTitle = "Performance Dashboard";
  if (pathname === "/admin/catalog") pageTitle = "Catalog Manager";
  else if (pathname === "/admin/orders") pageTitle = "Order Fulfillment";
  else if (pathname === "/admin/pos") pageTitle = "Billing Desk";

  const menuItems = [
    { name: 'Billing', path: '/admin/pos', icon: 'receipt_long' },
    { name: 'Performance', path: '/admin', icon: 'analytics' },
    { name: 'Catalog', path: '/admin/catalog', icon: 'inventory' },
    { name: 'Orders', path: '/admin/orders', icon: 'local_shipping' },
  ];

  const loginBackgroundStyle = {
    backgroundImage: "linear-gradient(135deg, #e0f8ea 0%, #c1fee2 50%, #f0fdf6 100%)",
    backgroundAttachment: "fixed" as const
  };

  // Auth passcode gate screen
  if (!isAuthenticated) {
    return (
      <div style={loginBackgroundStyle} className="min-h-screen font-poppins text-emerald-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>

        <div className="w-full max-w-md space-y-8 relative z-10 text-center">
          <div>
            <h1 className="font-limelight text-6xl tracking-tighter uppercase text-emerald-950 leading-none">Ninjaro✧</h1>
            <div className="inline-block mt-4 px-4 py-1.5 rounded-full bg-emerald-950/5 text-emerald-950 border border-emerald-900/10 font-bold text-xs uppercase tracking-widest">
              Control Panel Gateway
            </div>
          </div>

          <form onSubmit={handleLogin} className="glass-panel bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/60 shadow-2xl space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Enter Admin Passcode</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/40">lock</span>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (admin123)" 
                  className="w-full bg-white/40 border border-emerald-900/15 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold outline-none focus:border-emerald-600 transition-all text-emerald-950 placeholder-emerald-900/30"
                />
              </div>
              {authError && <p className="text-xs font-bold text-red-655 mt-1">{authError}</p>}
            </div>

            <button 
              type="submit" 
              className="w-full bg-emerald-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-800 active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/20 text-xs"
            >
              Verify Passcode
            </button>
            
            <div className="pt-2 text-center">
              <Link href="/" className="text-xs font-black text-emerald-900/60 hover:text-emerald-900 transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-base">arrow_back</span> Return to Storefront
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-8">
        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black italic text-2xl tracking-tighter text-emerald-950 uppercase leading-none">Ninjaro✧</span>
            <span className="bg-emerald-950/5 text-emerald-950 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-900/10 shadow-inner">
              Admin
            </span>
          </div>
          {/* Close button for mobile menu */}
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden text-emerald-950 hover:bg-emerald-950/10 p-1.5 rounded-full transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {menuItems.map(item => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 border ${isActive ? 'bg-emerald-900 text-white border-emerald-950 shadow-md shadow-emerald-900/10' : 'text-emerald-900/60 border-transparent hover:text-emerald-950 hover:bg-white/30'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer shortcut actions */}
      <div className="space-y-2 pt-6 border-t border-emerald-900/5">
        <Link href="/" className="text-[10px] font-black text-emerald-950 hover:bg-white/60 transition-all uppercase tracking-wider flex items-center gap-2 bg-white/40 px-4 py-3 rounded-2xl border border-white/50 shadow-sm">
          <span className="material-symbols-outlined text-base">home</span> Storefront
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full text-[10px] font-black text-red-655 hover:bg-red-50/60 transition-all uppercase tracking-wider flex items-center gap-2 bg-red-50/30 px-4 py-3 rounded-2xl border border-red-200/40 shadow-sm text-left"
        >
          <span className="material-symbols-outlined text-base">logout</span> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div style={loginBackgroundStyle} className="min-h-screen font-poppins text-emerald-950 flex pb-0 selection:bg-emerald-200 print:bg-white print:p-0 print:text-black">
      
      {/* 1. DESKTOP SIDEBAR - Hidden in print and on small screens */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white/20 backdrop-blur-xl border-r border-white/50 p-6 sticky top-0 h-screen z-40 print:hidden">
        {sidebarContent}
      </aside>

      {/* 2. MOBILE DRAWER SIDEBAR - Overlay menu drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-100 lg:hidden print:hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-xs" onClick={() => setIsMobileSidebarOpen(false)}></div>
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#eafbf2] border-r border-white/50 p-6 shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* 3. CONTENT AREA */}
      <div className="grow flex flex-col min-w-0 min-h-screen">
        
        {/* HEADER - Hidden during printing */}
        <header className="h-20 bg-white/10 backdrop-blur-md border-b border-white/50 flex items-center justify-between px-6 md:px-8 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-3">
            {/* Hamburger menu button for small screens */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden text-emerald-950 hover:bg-white/40 p-2 rounded-xl border border-white/50 transition-colors flex items-center justify-center bg-white/20"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            
            <div>
              <h2 className="text-sm md:text-base font-black uppercase text-emerald-950 tracking-tight leading-none">{pageTitle}</h2>
              <span className="text-[9px] text-emerald-900/40 uppercase tracking-widest font-black mt-1.5 block">Session active</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/20 px-3.5 py-1.5 rounded-2xl border border-white/50 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-bold text-xs shadow-md border border-emerald-950">
              A
            </div>
            <div className="text-left leading-none hidden sm:block">
              <p className="text-[10px] font-black uppercase text-emerald-950 tracking-wider">System Admin</p>
              <span className="text-[8px] font-bold text-emerald-900/40 uppercase tracking-widest mt-1 block">Operational</span>
            </div>
          </div>
        </header>

        {/* MAIN PAGE VIEW BODY */}
        <div className="grow p-6 md:p-8 print:p-0">
          {children}
        </div>
      </div>
    </div>
  );
}
