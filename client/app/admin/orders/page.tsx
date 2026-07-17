"use client";
import React, { useState, useEffect } from 'react';
import { getStoredOrders, saveStoredOrders, Order } from '../../../lib/store';
import { fetchOrders, updateOrderAdmin } from '../../../lib/api';

export default function OrdersPage() {
  // Storage state
  const [orders, setOrders] = useState<Order[]>([]);

  // Filtering / Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled'>('All');
  const [channelFilter, setChannelFilter] = useState<'All' | 'Online' | 'POS'>('All');
  
  // Selected Order for Invoice Print View Modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [billFormat, setBillFormat] = useState<'standard' | 'thermal'>('standard');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders()
      .then(data => {
        setOrders(data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Order status transitions
  const handleOrderStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const updatedOrder = await updateOrderAdmin(orderId, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
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
      (order.items || []).some(item => item.name.toLowerCase().includes(orderSearch.toLowerCase()));

    const matchesStatus = orderStatusFilter === 'All' ? true : order.status === orderStatusFilter;
    
    const matchesChannel = 
      channelFilter === 'All' ? true :
      channelFilter === 'Online' ? !order.isPOS : order.isPOS;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-poppins">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-900 border-t-transparent mx-auto"></div>
          <p className="text-emerald-900/60 font-bold uppercase text-xs tracking-widest">Loading Orders...</p>
        </div>
      </div>
    );
  }

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

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
            {/* Channel Filter */}
            <div className="flex bg-white/50 p-1 rounded-2xl border border-emerald-900/10 gap-0.5 shrink-0">
              {(['All', 'Online', 'POS'] as const).map(ch => (
                <button 
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-3.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${channelFilter === ch ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-900/60 hover:text-emerald-950'}`}
                >
                  {ch === 'All' ? 'All Channels' : ch === 'Online' ? '🌐 Online' : '🏢 POS'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex bg-white/50 p-1 rounded-2xl border border-emerald-900/10 overflow-x-auto gap-0.5 max-w-full">
              {(['All', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'] as const).map(st => (
                <button 
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${orderStatusFilter === st ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-900/60 hover:text-emerald-950'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List Container */}
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="glass-panel bg-white/40 border border-white/60 rounded-[2rem] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-6 relative">
              {/* Top row */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-emerald-900/5 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black tracking-tight text-emerald-950">{order.id}</h3>
                    <span className="text-[10px] text-emerald-900/50 font-bold">{order.date}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border shadow-sm flex items-center gap-1.5 ${
                      order.isPOS 
                        ? 'bg-emerald-900/5 text-emerald-800 border-emerald-900/10' 
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      <span className="material-symbols-outlined text-[11px] leading-none">
                        {order.isPOS ? 'storefront' : 'language'}
                      </span>
                      {order.isPOS ? 'In-Store POS' : 'Online Store'}
                    </span>
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
                  
                  {/* Status Dropdown / Static POS Status */}
                  {order.isPOS ? (
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-emerald-500/20 shadow-xs">
                      <span className="material-symbols-outlined text-sm text-emerald-600">done_all</span>
                      Delivered
                    </div>
                  ) : (
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
                  )}

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
                    {(order.items || []).map((item, idx) => (
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          {/* Overlay (Hidden in print) */}
          <div className="absolute inset-0 bg-emerald-955/40 backdrop-blur-sm print:hidden" onClick={() => setSelectedInvoiceOrder(null)}></div>
          
          {/* Invoice Body */}
          <div className="bg-white w-full max-w-2xl h-[720px] rounded-[2.5rem] shadow-2xl p-8 relative z-10 flex flex-col justify-between overflow-hidden border border-emerald-900/5 print:rounded-none print:shadow-none print:border-none print:w-full print:p-8 print:h-auto">
            
            {/* Header controls (Hidden in print) */}
            <div className="flex flex-col gap-4 mb-8 border-b border-emerald-900/5 pb-4 print:hidden shrink-0">
              <div className="flex justify-between items-center">
                <span className="bg-emerald-950/5 text-emerald-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-900/10">Invoice Preview</span>
                
                {/* Format Toggle for POS orders */}
                {selectedInvoiceOrder.isPOS && (
                  <div className="flex bg-emerald-955/5 p-0.5 rounded-xl border border-emerald-900/10 gap-0.5">
                    <button 
                      onClick={() => setBillFormat('standard')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${billFormat === 'standard' ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-900/60 hover:text-emerald-950'}`}
                    >
                      Standard
                    </button>
                    <button 
                      onClick={() => setBillFormat('thermal')}
                      className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${billFormat === 'thermal' ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-900/60 hover:text-emerald-950'}`}
                    >
                      Thermal Roll
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="w-8 h-8 rounded-full bg-emerald-950/5 hover:bg-emerald-900 hover:text-white text-emerald-950 flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <button 
                onClick={handlePrintAction}
                className="w-full bg-emerald-900 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <span className="material-symbols-outlined text-base">print</span> Print Invoice
              </button>
            </div>

            {/* Scrollable Content (Height consistent on screen, auto on print) */}
            <div className="flex-1 overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-emerald-900/10 print:overflow-visible print:h-auto print:pr-0 print:pb-0">
              
              {/* Thermal Monospace format */}
              {selectedInvoiceOrder.isPOS && billFormat === 'thermal' ? (
                <div className="font-mono text-black text-[10px] leading-tight space-y-3 uppercase tracking-tight w-full max-w-[280px] mx-auto">
                  <div className="text-center space-y-1">
                    <h2 className="font-bold text-sm tracking-tight text-black">NINJARO STORE</h2>
                    <p className="text-[9px]">Mocktail Premix Powder Desk</p>
                    <p className="text-[9px]">BKC High Street, Mumbai</p>
                    <p className="text-[9px]">Tel: +91 99999-88888</p>
                    <p className="text-[9px] pt-1">------- CASH MEMO -------</p>
                  </div>

                  <div className="space-y-1 border-t border-dashed border-gray-500 pt-2">
                    <div>Date: {selectedInvoiceOrder!.date}</div>
                    <div>Bill No: {selectedInvoiceOrder!.id}</div>
                    <div>Cashier: Admin Desk</div>
                    <div>Payment: {selectedInvoiceOrder!.posPaymentMode || 'Cash'}</div>
                    {selectedInvoiceOrder!.customerName && (
                      <div>Customer: {selectedInvoiceOrder!.customerName}</div>
                    )}
                    {selectedInvoiceOrder!.posCustomerPhone && (
                      <div>Phone: {selectedInvoiceOrder!.posCustomerPhone}</div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-gray-500 pt-2 pb-1">
                    <table className="w-full text-left font-mono text-[9px] leading-none">
                      <thead>
                        <tr className="border-b border-dashed border-gray-500 font-bold">
                          <th className="pb-1">Particulars</th>
                          <th className="pb-1 text-center w-8">Qty</th>
                          <th className="pb-1 text-right w-12">Rate</th>
                          <th className="pb-1 text-right w-16">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedInvoiceOrder!.items || []).map((item, idx) => {
                          const unitRate = item.quantity > 0 ? Math.round(item.price / item.quantity) : item.price;
                          return (
                            <tr key={idx} className="border-b border-dotted border-gray-300">
                              <td className="py-1">{item.name}</td>
                              <td className="py-1 text-center">{item.quantity}</td>
                              <td className="py-1 text-right">₹{unitRate}</td>
                              <td className="py-1 text-right">₹{item.price}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-dashed border-gray-500 pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Sub Total:</span>
                      <span>₹{(selectedInvoiceOrder!.items || []).reduce((acc, item) => acc + item.price, 0)}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CGST @9%:</span>
                      <span>₹{Math.round((selectedInvoiceOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.09)}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST @9%:</span>
                      <span>₹{Math.round((selectedInvoiceOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.09)}.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs border-t border-dashed border-gray-500 pt-1.5">
                      <span>TOTAL:</span>
                      <span>₹{selectedInvoiceOrder!.total}.00</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-500 pt-3 text-center space-y-1">
                    <p className="font-bold text-[9px] tracking-widest">THANK YOU - VISIT AGAIN</p>
                    <p className="text-[8px] font-bold">E.&O.E.</p>
                  </div>
                </div>
              ) : (
                /* Standard Premium Layout */
                <div className="space-y-6 text-black">
                  {/* Brand and invoice meta info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-limelight text-4xl uppercase tracking-tighter text-emerald-955">Ninjaro✧</h2>
                      <p className="text-[10px] text-emerald-900 font-extrabold uppercase mt-1">Mocktail Premix Powder Store</p>
                      <p className="text-[9px] text-emerald-900/50 font-bold uppercase">BKC High Street, Mumbai</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-xl font-black uppercase text-emerald-955 tracking-tight">Invoice</h4>
                      <p className="text-xs font-black text-emerald-900 mt-1">{selectedInvoiceOrder!.id}</p>
                      <p className="text-[9px] text-emerald-900/50 font-bold mt-1">Date: {selectedInvoiceOrder!.date}</p>
                    </div>
                  </div>

                  {/* Customer / Store Details */}
                  <div className="grid grid-cols-2 gap-6 bg-emerald-955/5 p-5 rounded-2xl border border-emerald-900/5 print:bg-gray-100 print:border-gray-300">
                    <div>
                      <h5 className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest mb-1.5">Billed To:</h5>
                      <p className="text-xs font-extrabold text-emerald-955">{selectedInvoiceOrder!.customerName || 'Walk-In Customer'}</p>
                      
                      {selectedInvoiceOrder!.isPOS ? (
                        <div className="text-[10px] text-emerald-900/75 mt-1 font-bold">
                          <p>In-Store Sales Counter</p>
                          {selectedInvoiceOrder!.posCustomerPhone && <p>Phone: {selectedInvoiceOrder!.posCustomerPhone}</p>}
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-900/75 mt-1 font-bold space-y-0.5">
                          <p>{selectedInvoiceOrder!.shippingAddress}</p>
                          <p>{selectedInvoiceOrder!.shippingCity} {selectedInvoiceOrder!.shippingZip}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest mb-1.5">Payment Details:</h5>
                      {selectedInvoiceOrder!.isPOS ? (
                        <div className="text-[10px] font-bold text-emerald-955 space-y-1">
                          <p>Method: <span className="font-extrabold">{selectedInvoiceOrder!.posPaymentMode || 'Cash'}</span></p>
                          <p>Status: <span className="text-emerald-700 font-extrabold uppercase">Paid</span></p>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-emerald-955 space-y-1">
                          <p>Method: <span className="font-extrabold">Online Payment Gateway</span></p>
                          <p>Status: <span className="font-extrabold">{selectedInvoiceOrder!.status === 'Cancelled' ? 'Refunded' : 'Fulfillable'}</span></p>
                          <p>Mode: <span className="font-extrabold capitalize">{selectedInvoiceOrder!.shippingMethod} delivery</span></p>
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
                      {(selectedInvoiceOrder!.items || []).map((item, idx) => (
                        <tr key={idx} className="font-medium text-emerald-955">
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
                        <span>₹{(selectedInvoiceOrder!.items || []).reduce((acc, item) => acc + item.price, 0)}/-</span>
                      </div>
                      <div className="flex justify-between text-emerald-900/60 font-bold">
                        <span>CGST (9%):</span>
                        <span>₹{Math.round((selectedInvoiceOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.09)}/-</span>
                      </div>
                      <div className="flex justify-between text-emerald-900/60 font-bold">
                        <span>SGST (9%):</span>
                        <span>₹{Math.round((selectedInvoiceOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.09)}/-</span>
                      </div>
                      <div className="flex justify-between font-black text-emerald-955 text-sm pt-2 border-t border-emerald-900/10 print:border-gray-300">
                        <span>Net Invoice Total:</span>
                        <span>₹{selectedInvoiceOrder!.total}/-</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom message */}
                  <div className="pt-8 border-t border-emerald-900/5 text-center text-[9px] text-emerald-900/40 uppercase tracking-widest font-bold print:border-gray-300">
                    Thank you for choosing Ninjaro✧ • Keep Shifting Your State.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
