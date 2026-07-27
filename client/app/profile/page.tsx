"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLoggedInUser, getProfile, addAddress, deleteAddress, fetchOrders, logoutUser } from '../../lib/api';
import { OrderCardSkeleton } from '../../components/Skeleton';
import { Navbar } from '../../components/Navbar';

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
  const [loadingProfile, setLoadingProfile] = useState(true);

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
    setLoadingProfile(true);

    Promise.all([getProfile(), fetchOrders()])
      .then(([profileData, orderData]) => {
        setUser(profileData);
        setAddresses(profileData.addresses || []);
        setOrders(orderData || []);
      })
      .catch(err => {
        console.warn('Could not load profile from API, using cached state', err);
      })
      .finally(() => {
        setLoadingProfile(false);
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
    <div className="min-h-screen bg-[#f4f7f5] font-poppins text-zinc-900 selection:bg-emerald-200 pb-16">
      {/* Universal Consistent Header */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header Banner */}
        <section className="bg-linear-to-r from-[#032117] via-[#064e3b] to-[#043425] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-800/40">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-inner shrink-0 select-none">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white leading-none">
                  {user.name}
                </h1>
                <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {user.role === 'admin' ? 'Admin Executive' : 'Botanical Member'}
                </span>
              </div>
              <p className="text-emerald-200/80 text-xs font-medium">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t md:border-t-0 border-emerald-800/80 pt-4 md:pt-0 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300/80">Total Orders</p>
              <p className="text-lg font-black text-white">{orders.length}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-2xl text-xs font-black uppercase tracking-wider border border-rose-500/30 transition-all active:scale-95 select-none"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Logout
            </button>
          </div>
        </section>

        {/* Widescreen 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (4 cols) - Member Quick Stats & Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Account Card */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-base">person</span>
                Account Overview
              </h3>

              <div className="space-y-4 text-xs font-medium">
                <div className="flex justify-between items-center py-1 border-b border-zinc-50">
                  <span className="text-zinc-400 font-bold uppercase text-[10px]">Full Name</span>
                  <span className="font-black text-zinc-900">{user.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-50">
                  <span className="text-zinc-400 font-bold uppercase text-[10px]">Email Address</span>
                  <span className="font-bold text-zinc-700 truncate max-w-[160px]">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-50">
                  <span className="text-zinc-400 font-bold uppercase text-[10px]">Saved Addresses</span>
                  <span className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px]">{addresses.length}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-400 font-bold uppercase text-[10px]">Account Role</span>
                  <span className="font-black text-zinc-900 capitalize">{user.role || 'customer'}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Card */}
            <div className="bg-linear-to-br from-emerald-50 to-teal-50/50 p-6 rounded-3xl border border-emerald-200/60 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-900">
                <span className="material-symbols-outlined text-emerald-700">local_shipping</span>
                <h4 className="font-black text-xs uppercase tracking-wider">Fast Order Lookup</h4>
              </div>
              <p className="text-emerald-800/80 text-xs leading-relaxed">
                Need to track an incoming delivery? Check real-time logistics status instantly.
              </p>
              <Link 
                href="/track-order" 
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-900 hover:text-emerald-700 transition-colors pt-1"
              >
                Go to Tracker <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Right Column (8 cols) - Saved Addresses & Order History */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Addresses Section */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <h2 className="text-lg font-black italic uppercase tracking-tight text-zinc-900">Saved Delivery Addresses</h2>
                  <p className="text-zinc-400 text-xs font-medium">Manage default shipping locations for fast checkout</p>
                </div>
                <button 
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-900 hover:bg-emerald-900 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs active:scale-95 shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Address
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((address) => {
                  const addressId = address._id || address.id || '';
                  return (
                    <div key={addressId} className="bg-zinc-50/70 p-5 rounded-2xl border border-zinc-200/70 hover:border-emerald-500/50 hover:bg-white transition-all group relative">
                      {address.isDefault && (
                        <span className="absolute top-3 right-3 bg-emerald-900 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-700 text-base">location_on</span>
                          <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">{address.label}</h4>
                        </div>
                        <div className="text-zinc-600 text-xs font-medium leading-relaxed">
                          <p className="font-semibold text-zinc-800">{address.street}</p>
                          <p>{address.city}, {address.state} - {address.zip}</p>
                        </div>
                        <div className="pt-1 flex items-center justify-end">
                          <button 
                            onClick={() => handleDeleteAddress(addressId)}
                            className="text-rose-500 font-bold text-[10px] uppercase tracking-wider hover:underline transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isAddingNew && (
                  <form onSubmit={handleAddAddress} className="sm:col-span-2 bg-emerald-50/60 p-6 rounded-2xl border-2 border-dashed border-emerald-300 space-y-4 animate-in fade-in duration-300">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">New Delivery Location</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input 
                        required
                        placeholder="Label (e.g. Home, Work)"
                        className="bg-white border border-zinc-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 text-xs font-bold"
                        value={newAddress.label}
                        onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                      />
                      <input 
                        required
                        placeholder="Zip / Pin Code"
                        className="bg-white border border-zinc-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 text-xs font-bold"
                        value={newAddress.zip}
                        onChange={e => setNewAddress({...newAddress, zip: e.target.value})}
                      />
                    </div>
                    <input 
                      required
                      placeholder="Street Address, House / Flat No."
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 text-xs font-bold"
                      value={newAddress.street}
                      onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        required
                        placeholder="City"
                        className="bg-white border border-zinc-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 text-xs font-bold"
                        value={newAddress.city}
                        onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                      />
                      <input 
                        required
                        placeholder="State"
                        className="bg-white border border-zinc-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-600 text-xs font-bold"
                        value={newAddress.state}
                        onChange={e => setNewAddress({...newAddress, state: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" disabled={loadingAddress} className="grow bg-emerald-900 text-white py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-emerald-900 disabled:opacity-50 transition-colors">
                        {loadingAddress ? 'Saving...' : 'Save Address'}
                      </button>
                      <button type="button" onClick={() => setIsAddingNew(false)} className="px-5 border border-zinc-200 rounded-xl font-bold uppercase tracking-wider text-xs bg-white hover:bg-zinc-50 transition-colors">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </section>

            {/* Order History Section */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h2 className="text-lg font-black italic uppercase tracking-tight text-zinc-900">Recent Purchase History</h2>
                <p className="text-zinc-400 text-xs font-medium">View completed, active, or cancelled orders</p>
              </div>

              <div className="space-y-4">
                {loadingProfile ? (
                  <>
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                  </>
                ) : orders.length === 0 ? (
                  <div className="bg-zinc-50 p-10 text-center rounded-2xl border border-dashed border-zinc-200 space-y-2">
                    <span className="material-symbols-outlined text-4xl text-zinc-300">receipt_long</span>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">No orders placed yet.</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="bg-zinc-50/80 p-5 rounded-2xl border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500/40 hover:bg-white transition-all">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-black text-zinc-900 uppercase tracking-wider">{order.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-200/60' :
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-zinc-500">
                          Date: <span className="text-zinc-800">{order.date}</span> • Items: <span className="text-zinc-700">{(order.items || []).map((i: any) => `${i.name.replace(/\s*\(.*\)/, '')} ×${i.quantity}`).join(', ')}</span>
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 border-zinc-200/60 pt-3 sm:pt-0">
                        <p className="text-base font-black text-emerald-900">₹{order.total}/-</p>
                        <Link 
                          href={`/track-order?id=${order.id}`}
                          className="text-emerald-900 font-bold text-xs uppercase tracking-wider hover:bg-emerald-900 hover:text-white px-4 py-2 rounded-xl border border-emerald-900/20 transition-all text-center"
                        >
                          Track Order
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}
