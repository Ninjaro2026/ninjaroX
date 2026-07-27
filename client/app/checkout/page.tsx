"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStoredCart, saveStoredCart, CartItem } from '../../lib/store';
import { getLoggedInUser, placeOrder, createPaymentOrder, addAddress, getProfile } from '../../lib/api';
import { AuthModal } from '../../components/AuthModal';
import { Navbar } from '../../components/Navbar';

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Form fields for new address
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [addressLabel, setAddressLabel] = useState('Home');
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);



  useEffect(() => {
    setIsMounted(true);
    setCartItems(getStoredCart());
    
    const loggedIn = getLoggedInUser();
    if (loggedIn) {
      setCurrentUser(loggedIn);
      const addresses = loggedIn.addresses || [];
      setSavedAddresses(addresses);
      
      if (addresses.length > 0) {
        const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
        setSelectedAddress(defaultAddr._id || defaultAddr.id || '');
        setIsAddingAddress(false);
      } else {
        setIsAddingAddress(true);
      }
    } else {
      setIsAddingAddress(true);
    }
  }, []);

  const subtotal = (isMounted ? cartItems : []).reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = shippingMethod === 'express' ? 150 : 0;
  const total = subtotal + shipping;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    let customerName = 'Guest Customer';
    let street = '';
    let cityVal = '';
    let zip = '';

    if (isAddingAddress) {
      if (!firstName || !streetAddress || !city || !stateName || !zipCode) {
        alert('Please fill in all required shipping fields.');
        return;
      }
      customerName = `${firstName} ${lastName}`.trim();
      street = streetAddress;
      cityVal = city;
      zip = zipCode;
    } else {
      const selected = savedAddresses.find(a => (a._id || a.id) === selectedAddress);
      if (selected) {
        street = selected.street;
        cityVal = selected.city;
        zip = selected.zip;
        customerName = currentUser.name;
      } else {
        alert('Please select a shipping address.');
        return;
      }
    }

    const itemsToOrder = isMounted ? cartItems : [];
    if (itemsToOrder.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setPlacingOrder(true);

    try {
      // 1. Load Razorpay Script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load Razorpay SDK. Please check your connection.');
        setPlacingOrder(false);
        return;
      }

      // 2. Create Razorpay Payment Intent Order
      const paymentOrder = await createPaymentOrder(total);

      // 3. Open Razorpay dialog
      const options = {
        key: paymentOrder.key,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Ninjaro Mocktails",
        description: "Botanical State-shifting Premixes",
        order_id: paymentOrder.id,
        handler: async function (response: any) {
          try {
            // 4. Place order with transaction verification credentials
            const orderPayload = {
              total: total,
              customerName: customerName,
              shippingAddress: street,
              shippingCity: cityVal,
              shippingZip: zip,
              shippingMethod: shippingMethod,
              items: itemsToOrder.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price * item.quantity,
                img: item.img
              })),
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            };

            const result = await placeOrder(orderPayload);
            
            // Auto-save address to user profile if requested
            if (currentUser && isAddingAddress && saveToProfile) {
              try {
                await addAddress({
                  label: addressLabel || 'Home',
                  street: street,
                  city: cityVal,
                  state: stateName || '',
                  zip: zip,
                  isDefault: savedAddresses.length === 0
                });
                
                // Fetch the updated profile to update local storage user
                const updatedUser = await getProfile();
                setCurrentUser(updatedUser);
                setSavedAddresses(updatedUser.addresses || []);
              } catch (addrErr) {
                console.error('Failed to auto-save address to user profile:', addrErr);
              }
            }

            // Save active tracking order ID
            localStorage.setItem('nz_active_tracking_order_id', result.id);

            // Clear local cart
            saveStoredCart([]);
            setCartItems([]);

            setStep(3);
          } catch (err: any) {
            alert(err.message || 'Payment succeeded but order logging failed.');
          } finally {
            setPlacingOrder(false);
          }
        },
        prefill: {
          name: customerName,
          email: currentUser?.email || '',
        },
        theme: {
          color: "#064e3b" // Matches emerald-900 brand theme
        },
        modal: {
          ondismiss: function () {
            setPlacingOrder(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Failed to initialize payment gateway.');
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 font-poppins text-emerald-950 selection:bg-emerald-200">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-300/20 rounded-full blur-[150px]"></div>
      </div>

      {/* Universal Consistent Header */}
      <Navbar totalCartItems={cartItems.reduce((a, b) => a + b.quantity, 0)} />

      {/* Stepper Subheader */}
      <div className="bg-slate-50 border-b border-emerald-900/10 py-3 px-4 sm:px-6 md:px-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-emerald-900">
            Checkout
          </h1>
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold text-emerald-900">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${step >= 1 ? 'bg-emerald-900 text-white' : 'bg-zinc-200 text-zinc-600'}`}>1. Shipping</span>
            <span className="text-zinc-300">/</span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${step >= 2 ? 'bg-emerald-900 text-white' : 'bg-zinc-200 text-zinc-600'}`}>2. Payment</span>
            <span className="text-zinc-300">/</span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${step >= 3 ? 'bg-emerald-900 text-white' : 'bg-zinc-200 text-zinc-600'}`}>3. Order Placed</span>
          </div>
        </div>
      </div>

      {/* Widescreen Main Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {isMounted && !currentUser ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl border border-zinc-200/80 shadow-xs text-center max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900">Sign in to Checkout</h2>
              <p className="text-zinc-500 text-xs font-medium max-w-sm mx-auto">
                Authentication is required to ensure secure order logging and delivery tracking.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-emerald-900 text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-emerald-900 transition-all shadow-xs active:scale-95"
              >
                Log In / Register
              </button>
              <Link 
                href="/" 
                className="px-8 py-3 rounded-2xl font-bold uppercase tracking-wider border border-zinc-200 hover:bg-zinc-50 transition-all text-xs text-zinc-700"
              >
                Return to Shop
              </Link>
            </div>
          </div>
        ) : step < 3 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Column (7 cols): Address & Payment Forms */}
            <div className="lg:col-span-7 space-y-8">
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  {/* Shipping Address Section */}
                  <section className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-6">
                    <div className="border-b border-zinc-100 pb-3">
                      <h2 className="text-lg font-black italic uppercase tracking-tight text-zinc-900">1. Delivery Address</h2>
                      <p className="text-zinc-400 text-xs font-medium">Select a saved shipping destination or enter a new address</p>
                    </div>
                    
                    {/* Saved Addresses Selector Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {savedAddresses.map((address) => {
                        const addressId = address._id || address.id || '';
                        const isSelected = selectedAddress === addressId && !isAddingAddress;
                        return (
                          <div 
                            key={addressId}
                            onClick={() => {setSelectedAddress(addressId); setIsAddingAddress(false);}}
                            className={`p-5 rounded-2xl border transition-all text-left relative cursor-pointer ${
                              isSelected ? 'bg-emerald-900 text-white border-emerald-900 shadow-md' : 'bg-zinc-50/70 border-zinc-200/80 hover:border-emerald-500/50 hover:bg-white text-zinc-900'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`font-black uppercase tracking-wider text-[10px] ${isSelected ? 'text-emerald-300' : 'text-zinc-500'}`}>
                                {address.label}
                              </span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-sm text-emerald-300">check_circle</span>
                              )}
                            </div>
                            <p className="font-bold text-xs leading-relaxed">{address.street}</p>
                            <p className={`text-[11px] mt-1 ${isSelected ? 'text-emerald-200/80' : 'text-zinc-500'}`}>
                              {address.city}, {address.state} - {address.zip}
                            </p>
                          </div>
                        );
                      })}
                      
                      {/* Add New Address Toggle Box */}
                      <div 
                        onClick={() => setIsAddingAddress(true)}
                        className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center min-h-[100px] ${
                          isAddingAddress ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900' : 'bg-zinc-50/50 border-zinc-300/80 hover:border-emerald-400 text-zinc-400 hover:text-zinc-700'
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl">add_circle</span>
                        <span className="font-black uppercase tracking-wider text-[10px]">Add New Address</span>
                      </div>
                    </div>

                    {/* New Address Input Form */}
                    {isAddingAddress && (
                      <div className="space-y-4 pt-4 border-t border-zinc-100 animate-in fade-in duration-300">
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">Enter Shipping Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input 
                            value={firstName} 
                            onChange={e => setFirstName(e.target.value)} 
                            placeholder="First Name *" 
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-600 focus:bg-white text-xs font-bold" 
                          />
                          <input 
                            value={lastName} 
                            onChange={e => setLastName(e.target.value)} 
                            placeholder="Last Name" 
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-600 focus:bg-white text-xs font-bold" 
                          />
                          <input 
                            value={streetAddress} 
                            onChange={e => setStreetAddress(e.target.value)} 
                            placeholder="Street Address, House / Flat No. *" 
                            className="sm:col-span-2 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-600 focus:bg-white text-xs font-bold" 
                          />
                          <input 
                            value={city} 
                            onChange={e => setCity(e.target.value)} 
                            placeholder="City *" 
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-600 focus:bg-white text-xs font-bold" 
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              value={stateName} 
                              onChange={e => setStateName(e.target.value)} 
                              placeholder="State *" 
                              className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-600 focus:bg-white text-xs font-bold" 
                            />
                            <input 
                              value={zipCode} 
                              onChange={e => setZipCode(e.target.value)} 
                              placeholder="Zip Code *" 
                              className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-600 focus:bg-white text-xs font-bold" 
                            />
                          </div>
                          
                          {currentUser && (
                            <div className="sm:col-span-2 space-y-3 pt-3 border-t border-zinc-100">
                              <div className="flex items-center gap-2.5">
                                <input 
                                  type="checkbox" 
                                  id="saveToProfile" 
                                  checked={saveToProfile} 
                                  onChange={e => setSaveToProfile(e.target.checked)} 
                                  className="w-4 h-4 rounded border-zinc-300 text-emerald-900 focus:ring-emerald-500 cursor-pointer accent-emerald-900"
                                />
                                <label htmlFor="saveToProfile" className="text-xs font-bold text-zinc-600 cursor-pointer select-none">
                                  Save this address to profile for future orders
                                </label>
                              </div>
                              
                              {saveToProfile && (
                                <input 
                                  value={addressLabel} 
                                  onChange={e => setAddressLabel(e.target.value)} 
                                  placeholder="Address Label (e.g. Home, Work)" 
                                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-600 text-xs font-bold"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Delivery Speed Method */}
                  <section className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
                    <div className="border-b border-zinc-100 pb-3">
                      <h2 className="text-lg font-black italic uppercase tracking-tight text-zinc-900">2. Delivery Method</h2>
                      <p className="text-zinc-400 text-xs font-medium">Choose delivery speed and courier priority</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div 
                        onClick={() => setShippingMethod('standard')} 
                        className={`p-5 rounded-2xl border cursor-pointer transition-all text-left space-y-1 ${
                          shippingMethod === 'standard' ? 'bg-emerald-900 text-white border-emerald-900 shadow-md' : 'bg-zinc-50/70 border-zinc-200/80 hover:bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-black uppercase tracking-wider text-xs">Standard Courier</span>
                          <span className="font-black text-emerald-400 text-xs">FREE</span>
                        </div>
                        <p className="text-xs opacity-80 font-medium">3-5 Business Days Delivery</p>
                      </div>

                      <div 
                        onClick={() => setShippingMethod('express')} 
                        className={`p-5 rounded-2xl border cursor-pointer transition-all text-left space-y-1 ${
                          shippingMethod === 'express' ? 'bg-emerald-900 text-white border-emerald-900 shadow-md' : 'bg-zinc-50/70 border-zinc-200/80 hover:bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-black uppercase tracking-wider text-xs">Express Priority Air</span>
                          <span className="font-black text-xs">₹150</span>
                        </div>
                        <p className="text-xs opacity-80 font-medium">Next Business Day Guarantee</p>
                      </div>
                    </div>
                  </section>

                  <div className="flex justify-end">
                    <button 
                      onClick={() => setStep(2)} 
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-900 hover:bg-emerald-900 text-white px-10 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-md active:scale-95"
                    >
                      Continue to Payment
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <section className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs space-y-6">
                    <div className="border-b border-zinc-100 pb-3">
                      <h2 className="text-lg font-black italic uppercase tracking-tight text-zinc-900">Payment Gateway</h2>
                      <p className="text-zinc-400 text-xs font-medium">Cryptographically encrypted Razorpay Checkout</p>
                    </div>

                    <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-base">lock</span>
                        </div>
                        <div>
                          <p className="font-black text-xs text-zinc-900">Razorpay Official Gateway</p>
                          <p className="text-[11px] text-zinc-500">UPI, Credit/Debit Cards, NetBanking, Wallets</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-emerald-700 text-xl">verified_user</span>
                    </div>
                  </section>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep(1)} 
                      className="px-6 py-3.5 rounded-2xl font-bold uppercase tracking-wider border border-zinc-200 bg-white hover:bg-zinc-50 text-xs text-zinc-700 transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handlePlaceOrder} 
                      disabled={placingOrder} 
                      className="grow bg-emerald-900 hover:bg-emerald-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-wider text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {placingOrder ? 'Initializing Gateway...' : `Pay & Place Order • ₹${total}`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (5 cols): Sticky Executive Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs sticky top-24 space-y-6">
                <h3 className="text-base font-black italic uppercase tracking-tight text-zinc-900 border-b border-zinc-100 pb-3 flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs font-normal text-zinc-400">({cartItems.reduce((a,b)=>a+b.quantity,0)} items)</span>
                </h3>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {(isMounted ? cartItems : []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-zinc-50/70 p-3 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1.5 border border-zinc-200/80 shrink-0">
                          <img src={item.img} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-zinc-900 leading-tight">{item.name}</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-black text-xs text-emerald-900">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-100 pt-4 space-y-2 text-xs font-semibold">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span className="text-zinc-900 font-bold">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Shipping Speed ({shippingMethod === 'express' ? 'Express' : 'Standard'})</span>
                    <span className={shipping === 0 ? 'text-emerald-700 font-bold' : 'text-zinc-900 font-bold'}>
                      {shipping === 0 ? 'Free' : `₹${shipping}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-zinc-100 text-sm font-black text-zinc-900">
                    <span>Grand Total</span>
                    <span className="text-lg font-black text-emerald-900">₹{total}</span>
                  </div>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/60 flex items-center gap-2.5 text-zinc-500">
                  <span className="material-symbols-outlined text-emerald-700 text-base">verified</span>
                  <p className="text-[10px] font-bold leading-tight uppercase tracking-wider">
                    Official Botanical Freshness Guarantee & SSL Encrypted Checkout.
                  </p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white p-12 sm:p-20 rounded-3xl border border-zinc-200/80 shadow-xs text-center max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tight text-zinc-900">ORDER PLACED!</h2>
              <p className="text-zinc-500 text-xs sm:text-sm font-medium max-w-md mx-auto">
                Success! Your mocktail experience is being prepared. Check your account dashboard or track your shipment in real time.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link 
                href="/" 
                className="bg-emerald-900 text-white px-8 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-emerald-900 transition-all shadow-xs"
              >
                Back to Store
              </Link>
              <Link 
                href="/profile" 
                className="px-8 py-3.5 rounded-2xl font-bold uppercase tracking-wider border border-zinc-200 hover:bg-zinc-50 transition-all text-xs text-zinc-700"
              >
                Go to Profile
              </Link>
            </div>
          </div>
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={(user) => {
          setCurrentUser(user);
          const addresses = user.addresses || [];
          setSavedAddresses(addresses);
          if (addresses.length > 0) {
            const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
            setSelectedAddress(defaultAddr._id || defaultAddr.id || '');
            setIsAddingAddress(false);
          } else {
            setIsAddingAddress(true);
          }
        }} 
      />
    </div>
  );
}
