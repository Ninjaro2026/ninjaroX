"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getLoggedInUser, loginUser, logoutUser } from '../../lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = getLoggedInUser();
      const adminAuth = sessionStorage.getItem('nz_admin_auth');
      
      if (loggedIn && loggedIn.role === 'admin' && adminAuth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      // Authenticate using backend API by typing email and password
      const user = await loginUser({ email: email.trim().toLowerCase(), password: password });
      
      if (user && user.role === 'admin') {
        setIsAuthenticated(true);
        sessionStorage.setItem('nz_admin_auth', 'true');
      } else {
        setAuthError('Access denied: User is not an admin.');
        logoutUser();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid admin credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('nz_admin_auth');
    logoutUser();
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
    backgroundImage: "linear-gradient(135deg, #091a14 0%, #0d281e 50%, #06140f 100%)",
    backgroundAttachment: "fixed" as const
  };

  const adminCanvasStyle = {
    backgroundColor: "#ecf4f0",
    backgroundImage: "radial-gradient(circle at top right, rgba(6,78,59,0.06) 0%, transparent 60%)"
  };

  // Auth passcode gate screen
  if (!isAuthenticated) {
    return (
      <div style={loginBackgroundStyle} className="min-h-screen font-poppins text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>

        <div className="w-full max-w-md space-y-8 relative z-10 text-center">
          <div>
            <h1 className="font-limelight text-6xl tracking-tighter uppercase text-white leading-none">Ninjaro✧</h1>
            <div className="inline-block mt-4 px-4 py-1.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 font-bold text-xs uppercase tracking-widest">
              Control Panel Gateway
            </div>
          </div>

          <form onSubmit={handleLogin} className="bg-[#11241c] p-8 md:p-10 rounded-[2.5rem] border border-emerald-800/40 shadow-2xl space-y-6 text-left">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300/70 block">Admin Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400/50">mail</span>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ninjaro.com" 
                    className="w-full bg-[#081611] border border-emerald-800/40 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold outline-none focus:border-emerald-400 transition-all text-white placeholder-emerald-700/50"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300/70 block">Admin Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400/50">lock</span>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-[#081611] border border-emerald-800/40 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold outline-none focus:border-emerald-400 transition-all text-white placeholder-emerald-700/50"
                    disabled={loading}
                  />
                </div>
              </div>

              {authError && <p className="text-xs font-bold text-rose-400 mt-1">{authError}</p>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-400 text-emerald-950 font-black py-4 rounded-2xl uppercase tracking-widest hover:bg-emerald-300 active:scale-[0.98] transition-all shadow-lg shadow-emerald-400/20 text-xs disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
            
            <div className="pt-2 text-center">
              <Link href="/" className="text-xs font-black text-emerald-300/70 hover:text-white transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5">
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
            <span className="font-black italic text-2xl tracking-tighter text-white uppercase leading-none">Ninjaro✧</span>
            <span className="bg-emerald-400/20 text-emerald-300 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-400/30">
              Admin
            </span>
          </div>
          {/* Close button for mobile menu */}
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden text-white hover:bg-white/10 p-1.5 rounded-full transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          {menuItems.map(item => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 border ${
                  isActive 
                    ? 'bg-emerald-400 text-emerald-950 border-emerald-300 shadow-lg shadow-emerald-400/20 font-black' 
                    : 'text-emerald-100/70 border-transparent hover:text-white hover:bg-emerald-800/40'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer shortcut actions */}
      <div className="space-y-2 pt-6 border-t border-emerald-800/40">
        <Link href="/" className="text-[10px] font-black text-emerald-100 hover:bg-emerald-800/60 transition-all uppercase tracking-wider flex items-center gap-2 bg-emerald-950/40 px-4 py-3 rounded-2xl border border-emerald-800/40 shadow-sm">
          <span className="material-symbols-outlined text-base">home</span> Storefront
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full text-[10px] font-black text-rose-300 hover:bg-rose-950/60 transition-all uppercase tracking-wider flex items-center gap-2 bg-rose-950/30 px-4 py-3 rounded-2xl border border-rose-800/40 shadow-sm text-left"
        >
          <span className="material-symbols-outlined text-base">logout</span> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div style={adminCanvasStyle} className="min-h-screen font-poppins text-emerald-950 flex pb-0 selection:bg-emerald-200 print:bg-white print:p-0 print:text-black">
      
      {/* 1. DESKTOP SIDEBAR - Deep obsidian green sidebar for sharp contrast */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[#053225] border-r border-emerald-900/30 p-6 sticky top-0 h-screen z-40 print:hidden shadow-2xl">
        {sidebarContent}
      </aside>

      {/* 2. MOBILE DRAWER SIDEBAR - Overlay menu drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-100 lg:hidden print:hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-xs" onClick={() => setIsMobileSidebarOpen(false)}></div>
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#053225] border-r border-emerald-900/30 p-6 shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* 3. CONTENT AREA */}
      <div className="grow flex flex-col min-w-0 min-h-screen">
        
        {/* HEADER - Solid high contrast header bar */}
        <header className="h-20 bg-white border-b border-emerald-900/10 flex items-center justify-between px-6 md:px-8 sticky top-0 z-30 shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            {/* Hamburger menu button for small screens */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden text-emerald-950 hover:bg-emerald-50 p-2 rounded-xl border border-emerald-900/10 transition-colors flex items-center justify-center bg-slate-50"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            
            <div>
              <h2 className="text-sm md:text-base font-black uppercase text-emerald-900 tracking-tight leading-none">{pageTitle}</h2>
              <span className="text-[9px] text-emerald-800 font-extrabold uppercase tracking-widest mt-1.5 block">Ninjaro Executive Suite</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-emerald-950/5 px-3.5 py-1.5 rounded-2xl border border-emerald-900/10 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-black text-xs shadow-md">
              A
            </div>
            <div className="text-left leading-none hidden sm:block">
              <p className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">System Admin</p>
              <span className="text-[8px] font-extrabold text-emerald-800 uppercase tracking-widest mt-1 block">Live Authorized</span>
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
