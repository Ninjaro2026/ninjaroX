"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { trackOrderById, fetchOrders } from '../../lib/api';
import { OrderCardSkeleton } from '../../components/Skeleton';
import { Navbar } from '../../components/Navbar';

const STEPS = ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

export default function TrackOrderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 1. Check URL parameters for auto-tracking
    const params = new URLSearchParams(window.location.search);
    const urlOrderId = params.get('id');
    const savedActiveId = localStorage.getItem('nz_active_tracking_order_id');
    const orderIdToTrack = urlOrderId || savedActiveId;

    if (orderIdToTrack) {
      setLoading(true);
      trackOrderById(orderIdToTrack)
        .then(order => {
          setActiveOrder(order);
          setSearchQuery(orderIdToTrack);
        })
        .catch(err => {
          setError(err.message || 'Order not found');
        })
        .finally(() => {
          setLoading(false);
        });
    }

    // 2. Fetch past deliveries for logged-in user
    fetchOrders()
      .then(ordersData => {
        setPastOrders(ordersData || []);
      })
      .catch(err => {
        console.warn('Could not fetch past orders', err);
      });
  }, []);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setActiveOrder(null);

    try {
      const order = await trackOrderById(searchQuery.trim().toUpperCase());
      setActiveOrder(order);
    } catch (err: any) {
      setError(err.message || 'Could not find order with that ID');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center font-poppins">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-900 border-t-transparent mx-auto"></div>
          <p className="text-emerald-900/60 font-bold uppercase text-xs tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] font-poppins text-zinc-900 selection:bg-emerald-200 pb-16">
      {/* Universal Consistent Header */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Search Hero Banner */}
        <section className="bg-linear-to-r from-[#032117] via-[#064e3b] to-[#043425] text-white p-6 sm:p-10 rounded-3xl shadow-xl space-y-6 border border-emerald-800/40">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tight text-white leading-none">
              Track Your Shipment
            </h1>
            <p className="text-emerald-200/80 text-xs sm:text-sm font-medium">
              Enter your unique order tracking ID below to check live logistics progress.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="grow relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl">search</span>
              <input 
                type="text"
                required
                placeholder="Enter Order ID (e.g. NZ-9942)"
                className="w-full bg-white text-zinc-900 border border-white/20 shadow-md rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-emerald-400 text-xs sm:text-sm font-bold uppercase placeholder-zinc-400"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="bg-emerald-400 text-emerald-950 px-8 py-3.5 rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-emerald-300 transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
            >
              {loading ? 'Searching...' : 'Track Package'}
            </button>
          </form>
          {error && <p className="text-rose-300 text-xs font-bold pl-1">{error}</p>}
        </section>

        {/* Loading Skeleton */}
        {loading && (
          <section className="space-y-3 animate-fade-in">
            <h2 className="text-lg font-black italic uppercase tracking-tight text-zinc-900">Locating Package...</h2>
            <OrderCardSkeleton />
          </section>
        )}

        {/* Widescreen 2-Column Logistics Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Column (8 cols) - Live Spotlight & Stepper */}
          <div className="lg:col-span-8 space-y-6">
            {!loading && activeOrder ? (
              <section className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-8 relative overflow-hidden">
                <div className={`absolute top-0 right-0 px-5 py-1.5 rounded-bl-2xl font-black uppercase tracking-widest text-[10px] ${
                  activeOrder.status === 'Delivered' ? 'bg-emerald-900 text-white' :
                  activeOrder.status === 'Cancelled' ? 'bg-rose-600 text-white' : 'bg-amber-400 text-zinc-950'
                }`}>
                  {activeOrder.status}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-6">
                  <div className="space-y-1">
                    <p className="text-zinc-400 font-black tracking-wider uppercase text-[10px]">Active Order ID</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-zinc-900">{activeOrder.id}</h3>
                    <p className="text-zinc-500 text-xs font-bold">Estimated Arrival: <span className="text-emerald-900 font-black">{activeOrder.eta || '3-5 business days'}</span></p>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(activeOrder)}
                    className="bg-emerald-900 text-white px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 transition-all shadow-xs"
                  >
                    Full Invoice Details
                  </button>
                </div>

                {/* Live Tracking Stepper */}
                {activeOrder.status !== 'Cancelled' && (
                  <div className="space-y-6 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">Live Delivery Progress</h4>
                    <div className="relative flex items-center justify-between px-2 sm:px-6">
                      <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-zinc-100 -translate-y-1/2 rounded-full"></div>
                      <div 
                        className="absolute top-1/2 left-4 h-1.5 bg-emerald-600 -translate-y-1/2 rounded-full transition-all duration-1000"
                        style={{ width: `calc(${ (activeOrder.trackingStep / (STEPS.length - 1)) * 100 }% - 1rem)` }}
                      ></div>
                      
                      {STEPS.map((step, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white flex items-center justify-center transition-all duration-500 ${idx <= activeOrder.trackingStep ? 'bg-emerald-600 text-white shadow-md scale-110' : 'bg-zinc-200 border-zinc-300 text-zinc-400'}`}>
                            {idx < activeOrder.trackingStep ? (
                              <span className="material-symbols-outlined text-white text-xs sm:text-sm font-bold">check</span>
                            ) : (
                              <span className="text-[10px] font-black">{idx + 1}</span>
                            )}
                          </div>
                          <span className={`absolute -bottom-7 text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${idx <= activeOrder.trackingStep ? 'text-zinc-900' : 'text-zinc-400'}`}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Preview List */}
                <div className="pt-6 border-t border-zinc-100 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Order Package Contents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeOrder.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                            ×{item.quantity}
                          </div>
                          <p className="text-xs font-bold text-zinc-900">{item.name}</p>
                        </div>
                        <p className="text-xs font-black text-emerald-900">₹{item.price * item.quantity}/-</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <div className="bg-white p-12 text-center rounded-3xl border border-zinc-200/80 shadow-xs space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">local_shipping</span>
                </div>
                <h3 className="text-base font-black text-zinc-900 uppercase tracking-tight">No Order Selected</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Enter an order ID above or select a past order from your history list to view shipment tracking details.
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar Column (4 cols) - Past Purchases */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900">Past Orders Quick Tracking</h3>
                <p className="text-zinc-400 text-[11px] font-medium">Click any order to load logistics timeline</p>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {pastOrders.length === 0 ? (
                  <p className="text-xs font-bold text-zinc-400 text-center py-6">No previous orders found.</p>
                ) : (
                  pastOrders.map((order) => (
                    <div 
                      key={order.id}
                      onClick={() => {
                        setActiveOrder(order);
                        setSearchQuery(order.id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        activeOrder?.id === order.id ? 'bg-emerald-50 border-emerald-400 shadow-xs' : 'bg-zinc-50 border-zinc-200/80 hover:border-emerald-300 hover:bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-xs text-zinc-900">{order.id}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-400">{order.date} • ₹{order.total}/-</p>
                      </div>
                      <span className="material-symbols-outlined text-zinc-400 text-base">chevron_right</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

        </div>
      </main>

      {/* Order Details Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-md" onClick={() => setSelectedOrder(null)}></div>
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(6,78,59,0.3)] flex flex-col relative z-10 animate-in zoom-in-95 duration-500 overflow-hidden border border-emerald-900/5">
            {/* Overlay Header */}
            <div className="p-10 md:p-14 pb-6 flex items-center justify-between">
              <div>
                <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-emerald-950">Order {selectedOrder.id}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-900/5">
                    <span className={`w-2 h-2 rounded-full ${selectedOrder.status === 'Cancelled' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60">{selectedOrder.status}</p>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-900/30">Ordered on {selectedOrder.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-950 hover:bg-emerald-900 hover:text-white transition-all border border-emerald-900/5 group" title="Print Invoice">
                  <span className="material-symbols-outlined text-xl">print</span>
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-950 hover:bg-emerald-900 hover:text-white transition-all group border border-emerald-900/5"
                >
                  <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">close</span>
                </button>
              </div>
            </div>

            {/* Overlay Content (Scrollable) */}
            <div className="px-10 md:px-14 py-4 pb-14 overflow-y-auto grow custom-scrollbar">
              <div className="space-y-14">
                {/* Items Section */}
                <div className="space-y-8">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-900/30 border-b border-emerald-900/5 pb-4">Purchased Items</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(selectedOrder.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-6 bg-emerald-50/20 rounded-4xl border border-emerald-900/5 hover:border-emerald-500/20 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-white rounded-2xl p-3 shadow-sm border border-emerald-900/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <img src={item.img} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="font-black text-emerald-950 text-base tracking-tight">{item.name}</p>
                            <p className="text-[11px] font-bold text-emerald-900/40 uppercase tracking-widest mt-1">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-black text-emerald-950 text-lg">₹{item.price}/-</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-emerald-900/5">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-900/30">Shipping To</h4>
                    <div className="space-y-2">
                      <p className="font-black text-emerald-950">{selectedOrder.customerName || 'Guest Customer'}</p>
                      <p className="text-sm font-medium text-emerald-900/60 leading-relaxed">
                        {selectedOrder.shippingAddress || 'Address not registered'}<br />
                        {selectedOrder.shippingCity || ''}{selectedOrder.shippingZip ? `, India - ${selectedOrder.shippingZip}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-900/30">Financials</h4>
                    <div className="space-y-4">
                      {(() => {
                        const shipCost = selectedOrder.shippingMethod === 'express' ? 150 : 0;
                        const subtotalVal = selectedOrder.total - shipCost;
                        return (
                          <>
                            <div className="flex justify-between items-center text-xs font-black text-emerald-900/40 uppercase tracking-widest">
                              <span>Subtotal</span>
                              <span className="text-emerald-950">₹{subtotalVal}/-</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-black text-emerald-900/40 uppercase tracking-widest">
                              <span>Shipping ({selectedOrder.shippingMethod === 'express' ? 'Express' : 'Standard'})</span>
                              <span className={shipCost > 0 ? 'text-emerald-950' : 'text-emerald-500'}>
                                {shipCost > 0 ? `₹${shipCost}/-` : 'FREE'}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                      <div className="flex justify-between items-center pt-4 border-t border-emerald-900/10">
                        <span className="text-2xl font-black italic uppercase tracking-tighter text-emerald-950">Grand Total</span>
                        <span className="text-4xl font-black text-emerald-900 tracking-tighter">₹{selectedOrder.total}/-</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
