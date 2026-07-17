"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLoggedInUser, getProfile, addAddress, deleteAddress, fetchOrders, logoutUser } from '../../lib/api';

interface Address {
  _id?: string;
  id?: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', street: '', city: '', state: '', zip: '' });
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const loggedIn = getLoggedInUser();
    if (!loggedIn) {
      window.location.href = '/';
      return;
    }
    setUser(loggedIn);
    setAddresses(loggedIn.addresses || []);

    // Load full profile details (e.g. from API)
    getProfile()
      .then(profileData => {
        setUser(profileData);
        setAddresses(profileData.addresses || []);
      })
      .catch(err => {
        console.warn('Could not load profile from API, using cached state', err);
      });

    // Load order history
    fetchOrders()
      .then(orderData => {
        setOrders(orderData || []);
      })
      .catch(err => {
        console.warn('Could not load orders from API', err);
      });
  }, []);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAddress(true);
    try {
      const updatedList = await addAddress(newAddress);
      setAddresses(updatedList);
      setIsAddingNew(false);
      setNewAddress({ label: '', street: '', city: '', state: '', zip: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to add address');
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const updatedList = await deleteAddress(id);
      setAddresses(updatedList);
    } catch (err: any) {
      alert(err.message || 'Failed to delete address');
    }
  };

  const handleLogout = () => {
    logoutUser();
    window.location.href = '/';
  };

  if (!isMounted || !user) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center font-poppins">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-900 border-t-transparent mx-auto"></div>
          <p className="text-emerald-900/60 font-bold uppercase text-xs tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  // Get initials for profile badge
  const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-emerald-50 font-poppins text-emerald-950 selection:bg-emerald-200">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-300/20 rounded-full blur-[150px]"></div>
      </div>

      <nav className="p-6 md:p-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-emerald-900/10 flex items-center justify-center group-hover:bg-emerald-900 group-hover:text-white transition-all">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </div>
          <span className="font-black italic text-2xl tracking-tighter">Ninjaro✧</span>
        </Link>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-xs font-black uppercase tracking-widest border border-red-200/50 shadow-sm active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Logout
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Header Section */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-10">
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-emerald-950 leading-none">
              YOUR PROFILE
            </h1>
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-emerald-900 text-white flex items-center justify-center font-black text-2xl md:text-3xl shadow-2xl border-4 border-white/50 shrink-0 transform hover:scale-105 transition-transform duration-500">
              {initials}
            </div>
          </div>
          <p className="text-emerald-900/60 font-bold tracking-widest uppercase text-sm">Manage your account and delivery details</p>
        </section>

        {/* User Info Card */}
        <section className="glass-panel bg-white/40 backdrop-blur-3xl p-8 md:p-12 rounded-[2.5rem] border border-white/60 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-emerald-900/40 font-black tracking-widest uppercase text-[10px]">Account Holder</p>
              <h3 className="text-3xl font-black text-emerald-950">{user.name}</h3>
              <p className="text-emerald-900/60 font-medium">{user.email}</p>
            </div>
            <span className="bg-emerald-900/10 text-emerald-900 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-900/10 shadow-xs select-none">
              Role: {user.role || 'customer'}
            </span>
          </div>
        </section>

        {/* Addresses Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black italic uppercase tracking-tight text-emerald-950">Saved Addresses</h2>
            <button 
              onClick={() => setIsAddingNew(true)}
              className="w-12 h-12 rounded-full border-2 border-emerald-900/20 flex items-center justify-center text-emerald-950 hover:bg-emerald-900 hover:text-white hover:border-emerald-900 transition-all active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => {
              const addressId = address._id || address.id || '';
              return (
                <div key={addressId} className="glass-panel bg-white/30 backdrop-blur-2xl p-8 rounded-4xl border border-white/50 hover:bg-white/50 transition-all group relative overflow-hidden">
                  {address.isDefault && (
                    <div className="absolute top-0 right-0 bg-emerald-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
                      Default
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-600/50">location_on</span>
                      <h4 className="text-xl font-black text-emerald-950">{address.label}</h4>
                    </div>
                    <div className="text-emerald-900/70 font-medium leading-relaxed">
                      <p>{address.street}</p>
                      <p>{address.city}, {address.state} - {address.zip}</p>
                    </div>
                    <div className="pt-2 flex items-center gap-4">
                      <button 
                        onClick={() => handleDeleteAddress(addressId)}
                        className="text-red-600/60 font-black text-xs uppercase tracking-widest hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {isAddingNew && (
              <form onSubmit={handleAddAddress} className="glass-panel bg-emerald-900/5 backdrop-blur-2xl p-8 rounded-4xl border-2 border-dashed border-emerald-900/20 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <input 
                  required
                  placeholder="Label (e.g. Home, Office)"
                  className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-sm font-bold"
                  value={newAddress.label}
                  onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                />
                <input 
                  required
                  placeholder="Street Address"
                  className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-sm font-bold"
                  value={newAddress.street}
                  onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    required
                    placeholder="City"
                    className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-sm font-bold"
                    value={newAddress.city}
                    onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                  />
                  <input 
                    required
                    placeholder="State"
                    className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-sm font-bold"
                    value={newAddress.state}
                    onChange={e => setNewAddress({...newAddress, state: e.target.value})}
                  />
                </div>
                <input 
                  required
                  placeholder="Zip Code"
                  className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-sm font-bold"
                  value={newAddress.zip}
                  onChange={e => setNewAddress({...newAddress, zip: e.target.value})}
                />
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={loadingAddress} className="grow bg-emerald-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-800 shadow-lg disabled:opacity-50">
                    {loadingAddress ? 'Saving...' : 'Save Address'}
                  </button>
                  <button type="button" onClick={() => setIsAddingNew(false)} className="px-6 border-2 border-emerald-900/10 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white transition-colors">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Order History Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-black italic uppercase tracking-tight text-emerald-950">Order History</h2>
          
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="glass-panel bg-white/20 p-12 text-center rounded-4xl border border-white/40">
                <span className="material-symbols-outlined text-4xl text-emerald-900/30">receipt_long</span>
                <p className="text-sm font-bold text-emerald-900/40 uppercase tracking-wider mt-2">No orders placed yet.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="glass-panel bg-white/30 backdrop-blur-2xl p-6 md:p-8 rounded-4xl border border-white/50 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-white/50 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                    <div className="space-y-1">
                      <p className="text-emerald-900/40 font-black tracking-widest uppercase text-[10px]">Order ID</p>
                      <p className="text-lg font-black text-emerald-950">{order.id}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-emerald-900/40 font-black tracking-widest uppercase text-[10px]">Date</p>
                      <p className="text-emerald-950 font-bold">{order.date}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-emerald-900/40 font-black tracking-widest uppercase text-[10px]">Status</p>
                      <div className="flex items-center gap-2 text-emerald-600">
                        <span className={`w-2 h-2 rounded-full ${
                          order.status === 'Cancelled' ? 'bg-red-500' :
                          order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}></span>
                        <p className="font-bold text-sm uppercase tracking-widest">{order.status}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-emerald-900/40 font-black tracking-widest uppercase text-[10px]">Items</p>
                      <p className="text-emerald-950/70 text-sm font-medium">
                        {(order.items || []).map((i: any) => `${i.name.replace(/\s*\(.*\)/, '')} ×${i.quantity}`).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 border-emerald-900/5 pt-4 md:pt-0">
                    <p className="text-2xl font-black text-emerald-950">₹{order.total}/-</p>
                    <Link 
                      href={`/track-order?id=${order.id}`}
                      className="text-emerald-900 font-black text-xs uppercase tracking-widest hover:bg-emerald-900 hover:text-white px-4 py-2 rounded-full border border-emerald-900/10 transition-all text-center"
                    >
                      Track Order
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Bottom Decorative Section */}
        <section className="pt-24 pb-12 flex flex-col items-center gap-8 opacity-20 pointer-events-none">
          <div className="w-px h-32 bg-linear-to-b from-emerald-900 to-transparent"></div>
          <span className="font-limelight text-8xl md:text-9xl text-emerald-900/10 select-none">Ninjaro</span>
        </section>
      </main>
    </div>
  );
}
