"use client";
import React, { useState, useEffect } from 'react';
import { getStoredOrders, saveStoredOrders, Order } from '../../../lib/store';

export default function OrdersPage() {
  // Storage state
  const [orders, setOrders] = useState<Order[]>([]);

  // Filtering / Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled'>('All');
  
  // Selected Order for Invoice Print View Modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    setOrders(getStoredOrders());
  }, []);

  // Order status transitions
  const handleOrderStatusChange = (orderId: string, newStatus: Order['status']) => {
    let newStep = 1;
    if (newStatus === 'Processing') newStep = 1;
    else if (newStatus === 'Shipped') newStep = 2;
    else if (newStatus === 'Out for Delivery') newStep = 3;
    else if (newStatus === 'Delivered') newStep = 4;
    else if (newStatus === 'Cancelled') newStep = 0;

    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          trackingStep: newStep,
          eta: newStatus === 'Delivered' ? 'Delivered' : o.eta
        };
      }
      return o;
    });

    setOrders(updated);
    saveStoredOrders(updated);
  };

  const handlePrintAction = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Filtering orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (order.customerName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (order.shippingCity || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(orderSearch.toLowerCase()));

    const matchesStatus = orderStatusFilter === 'All' ? true : order.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 print:bg-white print:p-0 print:text-black">
      
      <main className="space-y-8 print:hidden animate-in fade-in duration-300">
        {/* Filters Header */}
        <div className="glass-panel bg-white/45 p-5 border border-white/60 rounded-[2rem] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-80 shrink-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/40 text-lg">search</span>
            <input 
              type="text" 
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search by ID, name, city, flavor..." 
              className="w-full bg-white/50 border border-emerald-900/10 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold outline-none focus:border-emerald-600 transition-all text-emerald-950 placeholder-emerald-900/30"
            />
          </div>

          <div className="flex bg-white/40 p-1 rounded-2xl border border-emerald-900/10 w-full md:w-auto overflow-x-auto gap-0.5">
            {(['All', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'] as const).map(st => (
              <button 
                key={st}
                onClick={() => setOrderStatusFilter(st)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${orderStatusFilter === st ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-900/60 hover:text-emerald-950'}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List Container */}
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="glass-panel bg-white/40 border border-white/60 rounded-[2rem] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6 relative">
              {/* POS Tag badge */}
              {order.isPOS && (
                <span className="absolute top-4 right-4 bg-emerald-950 text-white font-extrabold tracking-wider text-[8px] uppercase px-2.5 py-1 rounded-full shadow-md">
                  In-Store Offline POS
                </span>
              )}
              
              {/* Top row */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-emerald-900/5 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-emerald-950">{order.id}</h3>
                    <span className="text-[10px] text-emerald-900/50 font-bold">{order.date}</span>
                  </div>
                  <p className="text-[10px] text-emerald-900/60 font-bold uppercase tracking-widest">
                    Recipient: <span className="text-emerald-950 font-black">{order.customerName || 'Walk-In Customer'}</span>
                    {order.posCustomerPhone && ` • Phone: ${order.posCustomerPhone}`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-emerald-900/40 font-black uppercase tracking-widest">Total Price</span>
                    <span className="text-lg font-black text-emerald-700">₹{order.total}/-</span>
                  </div>
                  <div className="h-8 w-px bg-emerald-900/10"></div>
                  
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1.5 bg-white/60 border border-emerald-900/10 rounded-xl px-2 py-1.5">
                    <span className="material-symbols-outlined text-xs text-emerald-900/40">settings</span>
                    <select 
                      value={order.status}
                      onChange={(e) => handleOrderStatusChange(order.id, e.target.value as any)}
                      className="bg-transparent text-[10px] font-black uppercase text-emerald-950 outline-none border-none cursor-pointer tracking-wider"
                    >
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="flex items-center gap-1 bg-emerald-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3.5 rounded-xl hover:bg-emerald-800 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">print</span> Invoice
                  </button>
                </div>
              </div>

              {/* Middle Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Product List */}
                <div className="md:col-span-2 space-y-3">
                  <span className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest block">Purchased Items</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/50 border border-white/60 p-3 rounded-2xl">
                        <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-sm border border-emerald-900/5 flex items-center justify-center shrink-0">
                          <img src={item.img} alt={item.name} className="h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-emerald-950 truncate">{item.name}</p>
                          <p className="text-[10px] text-emerald-900/50 font-bold mt-0.5">{item.quantity} Qty • ₹{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Logistics */}
                <div className="space-y-3">
                  <span className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest block">Fulfillment Details</span>
                  <div className="bg-white/40 p-4 rounded-2xl border border-white/50 text-[11px] font-medium text-emerald-950/80 leading-relaxed space-y-2">
                    {order.isPOS ? (
                      <div>
                        <p className="font-bold uppercase text-[9px] tracking-wider text-emerald-900/50">Receipt Mode</p>
                        <p className="font-extrabold text-emerald-950">POS Offline Receptionist Counter</p>
                        <p className="font-bold uppercase text-[9px] tracking-wider text-emerald-900/50 mt-1.5">Payment Method</p>
                        <p className="font-extrabold text-emerald-950">{order.posPaymentMode || 'Cash'}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold uppercase text-[9px] tracking-wider text-emerald-900/50">Shipping Destination</p>
                        <p className="font-bold text-emerald-950">{order.shippingAddress}, {order.shippingCity} {order.shippingZip}</p>
                        <p className="font-bold uppercase text-[9px] tracking-wider text-emerald-900/50 mt-1.5">Delivery Courier Option</p>
                        <p className="font-bold text-emerald-950 capitalize">{order.shippingMethod === 'express' ? '⚡ Express Shipping' : 'Standard delivery'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom: Timeline Tracker Stepper */}
              {!order.isPOS && order.status !== 'Cancelled' && (
                <div className="pt-4 border-t border-emerald-900/5">
                  <div className="flex items-center justify-between max-w-xl mx-auto relative">
                    {/* Background Progress Bar Line */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-emerald-900/5 -z-10"></div>
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-900 transition-all duration-500 -z-10"
                      style={{ width: `${((order.trackingStep - 1) / 3) * 100}%` }}
                    ></div>

                    {/* Steppers */}
                    {['Confirmed', 'Processed', 'Shipped', 'Delivered'].map((stepName, stepIndex) => {
                      const isActive = order.trackingStep >= stepIndex + 1;
                      return (
                        <div key={stepName} className="flex flex-col items-center gap-1.5">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 font-bold text-xs ${isActive ? 'bg-emerald-900 text-white border-emerald-900 shadow-md scale-110' : 'bg-white text-emerald-900/40 border-emerald-900/20'}`}>
                            {stepIndex + 1}
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-wider ${isActive ? 'text-emerald-950' : 'text-emerald-900/40'}`}>
                            {stepName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="glass-panel bg-white/40 border border-white/60 p-16 text-center text-emerald-900/35 font-bold uppercase text-xs tracking-widest">
              No matching orders in system.
            </div>
          )}
        </div>
      </main>

      {/* PRINT-READY INVOICE PREVIEW MODAL */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          {/* Overlay (Hidden in print) */}
          <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm print:hidden" onClick={() => setSelectedInvoiceOrder(null)}></div>
          
          {/* Invoice Body */}
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 relative z-10 flex flex-col justify-between overflow-hidden border border-emerald-900/5 print:rounded-none print:shadow-none print:border-none print:p-8 print:w-full">
            
            {/* Header controls (Hidden in print) */}
            <div className="flex justify-between items-center mb-8 border-b border-emerald-900/5 pb-4 print:hidden">
              <span className="bg-emerald-950/5 text-emerald-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-900/10">Invoice Preview</span>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrintAction}
                  className="bg-emerald-900 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-emerald-800 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">print</span> Print Invoice
                </button>
                <button 
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="w-10 h-10 rounded-full bg-emerald-950/5 hover:bg-emerald-900 hover:text-white text-emerald-950 flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Print Contents */}
            <div className="space-y-6 text-black">
              {/* Brand and invoice meta info */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-limelight text-4xl uppercase tracking-tighter text-emerald-950">Ninjaro✧</h2>
                  <p className="text-[10px] text-emerald-900 font-extrabold uppercase mt-1">Mocktail Premix Powder Store</p>
                  <p className="text-[9px] text-emerald-900/50 font-bold uppercase">BKC High Street, Mumbai</p>
                </div>
                <div className="text-right">
                  <h4 className="text-xl font-black uppercase text-emerald-950 tracking-tight">Invoice</h4>
                  <p className="text-xs font-black text-emerald-900 mt-1">{selectedInvoiceOrder.id}</p>
                  <p className="text-[9px] text-emerald-900/50 font-bold mt-1">Date: {selectedInvoiceOrder.date}</p>
                </div>
              </div>

              {/* Customer / Store Details */}
              <div className="grid grid-cols-2 gap-6 bg-emerald-950/5 p-5 rounded-2xl border border-emerald-900/5 print:bg-gray-100 print:border-gray-300">
                <div>
                  <h5 className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest mb-1.5">Billed To:</h5>
                  <p className="text-xs font-extrabold text-emerald-950">{selectedInvoiceOrder.customerName || 'Walk-In Customer'}</p>
                  
                  {selectedInvoiceOrder.isPOS ? (
                    <div className="text-[10px] text-emerald-900/75 mt-1 font-bold">
                      <p>In-Store Sales Counter</p>
                      {selectedInvoiceOrder.posCustomerPhone && <p>Phone: {selectedInvoiceOrder.posCustomerPhone}</p>}
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-900/75 mt-1 font-bold space-y-0.5">
                      <p>{selectedInvoiceOrder.shippingAddress}</p>
                      <p>{selectedInvoiceOrder.shippingCity} {selectedInvoiceOrder.shippingZip}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h5 className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest mb-1.5">Payment Details:</h5>
                  {selectedInvoiceOrder.isPOS ? (
                    <div className="text-[10px] font-bold text-emerald-950 space-y-1">
                      <p>Method: <span className="font-extrabold">{selectedInvoiceOrder.posPaymentMode || 'Cash'}</span></p>
                      <p>Status: <span className="text-emerald-700 font-extrabold uppercase">Paid</span></p>
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-emerald-955 space-y-1">
                      <p>Method: <span className="font-extrabold">Online Payment Gateway</span></p>
                      <p>Status: <span className="font-extrabold">{selectedInvoiceOrder.status === 'Cancelled' ? 'Refunded' : 'Fulfillable'}</span></p>
                      <p>Mode: <span className="font-extrabold capitalize">{selectedInvoiceOrder.shippingMethod} delivery</span></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-emerald-900/10 text-emerald-955 font-black uppercase tracking-wider pb-2 print:border-gray-400">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-center w-20">Qty</th>
                    <th className="pb-2 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/5 print:divide-gray-200">
                  {selectedInvoiceOrder.items.map((item, idx) => (
                    <tr key={idx} className="font-medium text-emerald-950">
                      <td className="py-3 font-bold">{item.name}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right font-black">₹{item.price}/-</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Math breakdown */}
              <div className="border-t border-emerald-900/10 pt-4 flex justify-end print:border-gray-400">
                <div className="w-64 space-y-2 text-right text-xs">
                  <div className="flex justify-between text-emerald-900/60 font-bold">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoiceOrder.total}/-</span>
                  </div>
                  <div className="flex justify-between text-emerald-900/60 font-bold">
                    <span>CGST (9%):</span>
                    <span>₹{Math.round(selectedInvoiceOrder.total * 0.09)}/-</span>
                  </div>
                  <div className="flex justify-between text-emerald-900/60 font-bold">
                    <span>SGST (9%):</span>
                    <span>₹{Math.round(selectedInvoiceOrder.total * 0.09)}/-</span>
                  </div>
                  <div className="flex justify-between text-emerald-950 font-black text-sm pt-2 border-t border-emerald-900/10 print:border-gray-300">
                    <span>Net Invoice Total:</span>
                    <span>₹{selectedInvoiceOrder.total}/-</span>
                  </div>
                </div>
              </div>

              {/* Bottom message */}
              <div className="pt-8 border-t border-emerald-900/5 text-center text-[9px] text-emerald-900/40 uppercase tracking-widest font-bold print:border-gray-300">
                Thank you for choosing Ninjaro✧ • Keep Shifting Your State.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
