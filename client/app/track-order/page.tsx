"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStoredOrders, Order } from '../../lib/store';



const MOCK_ACTIVE_ORDER: Order = {
  id: 'NZ-9942',
  date: 'Oct 26, 2026',
  status: 'Out for Delivery',
  total: 1998,
  eta: 'Today, 4:30 PM',
  trackingStep: 3,
  items: [
    { name: 'Blue Lagoon', quantity: 2, price: 1332, img: '/blulagoonbox.png' },
    { name: 'Orange Tang', quantity: 1, price: 666, img: '/orangetangbox.png' }
  ]
};

const MOCK_PAST_ORDERS: Order[] = [
  {
    id: 'NZ-8821',
    date: 'Oct 12, 2026',
    status: 'Delivered',
    total: 666,
    trackingStep: 4,
    items: [{ name: 'Green Mango', quantity: 1, price: 666, img: '/greenmangobox.png' }]
  },
  {
    id: 'NZ-7740',
    date: 'Sep 28, 2026',
    status: 'Delivered',
    total: 2664,
    trackingStep: 4,
    items: [
      { name: 'Blue Lagoon', quantity: 2, price: 1332, img: '/blulagoonbox.png' },
      { name: 'Virgin Mojito', quantity: 2, price: 1332, img: '/mojitobox.png' }
    ]
  }
];

const STEPS = ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

export default function TrackOrderPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setOrders(getStoredOrders());
  }, []);

  const savedActiveId = typeof window !== 'undefined' ? localStorage.getItem('nz_active_tracking_order_id') : null;
  
  const activeOrder = isMounted
    ? ((savedActiveId ? orders.find(o => o.id === savedActiveId && o.status !== 'Delivered' && o.status !== 'Cancelled') : null) || orders.find(o => o.status !== 'Delivered' && o.status !== 'Cancelled') || null)
    : MOCK_ACTIVE_ORDER;

  const pastOrders = isMounted
    ? orders.filter(o => o.id !== activeOrder?.id)
    : MOCK_PAST_ORDERS;

  return (
    <div className="min-h-screen bg-emerald-50 font-poppins text-emerald-950 selection:bg-emerald-200">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-300/20 rounded-full blur-[150px]"></div>
      </div>

      <nav className="p-6 md:p-12 grid grid-cols-3 items-center">
        {/* Left: Logo & Back */}
        <div className="flex justify-start">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-emerald-900/10 flex items-center justify-center group-hover:bg-emerald-900 group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </div>
            <span className="font-black italic text-2xl md:text-4xl tracking-tighter hidden sm:inline leading-none">Ninjaro✧</span>
          </Link>
        </div>

        <div className="hidden md:block"></div>

        <div className="flex justify-end">
          <span className="font-black italic text-2xl md:text-4xl tracking-tighter text-emerald-950 uppercase leading-none">Track Orders</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Active Order Spotlight */}
        {activeOrder ? (
          <section className="space-y-8">
            <h2 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Active Order
            </h2>
            
            <div className="glass-panel bg-white/40 backdrop-blur-3xl p-8 md:p-12 rounded-4xl border border-white/60 shadow-2xl space-y-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-900 text-white px-6 py-2 rounded-bl-2xl font-black uppercase tracking-widest text-[10px]">
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
            </div>
          </section>
        ) : (
          <section className="space-y-8">
            <h2 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
              Active Order
            </h2>
            <div className="glass-panel bg-white/20 backdrop-blur-3xl p-8 md:p-12 rounded-4xl border border-white/50 text-center py-12 text-emerald-900/40 font-bold uppercase tracking-widest">
              No active orders found.
            </div>
          </section>
        )}

        {/* Previous Orders */}
        <section className="space-y-8">
          <h2 className="text-2xl font-black italic uppercase tracking-tight">Previous Deliveries</h2>
          <div className="space-y-4">
            {pastOrders.length === 0 ? (
              <div className="glass-panel bg-white/20 backdrop-blur-3xl p-6 rounded-3xl border border-white/50 text-center py-8 text-emerald-900/30 font-bold uppercase tracking-widest">
                No past deliveries.
              </div>
            ) : (
              pastOrders.map((order) => (
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
                      <p className="font-black text-emerald-950">₹{order.total}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-600/10">
                      {order.status}
                    </div>
                    <span className="material-symbols-outlined text-emerald-950/20 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
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
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60">{selectedOrder.status}</p>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-900/30">Ordered on {selectedOrder.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-950 hover:bg-emerald-900 hover:text-white transition-all border border-emerald-900/5 group" title="Download Invoice">
                  <span className="material-symbols-outlined text-xl">download</span>
                </button>
                <button className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-950 hover:bg-emerald-900 hover:text-white transition-all border border-emerald-900/5 group" title="Support">
                  <span className="material-symbols-outlined text-xl">support_agent</span>
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
                    {selectedOrder.items.map((item, idx) => (
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
                        <p className="font-black text-emerald-950 text-lg">₹{item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-emerald-900/5">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-900/30">Shipping To</h4>
                    <div className="space-y-2">
                      <p className="font-black text-emerald-950">{selectedOrder.customerName || 'Suvrajit Ghoshal'}</p>
                      <p className="text-sm font-medium text-emerald-900/60 leading-relaxed">
                        {selectedOrder.shippingAddress || '123 Botanical Avenue, Floor 4'}<br />
                        {selectedOrder.shippingCity || 'Mumbai'}, India - {selectedOrder.shippingZip || '400001'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-900/30 text-right md:text-left">Financials</h4>
                    <div className="space-y-4">
                      {(() => {
                        const shipCost = selectedOrder.shippingMethod === 'express' ? 150 : 0;
                        const subtotalVal = selectedOrder.total - shipCost;
                        return (
                          <>
                            <div className="flex justify-between items-center text-xs font-black text-emerald-900/40 uppercase tracking-widest">
                              <span>Subtotal</span>
                              <span className="text-emerald-950">₹{subtotalVal}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-black text-emerald-900/40 uppercase tracking-widest">
                              <span>Botanical Tax (GST)</span>
                              <span className="text-emerald-950">Inclusive</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-black text-emerald-900/40 uppercase tracking-widest">
                              <span>Shipping ({selectedOrder.shippingMethod === 'express' ? 'Express' : 'Standard'})</span>
                              <span className={shipCost > 0 ? 'text-emerald-950' : 'text-emerald-500'}>
                                {shipCost > 0 ? `₹${shipCost}` : 'FREE'}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                      <div className="flex justify-between items-center pt-4 border-t border-emerald-900/10">
                        <span className="text-2xl font-black italic uppercase tracking-tighter text-emerald-950">Grand Total</span>
                        <span className="text-4xl font-black text-emerald-900 tracking-tighter">₹{selectedOrder.total}</span>
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
