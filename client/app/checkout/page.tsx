"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStoredCart, saveStoredCart, CartItem } from '../../lib/store';
import { getLoggedInUser, placeOrder, createPaymentOrder, addAddress, getProfile } from '../../lib/api';
import { AuthModal } from '../../components/AuthModal';

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
        {isMounted && !currentUser ? (
          <div className="flex flex-col items-center justify-center py-20 md:py-32 space-y-8 animate-in zoom-in-95 duration-700 text-center max-w-md mx-auto">
            <div className="w-28 h-28 rounded-full bg-emerald-900/5 flex items-center justify-center text-emerald-900 border border-emerald-900/10 shadow-inner">
              <span className="material-symbols-outlined text-5xl">lock</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black italic uppercase tracking-tight">LOGIN REQUIRED</h2>
              <p className="text-emerald-900/60 font-bold tracking-wider uppercase text-[11px] leading-relaxed">
                Please log in or create an account to verify your delivery details and secure your mocktail order.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full bg-emerald-900 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 text-xs"
              >
                Log In or Sign Up
              </button>
              <Link 
                href="/" 
                className="w-full px-8 py-4 rounded-full font-black uppercase tracking-widest border-2 border-emerald-900/10 hover:bg-white transition-all text-center flex items-center justify-center text-xs"
              >
                Return to Shop
              </Link>
            </div>
          </div>
        ) : step < 3 ? (
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            {/* Left Column: Order Summary */}
            <div className="lg:w-2/5 order-1">
              <div className="glass-panel bg-white/40 backdrop-blur-3xl p-8 md:p-10 rounded-4xl border border-white/60 shadow-2xl sticky top-12 space-y-8">
                <h3 className="text-2xl font-black italic uppercase tracking-tight">Order Summary</h3>
                <div className="space-y-6">
                  {(isMounted ? cartItems : []).map((item, idx) => (
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
                      {savedAddresses.map((address) => {
                        const addressId = address._id || address.id || '';
                        return (
                          <button 
                            key={addressId}
                            onClick={() => {setSelectedAddress(addressId); setIsAddingAddress(false);}}
                            className={`p-6 rounded-2xl border transition-all text-left relative group ${selectedAddress === addressId && !isAddingAddress ? 'bg-emerald-900 text-white border-emerald-900 shadow-xl' : 'bg-white/40 border-emerald-900/10 hover:border-emerald-900/30'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-black uppercase tracking-widest text-[10px]">{address.label}</span>
                              {selectedAddress === addressId && !isAddingAddress && (
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                              )}
                            </div>
                            <p className="font-bold text-sm leading-relaxed">{address.street}</p>
                            <p className="text-xs opacity-60 mt-1">{address.city} - {address.zip}</p>
                          </button>
                        );
                      })}
                      
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
                          <div className="grid grid-cols-2 gap-4">
                            <input value={stateName} onChange={e => setStateName(e.target.value)} placeholder="State" className="bg-white/50 border border-emerald-900/10 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-bold" />
                            <input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="Zip Code" className="bg-white/50 border border-emerald-900/10 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-bold" />
                          </div>
                          
                          {currentUser && (
                            <div className="md:col-span-2 space-y-4 pt-4 border-t border-emerald-900/5">
                              <div className="flex items-center gap-3">
                                <input 
                                  type="checkbox" 
                                  id="saveToProfile" 
                                  checked={saveToProfile} 
                                  onChange={e => setSaveToProfile(e.target.checked)} 
                                  className="w-5 h-5 rounded-lg border-emerald-900/10 text-emerald-900 focus:ring-emerald-500 cursor-pointer accent-emerald-900"
                                />
                                <label htmlFor="saveToProfile" className="text-xs font-black uppercase tracking-widest text-emerald-900/60 select-none cursor-pointer">
                                  Save this address to my profile
                                </label>
                              </div>
                              
                              {saveToProfile && (
                                <div className="animate-in fade-in duration-300">
                                  <input 
                                    value={addressLabel} 
                                    onChange={e => setAddressLabel(e.target.value)} 
                                    placeholder="Address Label (e.g. Home, Office, Work)" 
                                    className="w-full bg-white/50 border border-emerald-900/10 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-bold"
                                  />
                                </div>
                              )}
                            </div>
                          )}
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
                          <span className="font-bold">Razorpay Secure Checkout (Card/UPI/NetBanking)</span>
                        </div>
                        <div className="flex gap-2 opacity-40">
                          <span className="material-symbols-outlined">credit_card</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="px-8 py-4 rounded-full font-black uppercase tracking-widest border-2 border-emerald-900/10 hover:bg-white transition-all text-sm">Back</button>
                    <button onClick={handlePlaceOrder} disabled={placingOrder} className="grow bg-emerald-900 text-white px-12 py-4 rounded-full font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl active:scale-95 text-sm disabled:opacity-50">
                      {placingOrder ? 'Processing Payment...' : `Pay & Place Order • ₹${total}`}
                    </button>
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
                Success! Your mocktail experience is being prepared. <br /> Check your profile order history for tracking details.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/" className="bg-emerald-900 text-white px-12 py-4 rounded-full font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-xl active:scale-95 text-center">
                Back to Home
              </Link>
              <Link href="/profile" className="px-12 py-4 rounded-full font-black uppercase tracking-widest border-2 border-emerald-900/10 hover:bg-white transition-all text-center flex items-center justify-center">
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
