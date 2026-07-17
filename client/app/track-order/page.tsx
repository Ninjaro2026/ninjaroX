"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { trackOrderById, fetchOrders } from '../../lib/api';

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
    <div className="min-h-screen bg-emerald-50 font-poppins text-emerald-950 selection:bg-emerald-200">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-300/20 rounded-full blur-[150px]"></div>
      </div>

      <nav className="p-6 md:p-12 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-emerald-900/10 flex items-center justify-center group-hover:bg-emerald-900 group-hover:text-white transition-all">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </div>
          <span className="font-black italic text-2xl md:text-4xl tracking-tighter hidden sm:inline leading-none">Ninjaro✧</span>
        </Link>

        <span className="font-black italic text-2xl md:text-4xl tracking-tighter text-emerald-950 uppercase leading-none">Track Orders</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Search Order Form */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black italic uppercase tracking-tight">Search for your order</h2>
          <form onSubmit={handleTrackSubmit} className="flex gap-4">
            <div className="grow relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/40">search</span>
              <input 
                type="text"
                required
                placeholder="Enter Order ID (e.g. NZ-9942)"
                className="w-full bg-white/50 border border-emerald-900/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-emerald-500 font-bold uppercase placeholder-emerald-900/30"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="bg-emerald-900 text-white px-8 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>
          {error && <p className="text-red-600 text-xs font-bold pl-2">{error}</p>}
        </section>

        {/* Active Order Spotlight */}
        {activeOrder && (
          <section className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${activeOrder.status === 'Cancelled' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              Order Details
            </h2>
            
            <div className="glass-panel bg-white/40 backdrop-blur-3xl p-8 md:p-12 rounded-4xl border border-white/60 shadow-2xl space-y-10 relative overflow-hidden">
              <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl font-black uppercase tracking-widest text-[10px] ${
                activeOrder.status === 'Delivered' ? 'bg-emerald-900 text-white' :
                activeOrder.status === 'Cancelled' ? 'bg-red-600 text-white' : 'bg-amber-500 text-emerald-950'
              }`}>
                {activeOrder.status}
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="space-y-2">
                  <p className="text-emerald-900/40 font-black tracking-widest uppercase text-[10px]">Order ID</p>
                  <h3 className="text-3xl font-black text-emerald-950">{activeOrder.id}</h3>
                  <p className="text-emerald-900/60 font-bold">Estimated Arrival: <span className="text-emerald-950">{activeOrder.eta || '3-5 business days'}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(activeOrder)}
                  className="bg-emerald-900 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg self-start"
                >
                  View Details
                </button>
              </div>

              {/* Tracking Stepper */}
              {activeOrder.status !== 'Cancelled' && (
                <div className="pt-8 space-y-6">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-emerald-900/5 -translate-y-1/2 rounded-full"></div>
                    <div 
                      className="absolute top-1/2 left-0 h-1 bg-emerald-900 -translate-y-1/2 rounded-full transition-all duration-1000"
                      style={{ width: `${(activeOrder.trackingStep / (STEPS.length - 1)) * 100}%` }}
                    ></div>
                    
                    {STEPS.map((step, idx) => (
                      <div key={idx} className="relative z-10 flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full border-4 border-emerald-50 flex items-center justify-center transition-all duration-500 ${idx <= activeOrder.trackingStep ? 'bg-emerald-900 scale-125' : 'bg-white border-emerald-900/10'}`}>
                          {idx < activeOrder.trackingStep && (
                            <span className="material-symbols-outlined text-white text-[10px]">check</span>
                          )}
                        </div>
                        <span className={`absolute -bottom-8 text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${idx <= activeOrder.trackingStep ? 'text-emerald-950' : 'text-emerald-900/20'}`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Previous Orders */}
        {pastOrders.length > 0 && (
          <section className="space-y-8">
            <h2 className="text-2xl font-black italic uppercase tracking-tight">Your Order History</h2>
            <div className="space-y-4">
              {pastOrders.map((order) => (
                <div 
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="glass-panel bg-white/30 backdrop-blur-2xl p-6 rounded-3xl border border-white/50 flex items-center justify-between group cursor-pointer hover:bg-white/60 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-900/5 flex items-center justify-center text-emerald-950">
                      <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                    <div>
                      <h4 className="font-black text-emerald-950">{order.id}</h4>
                      <p className="text-xs font-bold text-emerald-900/40 uppercase tracking-widest">{order.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="hidden md:block text-right">
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-900/40">Amount</p>
                      <p className="font-black text-emerald-950">₹{order.total}/-</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200/50' : 'bg-emerald-50 text-emerald-600 border-emerald-600/10'
                    }`}>
                      {order.status}
                    </div>
                    <span className="material-symbols-outlined text-emerald-950/20 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
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

      {/* Footer Decal */}
      <section className="pt-24 pb-12 flex flex-col items-center gap-8 opacity-20 pointer-events-none">
        <div className="w-px h-32 bg-linear-to-b from-emerald-900 to-transparent"></div>
        <span className="font-limelight text-8xl md:text-9xl text-emerald-900/10 select-none uppercase tracking-tighter">Ninjaro</span>
      </section>
    </div>
  );
}
