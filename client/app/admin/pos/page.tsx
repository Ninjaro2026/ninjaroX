"use client";
import React, { useState, useEffect } from 'react';
import { getStoredProducts, saveStoredProducts, getStoredOrders, saveStoredOrders, Product, Order, getProductStock, decrementProductStock } from '../../../lib/store';
import { fetchProducts, fetchOrders, placeOrder } from '../../../lib/api';

interface POSItem {
  product: Product;
  quantity: number;
}

export default function POSPage() {
  // Live state from storage
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // POS Cart State
  const [posCart, setPosCart] = useState<POSItem[]>([]);
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Search product
  const [searchQuery, setSearchQuery] = useState('');

  // Active placed POS order for thermal print modal
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [billFormat, setBillFormat] = useState<'standard' | 'thermal'>('standard');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchOrders()])
      .then(([productsData, ordersData]) => {
        setProducts(productsData || []);
        setOrders(ordersData || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Add to POS Cart
  const handleAddToPOSCart = (product: Product) => {
    const computedStock = getProductStock(product, products);
    if (computedStock <= 0) {
      alert(`Sorry, ${product.name} is currently out of stock.`);
      return;
    }

    setPosCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= computedStock) {
          alert(`Cannot add more. Limit of ${computedStock} units reached.`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Update POS Cart quantity
  const handleUpdatePOSQty = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const computedStock = getProductStock(product, products);

    setPosCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > computedStock) {
            alert(`Sorry, only ${computedStock} units are available.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter((item): item is POSItem => item !== null);
    });
  };

  // Calculations
  const subtotal = posCart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const gstAmount = Math.round(subtotal * 0.18);
  const total = Math.max(0, subtotal + gstAmount - discountAmount);

  // Submit and Print Receipt
  const handleCheckoutPOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) {
      alert('POS cart is empty. Please select products.');
      return;
    }

    try {
      const orderPayload = {
        total: total,
        customerName: customerName.trim() || 'Walk-In Customer',
        isPOS: true,
        posPaymentMode: paymentMode,
        posCustomerPhone: customerPhone.trim() || undefined,
        items: posCart.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price * item.quantity,
          img: item.product.imageSrc
        }))
      };

      const newOrder = await placeOrder(orderPayload);
      
      // Update local state orders
      setOrders(prev => [newOrder, ...prev]);

      // Set active receipt to launch Thermal overlay
      setReceiptOrder(newOrder);

      // Re-fetch products to get updated stock levels from backend
      const updatedProds = await fetchProducts();
      setProducts(updatedProds);
    } catch (err: any) {
      alert(err.message || 'Failed to place POS order');
    }
  };

  const handleStartNewBill = () => {
    setPosCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountAmount(0);
    setPaymentMode('Cash');
    setReceiptOrder(null);
  };

  const handlePrintReceipt = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Filter products for POS Grid
  const posProductsFiltered = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-poppins">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-900 border-t-transparent mx-auto"></div>
          <p className="text-emerald-900/60 font-bold uppercase text-xs tracking-widest">Loading POS Counter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="print:bg-white print:p-0 print:text-black">
      
      {/* CSS print style to only show receipt during print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-receipt-container, .print-receipt-container * {
            visibility: visible !important;
          }
          .print-receipt-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Main Billing columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden animate-in fade-in duration-300">
        
        {/* Left Column: Product Selection Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel bg-white/40 p-4 border border-white/60 rounded-3xl shadow-sm flex items-center justify-between gap-4">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/40 text-lg">search</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quick lookup by item name..." 
                className="w-full bg-white/50 border border-emerald-900/10 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold outline-none focus:border-emerald-600 transition-all text-emerald-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {posProductsFiltered.map(p => {
              const stockVal = getProductStock(p, products);
              return (
                <button 
                  key={p.id}
                  onClick={() => handleAddToPOSCart(p)}
                  className="glass-panel bg-white/40 border border-white/60 rounded-3xl p-4 flex flex-col justify-between text-left hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 relative group overflow-hidden"
                >
                  {p.isCombo && (
                    <span className="absolute top-3 left-3 bg-emerald-950 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                      Combo Pack
                    </span>
                  )}

                  <div className="w-full h-28 flex items-center justify-center p-3 rounded-2xl bg-emerald-950/5 group-hover:bg-emerald-950/10 transition-colors">
                    <img src={p.imageSrc} alt={p.name} className="h-full object-contain drop-shadow-md" />
                  </div>

                  <div className="mt-3 space-y-1">
                    <h4 className="font-black text-emerald-950 text-xs truncate uppercase tracking-wider">{p.name}</h4>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-emerald-700 text-xs font-black">₹{p.price}/-</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${stockVal === 0 ? 'bg-red-50 text-red-655' : 'bg-emerald-950/5 text-emerald-900/60'}`}>
                        {stockVal === 0 ? 'Out of Stock' : `${stockVal} in stock`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {posProductsFiltered.length === 0 && (
              <div className="col-span-full py-16 text-center text-emerald-900/35 font-bold uppercase text-xs tracking-widest">
                No catalog items found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Billing cart ledger */}
        <form onSubmit={handleCheckoutPOS} className="glass-panel bg-white/50 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/60 shadow-lg flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-emerald-900/5 pb-3">
              <h3 className="font-black text-emerald-950 uppercase tracking-tight text-sm">Receipt Cart</h3>
              <span className="text-[9px] bg-emerald-950 text-white font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {posCart.reduce((a, b) => a + b.quantity, 0)} Items
              </span>
            </div>

            {/* Cart List */}
            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {posCart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-white/40 rounded-2xl border border-white/50 gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-emerald-950 truncate uppercase tracking-wider">{item.product.name}</p>
                    <p className="text-[10px] text-emerald-700 font-extrabold mt-0.5">₹{item.product.price} unit</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Qty selectors */}
                    <div className="flex items-center bg-white border border-emerald-900/10 rounded-lg h-7 overflow-hidden">
                      <button 
                        type="button"
                        onClick={() => handleUpdatePOSQty(item.product.id, -1)}
                        className="w-7 h-full flex items-center justify-center text-emerald-950 hover:bg-emerald-50"
                      >
                        <span className="material-symbols-outlined text-xs">remove</span>
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-emerald-955">{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => handleUpdatePOSQty(item.product.id, 1)}
                        className="w-7 h-full flex items-center justify-center text-emerald-955 hover:bg-emerald-50"
                      >
                        <span className="material-symbols-outlined text-xs">add</span>
                      </button>
                    </div>

                    <span className="font-black text-xs text-emerald-950 w-16 text-right">₹{item.product.price * item.quantity}</span>
                  </div>
                </div>
              ))}

              {posCart.length === 0 && (
                <div className="text-center py-16 text-emerald-900/30 font-bold uppercase text-[10px] tracking-widest flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                  Cart is empty. Add items from the catalog.
                </div>
              )}
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="space-y-4 pt-4 border-t border-emerald-900/5">
            <span className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest block">Customer Information</span>
            
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name" 
                className="w-full bg-white/45 border border-emerald-900/10 rounded-xl px-3 py-2.5 text-[11px] font-bold outline-none focus:border-emerald-600 transition-all text-emerald-955 placeholder-emerald-900/30"
              />
              <input 
                type="tel" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Customer Phone" 
                className="w-full bg-white/45 border border-emerald-900/10 rounded-xl px-3 py-2.5 text-[11px] font-bold outline-none focus:border-emerald-600 transition-all text-emerald-955 placeholder-emerald-900/30"
              />
            </div>

            {/* Payment Mode */}
            <div className="grid grid-cols-3 bg-emerald-950/5 p-1 rounded-xl border border-emerald-900/10">
              {(['Cash', 'Card', 'UPI'] as const).map(mode => (
                <button 
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${paymentMode === mode ? 'bg-white text-emerald-950 shadow-sm border border-emerald-900/5' : 'text-emerald-900/40 hover:text-emerald-950'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Calculations Ledger */}
          <div className="bg-emerald-950/5 p-4 rounded-2xl border border-emerald-900/5 space-y-2.5 text-xs text-emerald-955 font-bold">
            <div className="flex justify-between text-emerald-900/60 font-bold">
              <span>Subtotal:</span>
              <span>₹{subtotal}/-</span>
            </div>
            <div className="flex justify-between text-emerald-900/60 font-bold">
              <span>Tax GST (18%):</span>
              <span>₹{gstAmount}/-</span>
            </div>

            {/* Discount Input */}
            <div className="flex justify-between items-center text-emerald-900/60 font-bold pt-1.5 border-t border-emerald-900/5">
              <span>Apply Discount:</span>
              <div className="flex items-center gap-1 bg-white border border-emerald-900/10 rounded-lg px-2 py-1 w-24">
                <span className="text-[10px] text-emerald-900/45">₹</span>
                <input 
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent border-none outline-none text-right font-black text-xs text-emerald-955"
                />
              </div>
            </div>

            <div className="flex justify-between text-emerald-955 font-black text-sm pt-2 border-t border-emerald-900/10">
              <span>Grand Total:</span>
              <span>₹{total}/-</span>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-900 hover:bg-emerald-800 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-emerald-900/20"
          >
            Place Bill & Print Receipt
          </button>
        </form>
      </div>

      {receiptOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-emerald-950/40 backdrop-blur-sm print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          
          {/* Main Card */}
          <div className="bg-white w-full max-w-md h-[680px] rounded-[2.5rem] shadow-2xl p-6 relative z-10 flex flex-col justify-between overflow-hidden border border-emerald-900/5 print:rounded-none print:shadow-none print:border-none print:w-full print:p-0 print:h-auto">
            
            {/* Modal Controls */}
            <div className="flex flex-col gap-4 mb-6 print:hidden shrink-0">
              <div className="flex items-center justify-between border-b border-emerald-900/5 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/50">Format</span>
                <div className="flex items-center gap-2">
                  <div className="flex bg-emerald-955/5 p-0.5 rounded-xl border border-emerald-900/10 gap-0.5">
                    <button 
                      onClick={() => setBillFormat('standard')}
                      className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${billFormat === 'standard' ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-900/60 hover:text-emerald-950'}`}
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
                  
                  {/* Close icon that closes print preview and resets cart for a new bill */}
                  <button 
                    onClick={handleStartNewBill}
                    className="w-8 h-8 rounded-full bg-emerald-950/5 hover:bg-red-50 hover:text-red-600 text-emerald-950 flex items-center justify-center transition-all"
                    title="Close Receipt & Start New checkout"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={handlePrintReceipt}
                className="w-full bg-emerald-900 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-emerald-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
              >
                <span className="material-symbols-outlined text-base">print</span> Print Receipt
              </button>
            </div>

            {/* Scrollable Content (Height consistent on screen, auto on print) */}
            <div className="print-receipt-container flex-1 overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-emerald-900/10 print:overflow-visible print:h-auto print:pr-0 print:pb-0">
              
              {/* Standard Format */}
              {billFormat === 'standard' && (
                <div className="font-poppins text-emerald-955 space-y-6 text-sm">
                  <div className="text-center border-b border-emerald-900/10 pb-4">
                    <h2 className="font-limelight text-3xl tracking-tighter uppercase text-emerald-955 leading-none">Ninjaro✧</h2>
                    <p className="text-[10px] text-emerald-900/50 uppercase tracking-widest font-black mt-1">Premium Mocktail Brand</p>
                    <p className="text-[9px] text-emerald-900/40 uppercase tracking-widest mt-1">Cash Receipt</p>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-[10px] uppercase tracking-wider text-emerald-900/70 border-b border-emerald-900/5 pb-4">
                    <div>Bill: <span className="font-black text-emerald-955">{receiptOrder!.id}</span></div>
                    <div className="text-right">Date: <span className="font-black text-emerald-955">{receiptOrder!.date}</span></div>
                    <div>Cashier: <span className="font-black text-emerald-955">Counter Desk</span></div>
                    <div className="text-right">Mode: <span className="font-black text-emerald-955">{receiptOrder!.posPaymentMode}</span></div>
                    {receiptOrder!.customerName && (
                      <div className="col-span-2">Customer: <span className="font-black text-emerald-955">{receiptOrder!.customerName}</span></div>
                    )}
                    {receiptOrder!.posCustomerPhone && (
                      <div className="col-span-2">Phone: <span className="font-black text-emerald-955">{receiptOrder!.posCustomerPhone}</span></div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-emerald-955/5 text-emerald-900/50 font-black uppercase tracking-widest text-[9px] border-b border-emerald-900/10">
                          <th className="py-2 px-1">Description</th>
                          <th className="py-2 text-center w-12">Qty</th>
                          <th className="py-2 text-right w-20">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-900/5">
                        {(receiptOrder!.items || []).map((item, idx) => (
                          <tr key={idx} className="font-bold text-emerald-955">
                            <td className="py-2.5 px-1">{item.name}</td>
                            <td className="py-2.5 text-center text-emerald-900/60">×{item.quantity}</td>
                            <td className="py-2.5 text-right font-black">₹{item.price}/-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-emerald-900/10 pt-4 space-y-1.5 text-xs text-right">
                    <div className="flex justify-between text-emerald-900/60 font-bold">
                      <span>Subtotal:</span>
                      <span>₹{(receiptOrder!.items || []).reduce((acc, item) => acc + item.price, 0)}/-</span>
                    </div>
                    <div className="flex justify-between text-emerald-900/60 font-bold">
                      <span>CGST (9%):</span>
                      <span>₹{Math.round((receiptOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.09)}/-</span>
                    </div>
                    <div className="flex justify-between text-emerald-900/60 font-bold">
                      <span>SGST (9%):</span>
                      <span>₹{Math.round((receiptOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.09)}/-</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-red-655 font-bold">
                        <span>Discount:</span>
                        <span>-₹{discountAmount}/-</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-emerald-955 text-sm border-t border-emerald-900/10 pt-2">
                      <span>Grand Total:</span>
                      <span>₹{receiptOrder!.total}/-</span>
                    </div>
                  </div>

                  <div className="text-center text-[9px] text-emerald-900/40 uppercase tracking-widest pt-4 border-t border-dashed border-emerald-900/10">
                    Thank you for visiting · Please come again
                  </div>
                </div>
              )}

              {/* Thermal Monospace format */}
              {billFormat === 'thermal' && (
                <div className="font-mono text-black text-[10px] leading-tight space-y-3 uppercase tracking-tight w-full max-w-[280px] mx-auto">
                  <div className="text-center space-y-1">
                    <h2 className="font-bold text-sm tracking-tight">NINJARO STORE</h2>
                    <p className="text-[9px]">Mocktail Premix Powder Desk</p>
                    <p className="text-[9px]">BKC High Street, Mumbai</p>
                    <p className="text-[9px]">Tel: +91 99999-88888</p>
                    <p className="text-[9px] pt-1">------- CASH MEMO -------</p>
                  </div>

                  <div className="space-y-1 border-t border-dashed border-gray-500 pt-2">
                    <div>Date: {receiptOrder!.date}</div>
                    <div>Bill No: {receiptOrder!.id}</div>
                    <div>Cashier: Admin Desk</div>
                    <div>Payment: {receiptOrder!.posPaymentMode}</div>
                    {receiptOrder!.customerName && (
                      <div>Customer: {receiptOrder!.customerName}</div>
                    )}
                    {receiptOrder!.posCustomerPhone && (
                      <div>Phone: {receiptOrder!.posCustomerPhone}</div>
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
                        {(receiptOrder!.items || []).map((item, idx) => {
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
                      <span>₹{(receiptOrder!.items || []).reduce((acc, item) => acc + item.price, 0)}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CGST @9%:</span>
                      <span>₹{Math.round((receiptOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.09)}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST @9%:</span>
                      <span>₹{Math.round((receiptOrder!.items || []).reduce((acc, item) => acc + item.price, 0) * 0.09)}.00</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between font-bold text-red-600">
                        <span>Discount:</span>
                        <span>-₹{discountAmount}.00</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs border-t border-dashed border-gray-500 pt-1.5">
                      <span>TOTAL:</span>
                      <span>₹{receiptOrder!.total}.00</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-500 pt-3 text-center space-y-1">
                    <p className="font-bold text-[9px] tracking-widest">THANK YOU - VISIT AGAIN</p>
                    <p className="text-[8px] font-bold">E.&O.E.</p>
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
