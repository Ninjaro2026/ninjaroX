"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStoredCart, saveStoredCart, getStoredProducts, saveStoredProducts, getStoredOrders, saveStoredOrders, CartItem, Order, decrementProductStock } from '../../lib/store';

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [selectedAddress, setSelectedAddress] = useState('1');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Form fields for new address
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const MOCK_ITEMS = [
    { name: 'Blue Lagoon', quantity: 2, price: 666, img: '/blulagoonbox.png' },
    { name: 'Orange Tang', quantity: 1, price: 666, img: '/orangetangbox.png' }
  ];

  const SAVED_ADDRESSES = [
    { id: '1', label: 'Home', street: '123 Botanical Avenue', city: 'Mumbai', zip: '400001' },
    { id: '2', label: 'Office', street: '456 Mixology Tower, BKC', city: 'Mumbai', zip: '400051' }
  ];

  useEffect(() => {
    setIsMounted(true);
    setCartItems(getStoredCart());
  }, []);

  const subtotal = (isMounted ? cartItems : MOCK_ITEMS).reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = shippingMethod === 'express' ? 150 : 0;
  const total = subtotal + shipping;

  const handlePlaceOrder = () => {
    let customerName = 'Guest Customer';
    let street = '';
    let cityVal = '';
    let zip = '';

    if (isAddingAddress) {
      if (!firstName || !streetAddress || !city || !zipCode) {
        alert('Please fill in all required shipping fields.');
        return;
      }
      customerName = `${firstName} ${lastName}`.trim();
      street = streetAddress;
      cityVal = city;
      zip = zipCode;
    } else {
      const selected = SAVED_ADDRESSES.find(a => a.id === selectedAddress);
      if (selected) {
        street = selected.street;
        cityVal = selected.city;
        zip = selected.zip;
        if (selected.id === '1') customerName = 'James T.';
        else if (selected.id === '2') customerName = 'Elena R.';
      }
    }

    const itemsToOrder = isMounted ? cartItems : MOCK_ITEMS;
    if (itemsToOrder.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    // 1. Decrement stock (supporting combos and individual products)
    let updatedProducts = getStoredProducts();
    itemsToOrder.forEach(item => {
      const match = updatedProducts.find(p => p.name === item.name);
      if (match) {
        updatedProducts = decrementProductStock(match.id, item.quantity, updatedProducts);
      }
    });
    saveStoredProducts(updatedProducts);

    // 2. Save order
    const newOrderId = `NZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: newOrderId,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Processing',
      total: total,
      trackingStep: 1,
      eta: shippingMethod === 'express' ? 'Tomorrow, 4:30 PM' : 'In 3-5 Business Days',
      customerName: customerName,
      shippingAddress: street,
      shippingCity: cityVal,
      shippingZip: zip,
      shippingMethod: shippingMethod,
      items: itemsToOrder.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price * item.quantity,
        img: item.img
      }))
    };

    const currentOrders = getStoredOrders();
    saveStoredOrders([newOrder, ...currentOrders]);

    // Save active tracking order so TrackOrderPage highlights it
    localStorage.setItem('nz_active_tracking_order_id', newOrderId);

    // 3. Clear cart
    saveStoredCart([]);
    setCartItems([]);

    setStep(3);
  };

  return (
    <div className="min-h-screen bg-emerald-50 font-poppins text-emerald-950 selection:bg-emerald-200">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-300/20 rounded-full blur-[150px]"></div>
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

        {/* Center: Stepper */}
        <div className="hidden md:flex justify-center items-center">
          <div className="flex items-center">
            <div className="flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 border-2 ${step >= 1 ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl' : 'bg-white border-emerald-900/10 text-emerald-900/30'}`}>
                {step > 1 ? <span className="material-symbols-outlined text-lg">check</span> : '01'}
              </div>
              <span className={`absolute -bottom-6 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${step >= 1 ? 'text-emerald-900' : 'text-emerald-900/30'}`}>Shipping</span>
            </div>
            <div className={`w-12 md:w-16 h-0.5 mx-1 transition-all duration-700 ${step > 1 ? 'bg-emerald-900' : 'bg-emerald-900/10'}`}></div>
            <div className="flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 border-2 ${step >= 2 ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl' : 'bg-white border-emerald-900/10 text-emerald-900/30'}`}>
                {step > 2 ? <span className="material-symbols-outlined text-lg">check</span> : '02'}
              </div>
              <span className={`absolute -bottom-6 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${step >= 2 ? 'text-emerald-900' : 'text-emerald-900/30'}`}>Payment</span>
            </div>
            <div className={`w-12 md:w-16 h-0.5 mx-1 transition-all duration-700 ${step > 2 ? 'bg-emerald-900' : 'bg-emerald-900/10'}`}></div>
            <div className="flex flex-col items-center relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 border-2 ${step >= 3 ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl' : 'bg-white border-emerald-900/10 text-emerald-900/30'}`}>
                03
              </div>
              <span className={`absolute -bottom-6 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${step >= 3 ? 'text-emerald-900' : 'text-emerald-900/30'}`}>Confirm</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <span className="font-black italic text-2xl md:text-4xl tracking-tighter text-emerald-950 uppercase leading-none">Checkout</span>
        </div>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-6 py-12">
        {step < 3 ? (
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            {/* Left Column: Order Summary */}
            <div className="lg:w-2/5 order-1">
              <div className="glass-panel bg-white/40 backdrop-blur-3xl p-8 md:p-10 rounded-4xl border border-white/60 shadow-2xl sticky top-12 space-y-8">
                <h3 className="text-2xl font-black italic uppercase tracking-tight">Order Summary</h3>
                <div className="space-y-6">
                  {(isMounted ? cartItems : MOCK_ITEMS).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white/50 flex items-center justify-center p-2 border border-white/60">
                          <img src={item.img} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-wide">{item.name}</p>
                          <p className="text-xs text-emerald-900/50 font-black tracking-widest uppercase">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-black">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-emerald-900/5 pt-8 space-y-4">
                  <div className="flex justify-between items-center text-sm font-medium text-emerald-900/60">
                    <span>Subtotal</span>
                    <span className="font-bold text-emerald-950">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium text-emerald-900/60">
                    <span>Shipping</span>
                    <span className="font-bold text-emerald-950">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl pt-4 border-t border-emerald-900/5">
                    <span className="font-black italic uppercase tracking-tight">Total</span>
                    <span className="font-black text-emerald-900">₹{total}</span>
                  </div>
                </div>

                <div className="bg-emerald-900/5 p-4 rounded-xl border border-emerald-900/5 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-emerald-600 text-sm">info</span>
                  <p className="text-[10px] font-bold text-emerald-900/60 leading-tight uppercase tracking-widest">
                    Prices include all applicable taxes. Your order is protected by our botanical freshness guarantee.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Forms */}
            <div className="lg:w-3/5 order-2 space-y-12">
              {step === 1 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black italic uppercase tracking-tight">Shipping Address</h3>
                    
                    {/* Saved Addresses Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {SAVED_ADDRESSES.map((address) => (
                        <button 
                          key={address.id}
                          onClick={() => {setSelectedAddress(address.id); setIsAddingAddress(false);}}
                          className={`p-6 rounded-2xl border transition-all text-left relative group ${selectedAddress === address.id && !isAddingAddress ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl' : 'bg-white/40 border-emerald-900/10 hover:border-emerald-900/30'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-black uppercase tracking-widest text-[10px]">{address.label}</span>
                            {selectedAddress === address.id && !isAddingAddress && (
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                            )}
                          </div>
                          <p className="font-bold text-sm leading-relaxed">{address.street}</p>
                          <p className="text-xs opacity-60 mt-1">{address.city} - {address.zip}</p>
                        </button>
                      ))}
                      
                      {/* Add New Button */}
                      <button 
                        onClick={() => setIsAddingAddress(true)}
                        className={`p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 group ${isAddingAddress ? 'bg-emerald-900/5 border-emerald-900 text-emerald-900' : 'bg-white/10 border-emerald-900/10 hover:border-emerald-900/30 text-emerald-900/40'}`}
                      >
                        <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">add_circle</span>
                        <span className="font-black uppercase tracking-widest text-[10px]">Add New Address</span>
                      </button>
                    </div>

                    {/* New Address Form (Conditional) */}
                    {isAddingAddress && (
                      <div className="space-y-4 pt-6 border-t border-emerald-900/5 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="bg-white/50 border border-emerald-900/10 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-bold" />
                          <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="bg-white/50 border border-emerald-900/10 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-bold" />
                          <input value={streetAddress} onChange={e => setStreetAddress(e.target.value)} placeholder="Street Address" className="md:col-span-2 bg-white/50 border border-emerald-900/10 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-bold" />
                          <input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="bg-white/50 border border-emerald-900/10 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-bold" />
                          <input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="Zip Code" className="bg-white/50 border border-emerald-900/10 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-bold" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-2xl font-black italic uppercase tracking-tight">Delivery Method</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button onClick={() => setShippingMethod('standard')} className={`p-6 rounded-2xl border transition-all text-left space-y-2 ${shippingMethod === 'standard' ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl' : 'bg-white/40 border-emerald-900/10 hover:border-emerald-900/30'}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-black uppercase tracking-widest text-xs">Standard</span>
                          <span className="font-bold">Free</span>
                        </div>
                        <p className="text-sm opacity-70 font-medium">3-5 Business Days</p>
                      </button>
                      <button onClick={() => setShippingMethod('express')} className={`p-6 rounded-2xl border transition-all text-left space-y-2 ${shippingMethod === 'express' ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl' : 'bg-white/40 border-emerald-900/10 hover:border-emerald-900/30'}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-black uppercase tracking-widest text-xs">Express</span>
                          <span className="font-bold">₹150</span>
                        </div>
                        <p className="text-sm opacity-70 font-medium">Next Day Delivery</p>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={() => setStep(2)} className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-900 text-white px-12 py-4 rounded-full font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/20 active:scale-95">
                      Payment
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black italic uppercase tracking-tight">Payment Method</h3>
                    <div className="space-y-4">
                      <div className="bg-white/40 border border-emerald-900/10 p-6 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-emerald-500 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                          </div>
                          <span className="font-bold">Credit / Debit Card</span>
                        </div>
                        <div className="flex gap-2 opacity-40">
                          <span className="material-symbols-outlined">credit_card</span>
                        </div>
                      </div>
                      <div className="bg-white/40 border border-emerald-900/10 p-6 rounded-2xl flex items-center justify-between opacity-50">
                        <div className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-full border-2 border-emerald-900/10"></div>
                          <span className="font-bold">UPI / Net Banking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="px-8 py-4 rounded-full font-black uppercase tracking-widest border-2 border-emerald-900/10 hover:bg-white transition-all text-sm">Back</button>
                    <button onClick={handlePlaceOrder} className="grow bg-emerald-900 text-white px-12 py-4 rounded-full font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl active:scale-95 text-sm">Place Order • ₹{total}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 md:py-32 space-y-10 animate-in zoom-in-95 duration-1000 text-center">
            <div className="w-40 h-40 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner relative">
              <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <div className="absolute inset-0 rounded-full border-8 border-emerald-900/5 animate-ping"></div>
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter">ORDER PLACED!</h2>
              <p className="text-emerald-900/60 font-bold tracking-widest uppercase text-sm max-w-lg mx-auto">
                Success! Your mocktail experience is being prepared. <br /> Check your email for tracking details.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/" className="bg-emerald-900 text-white px-12 py-4 rounded-full font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl active:scale-95 text-center">
                Back to Home
              </Link>
              <Link href="/track-order" className="px-12 py-4 rounded-full font-black uppercase tracking-widest border-2 border-emerald-900/10 hover:bg-white transition-all text-center flex items-center justify-center">
                Track Order
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
