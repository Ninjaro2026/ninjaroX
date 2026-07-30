"use client";
import React, { useState, useEffect } from 'react';
import { getStoredOrders, saveStoredOrders, Order } from '../../../lib/store';
import { fetchOrders, updateOrderAdmin, downloadBackendOrdersCSV } from '../../../lib/api';
import { OrderCardSkeleton } from '../../../components/Skeleton';

export default function OrdersPage() {
  // Storage state
  const [orders, setOrders] = useState<Order[]>([]);

  // Pagination states (Limit = 20)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  // Filtering / Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled'>('All');
  const [channelFilter, setChannelFilter] = useState<'All' | 'Online' | 'POS'>('All');
  
  // Selected Order for Invoice Print View Modal
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [billFormat, setBillFormat] = useState<'standard' | 'thermal'>('standard');

  // Export Report Specific Filters & Controls
  const [exportDateRange, setExportDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportChannel, setExportChannel] = useState<'all' | 'online' | 'pos'>('all');
  const [exportStatus, setExportStatus] = useState<string>('all');
  const [showExportFilterPanel, setShowExportFilterPanel] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  const [loading, setLoading] = useState(true);

  // Fetch paginated & filtered orders from backend
  useEffect(() => {
    setLoading(true);
    fetchOrders({
      page: currentPage,
      limit: 20,
      search: orderSearch,
      status: orderStatusFilter,
      channel: channelFilter
    })
      .then(res => {
        setOrders(res.orders || []);
        setTotalPages(res.totalPages || 1);
        setTotalOrdersCount(res.total || 0);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [currentPage, orderSearch, orderStatusFilter, channelFilter]);

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

  // Dynamic Export Filtered Orders Generator
  const getExportableOrders = () => {
    return orders.filter(o => {
      // 1. Channel Filter
      if (exportChannel === 'online' && o.isPOS) return false;
      if (exportChannel === 'pos' && !o.isPOS) return false;

      // 2. Status Filter
      if (exportStatus !== 'all' && o.status !== exportStatus) return false;

      // 3. Date Range Filter
      if (exportDateRange !== 'all') {
        const orderDate = new Date(o.date);
        const now = new Date();

        if (exportDateRange === 'today') {
          if (orderDate.toDateString() !== now.toDateString()) return false;
        } else if (exportDateRange === 'week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (orderDate < oneWeekAgo) return false;
        } else if (exportDateRange === 'month') {
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (orderDate < oneMonthAgo) return false;
        } else if (exportDateRange === 'custom') {
          if (exportStartDate && new Date(o.date) < new Date(exportStartDate)) return false;
          if (exportEndDate && new Date(o.date) > new Date(exportEndDate + 'T23:59:59')) return false;
        }
      }

      return true;
    });
  };

  const exportableOrders = getExportableOrders();

  // Sales Report Calculations based on Export Scope
  const totalSales = exportableOrders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.total : 0), 0);
  const reportOrdersCount = exportableOrders.length;
  const onlineRevenue = exportableOrders.filter(o => !o.isPOS && o.status !== 'Cancelled').reduce((sum, o) => sum + o.total, 0);
  const posRevenue = exportableOrders.filter(o => o.isPOS && o.status !== 'Cancelled').reduce((sum, o) => sum + o.total, 0);
  const totalSubtotal = exportableOrders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + i.price, 0), 0);
  const totalCGST = Math.round(totalSubtotal * 0.025);
  const totalSGST = Math.round(totalSubtotal * 0.025);

  // Backend CSV Export Handler
  const handleBackendExportCSV = async () => {
    try {
      setIsExportingCSV(true);
      await downloadBackendOrdersCSV({
        timeframe: exportDateRange,
        startDate: exportStartDate,
        endDate: exportEndDate,
        channel: exportChannel,
        status: exportStatus,
        search: orderSearch
      });
    } catch (err: any) {
      alert(err.message || 'Failed to download CSV from server');
    } finally {
      setIsExportingCSV(false);
    }
  };

  // CSV Report Generator
  const exportToCSV = (ordersToExport: Order[], reportTitle = 'Sales_Report') => {
    if (ordersToExport.length === 0) {
      alert('No orders available in the selected export filter scope.');
      return;
    }
    const headers = [
      'Order ID',
      'Date',
      'Channel',
      'Customer Name',
      'Phone',
      'City',
      'Address',
      'Payment Mode',
      'Status',
      'Items Summary',
      'Subtotal (INR)',
      'CGST 2.5% (INR)',
      'SGST 2.5% (INR)',
      'Grand Total (INR)'
    ];

    const rows = ordersToExport.map(o => {
      const subtotal = (o.items || []).reduce((sum, item) => sum + item.price, 0);
      const cgst = Math.round(subtotal * 0.025);
      const sgst = Math.round(subtotal * 0.025);
      const itemsSummary = (o.items || []).map(i => `${i.name} (x${i.quantity})`).join('; ');
      
      return [
        `"${o.id}"`,
        `"${o.date}"`,
        `"${o.isPOS ? 'POS Counter' : 'Online Store'}"`,
        `"${(o.customerName || 'Walk-In Customer').replace(/"/g, '""')}"`,
        `"${(o.posCustomerPhone || 'N/A').replace(/"/g, '""')}"`,
        `"${(o.shippingCity || 'N/A').replace(/"/g, '""')}"`,
        `"${(o.shippingAddress || 'N/A').replace(/"/g, '""')}"`,
        `"${o.posPaymentMode || 'Online Card/UPI'}"`,
        `"${o.status}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        subtotal,
        cgst,
        sgst,
        o.total
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ninjaro_${reportTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="space-y-8 print:bg-white print:p-0 print:text-black font-poppins">
      
      <main className="space-y-6 print:hidden animate-in fade-in duration-300">
        {/* 0. REPORT EXPORT HEADER & FILTER PANEL */}
        <div className="bg-white p-6 border-2 border-emerald-900/10 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-900/10 border border-emerald-900/20 text-emerald-900 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">assessment</span>
              </div>
              <div>
                <h2 className="text-base font-black uppercase text-emerald-900 tracking-tight">Export Sales & Revenue Reports</h2>
                <p className="text-[11px] text-emerald-900/60 font-semibold">Configure export filters (date range, channel, status) and download CSV or print PDF summary</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={() => setShowExportFilterPanel(!showExportFilterPanel)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all border flex items-center gap-1 cursor-pointer ${
                  showExportFilterPanel ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs' : 'bg-slate-100 text-emerald-900 border-emerald-900/15 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                <span>Filter Options</span>
                <span className="material-symbols-outlined text-sm">{showExportFilterPanel ? 'expand_less' : 'expand_more'}</span>
              </button>

              <button
                type="button"
                disabled={isExportingCSV}
                onClick={handleBackendExportCSV}
                className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-[11px] font-extrabold tracking-wider uppercase transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isExportingCSV ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">download</span>
                )}
                <span>{isExportingCSV ? 'Exporting...' : 'Export CSV'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedInvoiceOrder(null);
                  setTimeout(() => window.print(), 100);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-extrabold tracking-wider uppercase transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Print Report (PDF)</span>
              </button>
            </div>
          </div>

          {/* EXPANDABLE EXPORT FILTERS PANEL */}
          {showExportFilterPanel && (
            <div className="pt-4 border-t border-emerald-900/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-emerald-900/10 animate-in fade-in duration-200">
              {/* Date Range Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-900/60 mb-1">Timeframe / Period</label>
                <select
                  value={exportDateRange}
                  onChange={(e) => setExportDateRange(e.target.value as any)}
                  className="w-full bg-white border border-emerald-900/20 rounded-xl px-3 py-2 text-xs font-bold text-emerald-950 outline-none focus:border-emerald-700"
                >
                  <option value="all">All Time History</option>
                  <option value="today">Today Only</option>
                  <option value="week">Past 7 Days (This Week)</option>
                  <option value="month">Past 30 Days (This Month)</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {/* Channel Scope Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-900/60 mb-1">Sales Channel</label>
                <select
                  value={exportChannel}
                  onChange={(e) => setExportChannel(e.target.value as any)}
                  className="w-full bg-white border border-emerald-900/20 rounded-xl px-3 py-2 text-xs font-bold text-emerald-950 outline-none focus:border-emerald-700"
                >
                  <option value="all">All Channels (Online + POS)</option>
                  <option value="online">Online Store Only</option>
                  <option value="pos">POS Counter Only</option>
                </select>
              </div>

              {/* Status Scope Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-900/60 mb-1">Order Status Scope</label>
                <select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  className="w-full bg-white border border-emerald-900/20 rounded-xl px-3 py-2 text-xs font-bold text-emerald-950 outline-none focus:border-emerald-700"
                >
                  <option value="all">All Order Statuses</option>
                  <option value="Delivered">Delivered / Completed</option>
                  <option value="Processing">Processing / Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Live Metric Badge */}
              <div className="flex flex-col justify-center items-end bg-emerald-950 text-white p-3 rounded-xl shadow-xs">
                <span className="text-[9px] uppercase font-bold text-emerald-200">Export Scope Match</span>
                <span className="text-sm font-black tracking-tight">{exportableOrders.length} Orders • ₹{totalSales}/-</span>
              </div>

              {/* Custom Date Range Pickers (If Custom selected) */}
              {exportDateRange === 'custom' && (
                <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-emerald-900/60 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full bg-white border border-emerald-900/20 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-950 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-emerald-900/60 mb-1">End Date</label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full bg-white border border-emerald-900/20 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-950 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters Header */}
        <div className="bg-white p-6 border-2 border-emerald-900/10 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96 shrink-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/50 text-lg">search</span>
            <input 
              type="text" 
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search by ID, name, city, flavor..." 
              className="w-full bg-slate-50 border-2 border-emerald-900/15 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-black outline-none focus:border-emerald-700 focus:bg-white transition-all text-emerald-900 placeholder-emerald-900/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Channel Filter */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-emerald-900/15 gap-1 shrink-0">
              {(['All', 'Online', 'POS'] as const).map(ch => (
                <button 
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${channelFilter === ch ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/70 hover:text-emerald-900 hover:bg-white'}`}
                >
                  {ch === 'All' ? 'All Channels' : ch === 'Online' ? '🌐 Online' : '🏢 POS'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-emerald-900/15 overflow-x-auto gap-1 max-w-full">
              {(['All', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'] as const).map(st => (
                <button 
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${orderStatusFilter === st ? 'bg-emerald-900 text-white shadow-md' : 'text-emerald-900/70 hover:text-emerald-900 hover:bg-white'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List Container */}
        <div className="space-y-6">
          {loading ? (
            <>
              <OrderCardSkeleton />
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </>
          ) : filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border-2 border-emerald-900/10 rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between gap-6 relative">
              {/* Top row */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-emerald-900/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black tracking-tight text-emerald-900">{order.id}</h3>
                    <span className="text-[10px] text-emerald-900/60 font-black">{order.date}</span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-xs flex items-center gap-1.5 ${
                      order.isPOS 
                        ? 'bg-emerald-950/10 text-emerald-900 border-emerald-900/20' 
                        : 'bg-sky-100 text-sky-900 border-sky-300'
                    }`}>
                      <span className="material-symbols-outlined text-[12px] leading-none">
                        {order.isPOS ? 'storefront' : 'language'}
                      </span>
                      {order.isPOS ? 'In-Store POS' : 'Online Store'}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-widest">
                    Recipient: <span className="text-emerald-900 font-black">{order.customerName || 'Walk-In Customer'}</span>
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

          {orders.length === 0 && (
            <div className="glass-panel bg-white/40 border border-white/60 p-16 text-center text-emerald-900/35 font-bold uppercase text-xs tracking-widest">
              No matching orders in system.
            </div>
          )}

          {/* PAGINATION CONTROLS (20 Orders per page) */}
          {totalPages > 1 && (
            <div className="bg-white p-4 border-2 border-emerald-900/10 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 font-poppins">
              <p className="text-xs font-bold text-emerald-900/70">
                Showing <span className="font-extrabold text-emerald-900">{(currentPage - 1) * 20 + 1}</span> to <span className="font-extrabold text-emerald-900">{Math.min(currentPage * 20, totalOrdersCount)}</span> of <span className="font-black text-emerald-900">{totalOrdersCount}</span> Orders
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-emerald-950 rounded-xl text-xs font-extrabold transition-all border border-emerald-900/15 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pg);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        currentPage === pg ? 'bg-emerald-900 text-white shadow-xs' : 'text-emerald-900 hover:bg-emerald-50'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-emerald-950 rounded-xl text-xs font-extrabold transition-all border border-emerald-900/15 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* PRINT-READY INVOICE PREVIEW MODAL */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          {/* Overlay (Hidden in print) */}
          <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm print:hidden" onClick={() => setSelectedInvoiceOrder(null)}></div>
          
          {/* Invoice Body */}
          <div className="bg-white w-full max-w-2xl h-[720px] rounded-[2.5rem] shadow-2xl p-8 relative z-10 flex flex-col justify-between overflow-hidden border border-emerald-900/5 print:rounded-none print:shadow-none print:border-none print:w-full print:p-8 print:h-auto">
            
            {/* Header controls (Hidden in print) */}
            <div className="flex flex-col gap-4 mb-8 border-b border-emerald-900/5 pb-4 print:hidden shrink-0">
              <div className="flex justify-between items-center">
                <span className="bg-emerald-950/5 text-emerald-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-900/10">Invoice Preview</span>
                
                {/* Format Toggle for POS orders */}
                {selectedInvoiceOrder.isPOS && (
                  <div className="flex bg-emerald-900/5 p-0.5 rounded-xl border border-emerald-900/10 gap-0.5">
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
                    <p className="text-[9px]">Madhyamgram, Dist: Kolkata, West Bengal - 700129</p>
                    <p className="text-[9px]">Tel: +91 8582938152</p>
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
                      <span>CGST @2.5%:</span>
                      <span>₹{Math.round((selectedInvoiceOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.025)}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST @2.5%:</span>
                      <span>₹{Math.round((selectedInvoiceOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.025)}.00</span>
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
                      <h2 className="font-limelight text-4xl uppercase tracking-tighter text-emerald-900">Ninjaro✧</h2>
                      <p className="text-[10px] text-emerald-900 font-extrabold uppercase mt-1">Mocktail Premix Powder Store</p>
                      <p className="text-[9px] text-emerald-900/50 font-bold uppercase">Madhyamgram, Dist: Kolkata, West Bengal - 700129</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-xl font-black uppercase text-emerald-900 tracking-tight">Invoice</h4>
                      <p className="text-xs font-black text-emerald-900 mt-1">{selectedInvoiceOrder!.id}</p>
                      <p className="text-[9px] text-emerald-900/50 font-bold mt-1">Date: {selectedInvoiceOrder!.date}</p>
                    </div>
                  </div>

                  {/* Customer / Store Details */}
                  <div className="grid grid-cols-2 gap-6 bg-emerald-900/5 p-5 rounded-2xl border border-emerald-900/5 print:bg-gray-100 print:border-gray-300">
                    <div>
                      <h5 className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest mb-1.5">Billed To:</h5>
                      <p className="text-xs font-extrabold text-emerald-900">{selectedInvoiceOrder!.customerName || 'Walk-In Customer'}</p>
                      
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
                        <div className="text-[10px] font-bold text-emerald-900 space-y-1">
                          <p>Method: <span className="font-extrabold">{selectedInvoiceOrder!.posPaymentMode || 'Cash'}</span></p>
                          <p>Status: <span className="text-emerald-700 font-extrabold uppercase">Paid</span></p>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-emerald-900 space-y-1">
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
                      <tr className="border-b border-emerald-900/10 text-emerald-900 font-black uppercase tracking-wider pb-2 print:border-gray-400">
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-center w-20">Qty</th>
                        <th className="pb-2 text-right w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/5 print:divide-gray-200">
                      {(selectedInvoiceOrder!.items || []).map((item, idx) => (
                        <tr key={idx} className="font-medium text-emerald-900">
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
                        <span>CGST (2.5%):</span>
                        <span>₹{Math.round((selectedInvoiceOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.025)}/-</span>
                      </div>
                      <div className="flex justify-between text-emerald-900/60 font-bold">
                        <span>SGST (2.5%):</span>
                        <span>₹{Math.round((selectedInvoiceOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.025)}/-</span>
                      </div>
                      <div className="flex justify-between font-black text-emerald-900 text-sm pt-2 border-t border-emerald-900/10 print:border-gray-300">
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

      {/* PRINTABLE EXECUTIVE SALES & REVENUE REPORT (Rendered when printing without single order invoice open) */}
      {!selectedInvoiceOrder && (
        <div id="executive-sales-report" className="hidden print:block font-poppins text-black p-8 space-y-6">
          <div className="border-b-2 border-black pb-4 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-emerald-950">Ninjaro✧ Headquarters</h1>
              <p className="text-xs font-bold uppercase text-gray-700">Official Sales & Revenue Report</p>
              <p className="text-[10px] text-gray-600 font-semibold">Madhyamgram, Dist: Kolkata, West Bengal - 700129 • Ph: +91 8582938152</p>
            </div>
            <div className="text-right text-xs font-bold space-y-0.5">
              <p>Report Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <p className="text-[10px] text-gray-600">Period: {exportDateRange.toUpperCase()} • Channel: {exportChannel.toUpperCase()} • Status: {exportStatus.toUpperCase()}</p>
            </div>
          </div>

          {/* Executive Summary Metrics */}
          <div className="grid grid-cols-4 gap-4 py-2 text-center text-xs">
            <div className="border border-gray-300 p-3 rounded-lg bg-gray-50">
              <p className="text-[9px] uppercase font-bold text-gray-500">Total Revenue</p>
              <p className="text-lg font-black text-emerald-900">₹{totalSales}/-</p>
            </div>
            <div className="border border-gray-300 p-3 rounded-lg bg-gray-50">
              <p className="text-[9px] uppercase font-bold text-gray-500">Total Orders</p>
              <p className="text-lg font-black text-emerald-900">{totalOrdersCount}</p>
            </div>
            <div className="border border-gray-300 p-3 rounded-lg bg-gray-50">
              <p className="text-[9px] uppercase font-bold text-gray-500">Online vs POS</p>
              <p className="text-xs font-black text-emerald-900">₹{onlineRevenue} / ₹{posRevenue}</p>
            </div>
            <div className="border border-gray-300 p-3 rounded-lg bg-gray-50">
              <p className="text-[9px] uppercase font-bold text-gray-500">Total GST (5%)</p>
              <p className="text-xs font-black text-emerald-900">₹{totalCGST + totalSGST}/-</p>
            </div>
          </div>

          {/* Detailed Orders Breakdown Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider border-b border-black pb-1">Itemized Sales Breakdown ({exportableOrders.length} Orders)</h3>
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-black font-bold uppercase text-[9px] text-gray-700">
                  <th className="py-2">Order ID</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Channel</th>
                  <th className="py-2">Customer & Phone</th>
                  <th className="py-2">City</th>
                  <th className="py-2">Payment</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Subtotal</th>
                  <th className="py-2 text-right">GST (5%)</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {exportableOrders.map((o) => {
                  const sub = (o.items || []).reduce((acc, i) => acc + i.price, 0);
                  const gst = Math.round(sub * 0.05);
                  return (
                    <tr key={o.id} className="py-1">
                      <td className="py-1.5 font-bold text-emerald-950">{o.id}</td>
                      <td className="py-1.5">{o.date}</td>
                      <td className="py-1.5 font-semibold">{o.isPOS ? 'POS' : 'Online'}</td>
                      <td className="py-1.5">{o.customerName || 'Walk-In'} {o.posCustomerPhone && `(${o.posCustomerPhone})`}</td>
                      <td className="py-1.5">{o.shippingCity || '-'}</td>
                      <td className="py-1.5">{o.posPaymentMode || 'Online'}</td>
                      <td className="py-1.5 font-bold">{o.status}</td>
                      <td className="py-1.5 text-right">₹{sub}</td>
                      <td className="py-1.5 text-right">₹{gst}</td>
                      <td className="py-1.5 text-right font-black">₹{o.total}/-</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Report Footer & Signature Stamp */}
          <div className="pt-8 border-t border-gray-300 flex justify-between items-center text-[9px] text-gray-500">
            <p>Ninjaro Mocktail Store • Executive Internal Audit Report • E.&O.E.</p>
            <div className="text-center space-y-4">
              <div className="w-36 border-b border-black"></div>
              <p className="font-bold uppercase tracking-wider text-black">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
