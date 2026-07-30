"use client";
import React, { useState, useEffect } from 'react';
import { Product, Order } from '../../lib/store';
import { fetchProducts, fetchOrders } from '../../lib/api';
import { StatCardSkeleton, TableSkeleton } from '../../components/Skeleton';

type ChannelFilter = 'all' | 'online' | 'offline';

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchOrders({ all: true })])
      .then(([productsData, ordersData]) => {
        setProducts(productsData || []);
        const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || []);
        setOrders(ordersList);
      })
      .catch(err => {
        console.error('Failed to fetch data from API', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // KPIs
  const validOrders = orders.filter(o => o.status !== 'Cancelled');
  const onlineOrders = validOrders.filter(o => !o.isPOS);
  const offlineOrders = validOrders.filter(o => !!o.isPOS);

  const totalRevenue = validOrders.reduce((acc, o) => acc + o.total, 0);
  const onlineRevenue = onlineOrders.reduce((acc, o) => acc + o.total, 0);
  const offlineRevenue = offlineOrders.reduce((acc, o) => acc + o.total, 0);

  const avgOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
  const avgOnlineValue = onlineOrders.length > 0 ? Math.round(onlineRevenue / onlineOrders.length) : 0;
  const avgOfflineValue = offlineOrders.length > 0 ? Math.round(offlineRevenue / offlineOrders.length) : 0;

  const totalCount = validOrders.length;
  const onlineCount = onlineOrders.length;
  const offlineCount = offlineOrders.length;
  const ordersOnlinePct = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0;
  const ordersOfflinePct = totalCount > 0 ? Math.round((offlineCount / totalCount) * 100) : 0;

  const baseOrders = orders
    .filter(o => o.isPOS ? true : o.status === 'Delivered')
    .slice(); // Sort / order maintained from server-side sort

  const filteredOrders = baseOrders.filter(o =>
    channelFilter === 'all' ? true :
    channelFilter === 'online' ? !o.isPOS :
    o.isPOS
  );

  const channelTabs: { key: ChannelFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'online', label: '🌐 Online' },
    { key: 'offline', label: '🏢 Offline' },
  ];

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in font-poppins">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="glass-panel bg-white/45 border border-white/60 rounded-3xl p-6">
          <TableSkeleton rows={5} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white border-2 border-emerald-900/10 rounded-3xl p-6 relative overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-4 right-4 w-11 h-11 bg-emerald-900 text-white rounded-2xl flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-xl">payments</span>
          </div>
          <p className="text-emerald-800 font-black uppercase text-[10px] tracking-widest">Total Sales Revenue</p>
          <h3 className="text-3xl font-black text-emerald-950 mt-3">₹{totalRevenue}/-</h3>
          <div className="mt-4 pt-4 border-t border-emerald-900/10 grid grid-cols-2 gap-2 text-[10px] font-extrabold text-emerald-950">
            <div className="space-y-0.5">
              <span className="text-emerald-800/80 uppercase text-[9px] tracking-wider block font-extrabold">🌐 Online Sales</span>
              <span className="text-emerald-950 font-black">₹{onlineRevenue}/-</span>
            </div>
            <div className="space-y-0.5 border-l border-emerald-900/10 pl-2">
              <span className="text-emerald-800/80 uppercase text-[9px] tracking-wider block font-extrabold">🏢 Offline Desk</span>
              <span className="text-emerald-950 font-black">₹{offlineRevenue}/-</span>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-emerald-900/10 rounded-3xl p-6 relative overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-4 right-4 w-11 h-11 bg-emerald-900 text-white rounded-2xl flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-xl">shopping_bag</span>
          </div>
          <p className="text-emerald-800 font-black uppercase text-[10px] tracking-widest">Orders Processed</p>
          <h3 className="text-3xl font-black text-emerald-950 mt-3">{totalCount} Bills</h3>
          <div className="mt-4 pt-4 border-t border-emerald-900/10 grid grid-cols-2 gap-2 text-[10px] font-extrabold text-emerald-950">
            <div className="space-y-0.5">
              <span className="text-emerald-800/80 uppercase text-[9px] tracking-wider block font-extrabold">🌐 Online Count</span>
              <span className="text-emerald-950 font-black">{onlineCount} ({ordersOnlinePct}%)</span>
            </div>
            <div className="space-y-0.5 border-l border-emerald-900/10 pl-2">
              <span className="text-emerald-800/80 uppercase text-[9px] tracking-wider block font-extrabold">🏢 Offline Count</span>
              <span className="text-emerald-950 font-black">{offlineCount} ({ordersOfflinePct}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-emerald-900/10 rounded-3xl p-6 relative overflow-hidden shadow-md hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-4 right-4 w-11 h-11 bg-emerald-900 text-white rounded-2xl flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-xl">insights</span>
          </div>
          <p className="text-emerald-800 font-black uppercase text-[10px] tracking-widest">Average Order Value</p>
          <h3 className="text-3xl font-black text-emerald-950 mt-3">₹{avgOrderValue}/-</h3>
          <div className="mt-4 pt-4 border-t border-emerald-900/10 grid grid-cols-2 gap-2 text-[10px] font-extrabold text-emerald-950">
            <div className="space-y-0.5">
              <span className="text-emerald-800/80 uppercase text-[9px] tracking-wider block font-extrabold">🌐 Online Mean</span>
              <span className="text-emerald-950 font-black">₹{avgOnlineValue}/-</span>
            </div>
            <div className="space-y-0.5 border-l border-emerald-900/10 pl-2">
              <span className="text-emerald-800/80 uppercase text-[9px] tracking-wider block font-extrabold">🏢 Offline Mean</span>
              <span className="text-emerald-950 font-black">₹{avgOfflineValue}/-</span>
            </div>
          </div>
        </div>

      </div>

      {/* Order History */}
      <div className="bg-white p-8 rounded-4xl border-2 border-emerald-900/10 shadow-xl space-y-6">

        <div>
          <h3 className="font-black text-emerald-950 uppercase tracking-tight text-lg">Order History Ledger</h3>
          <p className="text-[11px] text-emerald-800 font-extrabold mt-0.5 uppercase tracking-wider">
            Offline — all in-store bills &nbsp;·&nbsp; Online — completed deliveries
          </p>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-emerald-900/10 gap-1">
            {channelTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setChannelFilter(tab.key)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  channelFilter === tab.key
                    ? 'bg-emerald-900 text-white shadow-md'
                    : 'text-emerald-950/70 hover:text-emerald-950 hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[10px] bg-emerald-900/5 border border-emerald-900/15 text-emerald-950 font-black uppercase tracking-widest px-3.5 py-2 rounded-xl">
            {filteredOrders.length} record{filteredOrders.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-emerald-900/10">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-emerald-950 border-b border-emerald-900/15 font-black uppercase tracking-wider text-[10px]">
                <th className="py-4 px-4">Order ID</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Items</th>
                <th className="py-4 px-4">Channel</th>
                <th className="py-4 px-4">Amount</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/10 bg-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-emerald-900/50 font-extrabold uppercase tracking-widest text-[11px]">
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="px-4 py-4 font-black text-emerald-950 text-[11px]">{order.id}</td>
                    <td className="px-4 py-4 font-semibold text-emerald-900">{order.customerName || 'Walk-In'}</td>
                    <td className="px-4 py-4 text-emerald-900/70 font-medium max-w-[180px]">
                      <span className="truncate block" title={(order.items || []).map(i => `${i.name} x${i.quantity}`).join(', ')}>
                        {(order.items || []).map(i => `${i.name.replace(/\s*\(.*\)/, '')} ×${i.quantity}`).join(', ')}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                        order.isPOS
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}>
                        {order.isPOS ? '🏢 Offline' : '🌐 Online'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 font-black text-emerald-950">₹{order.total}/-</td>
                    <td className="py-3.5 pr-4">
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 border border-emerald-500/20' :
                        order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border border-red-200' :
                        'bg-amber-100 text-amber-700 border border-amber-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-emerald-900/20 hover:shadow-md"
                      >
                        <span className="material-symbols-outlined text-[13px]">receipt_long</span>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:inset-auto print:fixed print:top-0 print:left-0 print:z-9999">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-emerald-950/30 backdrop-blur-sm print:hidden"
            onClick={() => setSelectedOrder(null)}
          />

          {/* Invoice card */}
          <div id="invoice-print-area" className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 print:rounded-none print:shadow-none print:max-w-full print:w-full">

            {/* Modal top bar — hidden on print */}
            <div className="flex items-center justify-between px-7 pt-6 pb-0 print:hidden">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/50">Invoice Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">print</span>
                  Print Invoice
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-emerald-950/5 hover:bg-emerald-950/10 flex items-center justify-center text-emerald-950/50 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Invoice Body */}
            <div className="p-7 space-y-5">

              {/* Brand header */}
              <div className="text-center border-b border-dashed border-emerald-900/15 pb-5">
                <h1 className="text-2xl font-black text-emerald-950 tracking-tight">NINJARO</h1>
                <p className="text-[10px] text-emerald-900/50 font-medium mt-0.5">Premium Mocktail Brand</p>
                <p className="text-[9px] text-emerald-900/40 mt-1 uppercase tracking-widest font-bold">TAX INVOICE</p>
              </div>

              {/* Order meta — 2 col grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[11px]">
                <div>
                  <span className="text-emerald-900/40 text-[9px] uppercase font-black tracking-widest block">Order ID</span>
                  <span className="font-black text-emerald-950">{selectedOrder.id}</span>
                </div>
                <div>
                  <span className="text-emerald-900/40 text-[9px] uppercase font-black tracking-widest block">Date</span>
                  <span className="font-semibold text-emerald-900">{selectedOrder.date}</span>
                </div>
                <div>
                  <span className="text-emerald-900/40 text-[9px] uppercase font-black tracking-widest block">Customer</span>
                  <span className="font-semibold text-emerald-900">{selectedOrder.customerName || 'Walk-In Customer'}</span>
                </div>
                <div>
                  <span className="text-emerald-900/40 text-[9px] uppercase font-black tracking-widest block">Channel</span>
                  <span className={`font-black text-[10px] ${selectedOrder.isPOS ? 'text-emerald-700' : 'text-sky-700'}`}>
                    {selectedOrder.isPOS ? '🏢 Offline Counter' : '🌐 Online Storefront'}
                  </span>
                </div>
                {selectedOrder.isPOS && selectedOrder.posPaymentMode && (
                  <div>
                    <span className="text-emerald-900/40 text-[9px] uppercase font-black tracking-widest block">Payment Mode</span>
                    <span className="font-black text-emerald-950">{selectedOrder.posPaymentMode}</span>
                  </div>
                )}
                {selectedOrder.isPOS && selectedOrder.posCustomerPhone && (
                  <div>
                    <span className="text-emerald-900/40 text-[9px] uppercase font-black tracking-widest block">Phone</span>
                    <span className="font-semibold text-emerald-900">{selectedOrder.posCustomerPhone}</span>
                  </div>
                )}
                {!selectedOrder.isPOS && selectedOrder.shippingAddress && (
                  <div className="col-span-2">
                    <span className="text-emerald-900/40 text-[9px] uppercase font-black tracking-widest block">Delivery Address</span>
                    <span className="font-semibold text-emerald-900">
                      {selectedOrder.shippingAddress}{selectedOrder.shippingCity ? `, ${selectedOrder.shippingCity}` : ''}{selectedOrder.shippingZip ? ` — ${selectedOrder.shippingZip}` : ''}
                    </span>
                  </div>
                )}
                {!selectedOrder.isPOS && selectedOrder.shippingMethod && (
                  <div>
                    <span className="text-emerald-900/40 text-[9px] uppercase font-black tracking-widest block">Shipping</span>
                    <span className="font-semibold text-emerald-900 capitalize">{selectedOrder.shippingMethod}</span>
                  </div>
                )}
                <div>
                  <span className="text-emerald-900/40 text-[9px] uppercase font-black tracking-widest block">Status</span>
                  <span className={`font-black text-[10px] ${
                    selectedOrder.status === 'Delivered' ? 'text-emerald-700' :
                    selectedOrder.status === 'Cancelled' ? 'text-red-600' : 'text-amber-600'
                  }`}>{selectedOrder.status}</span>
                </div>
              </div>

              {/* Items table */}
              <div className="border border-emerald-900/10 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-emerald-950/5 text-emerald-900/50 font-black uppercase tracking-widest text-[9px]">
                      <th className="px-4 py-2.5 text-left">Item</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/5">
                    {(selectedOrder.items || []).map((item, idx) => {
                      const unitPrice = item.quantity > 0 ? Math.round(item.price / item.quantity) : item.price;
                      return (
                        <tr key={idx} className="text-emerald-950">
                          <td className="px-4 py-3 font-semibold">{item.name}</td>
                          <td className="px-4 py-3 text-center font-bold text-emerald-900/70">×{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-900/70">₹{unitPrice}/-</td>
                          <td className="px-4 py-3 text-right font-black">₹{item.price}/-</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-emerald-950 text-white rounded-2xl px-5 py-4">
                <span className="text-[11px] font-black uppercase tracking-widest">Grand Total</span>
                <span className="text-xl font-black">₹{selectedOrder.total}/-</span>
              </div>

              {/* Footer note */}
              <p className="text-center text-[9px] text-emerald-900/30 font-bold uppercase tracking-widest pt-1 border-t border-dashed border-emerald-900/10">
                Thank you for choosing Ninjaro · This is a computer generated invoice
              </p>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
