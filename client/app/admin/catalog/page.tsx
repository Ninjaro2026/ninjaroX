"use client";
import React, { useState, useEffect } from 'react';
import { getStoredProducts, saveStoredProducts, getStoredOrders, Product, Order, getProductStock } from '../../../lib/store';

const COLOR_PRESETS = [
  { name: 'Blue Tropical', top: 'bg-[#00485c]', bottom: 'bg-[#006884]', buttonText: 'text-[#006884]' },
  { name: 'Green Forest', top: 'bg-[#004930]', bottom: 'bg-[#00704a]', buttonText: 'text-[#00704a]' },
  { name: 'Orange Tang', top: 'bg-[#ff9500]', bottom: 'bg-[#e87903]', buttonText: 'text-[#ff9500]' },
  { name: 'Teal Mint', top: 'bg-[#1b8858]', bottom: 'bg-[#25b07a]', buttonText: 'text-[#2fd696]' }
];

const IMAGE_PRESETS = [
  { name: 'Blue Lagoon Box', path: '/blulagoonbox.png' },
  { name: 'Green Mango Box', path: '/greentangbox.png' },
  { name: 'Orange Tang Box', path: '/orangetangbox.png' },
  { name: 'Virgin Mojito Box', path: '/virginmojitobox.png' }
];

export default function CatalogPage() {
  // Storage states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for product/combo
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState(666);
  const [prodStock, setProdStock] = useState(50);
  const [prodImage, setProdImage] = useState('/blulagoonbox.png');
  const [prodColorIndex, setProdColorIndex] = useState(0);
  const [isCombo, setIsCombo] = useState(false);
  
  // Custom storefront location parameters
  const [prodMrp, setProdMrp] = useState(0);
  const [prodCategory, setProdCategory] = useState('20gm Pouch (5pc Jar)');
  const [prodShowInStorefront, setProdShowInStorefront] = useState(true);
  const [prodPriority, setProdPriority] = useState(0);
  
  // Component items for combo: maps productId to quantity
  const [comboComponents, setComboComponents] = useState<{ [productId: string]: number }>({});

  // Catalog search/sorting/filtering
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogSort, setCatalogSort] = useState<'name' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('name');
  const [catalogStockFilter, setCatalogStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    setProducts(getStoredProducts());
    setOrders(getStoredOrders());
  }, []);

  // Dynamic performance indicators per product
  const getProductAnalytics = (productName: string) => {
    let unitsSold = 0;
    let revenue = 0;
    
    orders.forEach(order => {
      if (order.status !== 'Cancelled') {
        order.items.forEach(item => {
          if (item.name === productName) {
            unitsSold += item.quantity;
            revenue += item.price;
          }
        });
      }
    });

    return { unitsSold, revenue };
  };

  // CRUD actions
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdPrice(125);
    setProdStock(50);
    setProdImage('/blulagoonbox.png');
    setProdColorIndex(0);
    setIsCombo(false);
    setProdMrp(150);
    setProdCategory('20gm Pouch (5pc Jar)');
    setProdShowInStorefront(true);
    setProdPriority(0);
    
    // Initialize components empty
    const initialComps: { [id: string]: number } = {};
    products.filter(p => !p.isCombo).forEach(p => {
      initialComps[p.id] = 0;
    });
    setComboComponents(initialComps);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdDesc(product.description);
    setProdPrice(product.price);
    setProdStock(product.stock);
    setProdImage(product.imageSrc);
    setIsCombo(!!product.isCombo);
    setProdMrp(product.mrp || product.price);
    setProdCategory(product.category || '20gm Pouch (5pc Jar)');
    setProdShowInStorefront(product.showInStorefront !== false);
    setProdPriority(product.priority || 0);
    
    const colorIdx = COLOR_PRESETS.findIndex(c => c.top === product.topBgColor);
    setProdColorIndex(colorIdx >= 0 ? colorIdx : 0);

    // Initialize combo items if applicable
    const comps: { [id: string]: number } = {};
    products.filter(p => !p.isCombo).forEach(p => {
      const match = product.comboItems?.find(item => item.productId === p.id);
      comps[p.id] = match ? match.quantity : 0;
    });
    setComboComponents(comps);
    
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodDesc.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    const colorPreset = COLOR_PRESETS[prodColorIndex];

    // Format components for combo
    const selectedComponents = Object.keys(comboComponents)
      .filter(id => comboComponents[id] > 0)
      .map(id => ({
        productId: id,
        quantity: comboComponents[id]
      }));

    if (isCombo && selectedComponents.length === 0) {
      alert('A Combo Pack must contain at least one flavor product component.');
      return;
    }

    let updated: Product[];
    if (editingProduct) {
      updated = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: prodName,
            description: prodDesc,
            price: prodPrice,
            stock: isCombo ? 0 : prodStock,
            imageSrc: prodImage,
            topBgColor: colorPreset.top,
            bottomBgColor: colorPreset.bottom,
            buttonTextColor: colorPreset.buttonText,
            isCombo: isCombo,
            comboItems: isCombo ? selectedComponents : undefined,
            mrp: prodMrp,
            category: prodCategory,
            showInStorefront: prodShowInStorefront,
            priority: prodPriority
          };
        }
        return p;
      });
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: prodName,
        description: prodDesc,
        price: prodPrice,
        stock: isCombo ? 0 : prodStock,
        imageSrc: prodImage,
        imageAlt: prodName.toLowerCase() + ' drink',
        topBgColor: colorPreset.top,
        bottomBgColor: colorPreset.bottom,
        buttonTextColor: colorPreset.buttonText,
        isCombo: isCombo,
        comboItems: isCombo ? selectedComponents : undefined,
        mrp: prodMrp,
        category: prodCategory,
        showInStorefront: prodShowInStorefront,
        priority: prodPriority
      };
      updated = [...products, newProduct];
    }

    setProducts(updated);
    saveStoredProducts(updated);
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      saveStoredProducts(updated);
      setSelectedProductIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleQuickRestock = (id: string, amount: number) => {
    const updated = products.map(p => {
      if (p.id === id) {
        return { ...p, stock: p.stock + amount };
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
  };

  // Bulk Actions
  const handleBulkRestock = (amount: number) => {
    if (selectedProductIds.length === 0) {
      alert('No products selected.');
      return;
    }
    const updated = products.map(p => {
      if (selectedProductIds.includes(p.id) && !p.isCombo) {
        return { ...p, stock: p.stock + amount };
      }
      return p;
    });
    setProducts(updated);
    saveStoredProducts(updated);
    setSelectedProductIds([]);
    alert(`Restocked selected individual mocktails by +${amount} units.`);
  };

  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) return;
    if (confirm(`Are you sure you want to delete the ${selectedProductIds.length} selected products?`)) {
      const updated = products.filter(p => !selectedProductIds.includes(p.id));
      setProducts(updated);
      saveStoredProducts(updated);
      setSelectedProductIds([]);
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const updateComboComponentQty = (productId: string, qty: number) => {
    setComboComponents(prev => ({
      ...prev,
      [productId]: Math.max(0, qty)
    }));
  };

  // Filtering & Sorting Products
  const filteredAndSortedProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                            p.description.toLowerCase().includes(catalogSearch.toLowerCase());
      
      const computedStock = getProductStock(p, products);
      const matchesStock = catalogStockFilter === 'all' ? true :
                           catalogStockFilter === 'low' ? computedStock > 0 && computedStock < 10 :
                           computedStock === 0;
      return matchesSearch && matchesStock;
    })
    .sort((a, b) => {
      if (catalogSort === 'name') return a.name.localeCompare(b.name);
      if (catalogSort === 'price-asc') return a.price - b.price;
      if (catalogSort === 'price-desc') return b.price - a.price;
      
      const stockA = getProductStock(a, products);
      const stockB = getProductStock(b, products);
      if (catalogSort === 'stock-asc') return stockA - stockB;
      return stockB - stockA;
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Catalog Control Header */}
      <div className="glass-panel bg-white/40 p-5 border border-white/60 rounded-[2rem] shadow-sm flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          {/* Search */}
          <div className="relative w-full lg:w-80 shrink-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/40 text-lg">search</span>
            <input 
              type="text" 
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search flavors and combos..." 
              className="w-full bg-white/50 border border-emerald-900/10 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-bold outline-none focus:border-emerald-600 transition-all text-emerald-950 placeholder-emerald-900/30"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1 bg-white/40 border border-emerald-900/10 rounded-xl px-2">
              <span className="material-symbols-outlined text-sm text-emerald-900/40 ml-1">filter_list</span>
              <select 
                value={catalogStockFilter}
                onChange={(e) => setCatalogStockFilter(e.target.value as any)}
                className="bg-transparent text-[11px] font-black uppercase text-emerald-900 py-3.5 outline-none border-none cursor-pointer tracking-wider"
              >
                <option value="all">All stock status</option>
                <option value="low">Low Stock (&lt; 10)</option>
                <option value="out">Out of Stock (0)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-white/40 border border-emerald-900/10 rounded-xl px-2">
              <span className="material-symbols-outlined text-sm text-emerald-900/40 ml-1">sort</span>
              <select 
                value={catalogSort}
                onChange={(e) => setCatalogSort(e.target.value as any)}
                className="bg-transparent text-[11px] font-black uppercase text-emerald-900 py-3.5 outline-none border-none cursor-pointer tracking-wider"
              >
                <option value="name">Sort by Name</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="stock-asc">Stock: Low to High</option>
                <option value="stock-desc">Stock: High to Low</option>
              </select>
            </div>

            <button 
              onClick={handleOpenAddProduct}
              className="flex items-center justify-center gap-2 bg-emerald-900 text-white px-6 py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg text-xs"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span> Add Product / Combo
            </button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedProductIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-emerald-950/5 rounded-2xl border border-emerald-900/10 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-900/70">
              <span className="material-symbols-outlined text-sm text-emerald-900">checklist</span>
              <span>{selectedProductIds.length} Items Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBulkRestock(50)} 
                className="bg-white/80 hover:bg-white border border-emerald-900/15 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-emerald-950 shadow-sm transition-all"
              >
                Bulk Restock Ingredients (+50)
              </button>
              <button 
                onClick={handleBulkDelete} 
                className="bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-red-650 shadow-sm transition-all"
              >
                Bulk Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedProducts.map((product) => {
          const analytics = getProductAnalytics(product.name);
          const isSelected = selectedProductIds.includes(product.id);
          const computedStock = getProductStock(product, products);
          
          return (
            <div key={product.id} className={`glass-panel bg-white/40 border rounded-[2rem] overflow-hidden shadow-md flex flex-col justify-between group relative transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isSelected ? 'ring-2 ring-emerald-900 border-emerald-900' : 'border-white/60'}`}>
              
              {/* Selection checkbox */}
              <button 
                type="button"
                onClick={() => toggleSelectProduct(product.id)}
                className={`absolute top-4 right-4 w-6 h-6 rounded-full border flex items-center justify-center z-10 transition-all ${isSelected ? 'bg-emerald-900 text-white border-emerald-900 shadow-md' : 'bg-white/60 backdrop-blur border-emerald-900/20 text-transparent hover:border-emerald-900/40'}`}
              >
                <span className="material-symbols-outlined text-[14px]">check</span>
              </button>

              {/* Card visual header */}
              <div className={`${product.topBgColor} h-44 relative flex items-center justify-center p-6 border-b border-emerald-900/5`}>
                {product.isCombo && (
                  <span className="absolute top-4 left-4 bg-emerald-900 text-white font-extrabold tracking-wider text-[8px] uppercase px-2.5 py-1 rounded-full shadow-md z-10">
                    Combo Package
                  </span>
                )}
                {!product.isCombo && computedStock < 10 && (
                  <span className="absolute top-4 left-4 bg-red-600 text-white font-extrabold tracking-wider text-[9px] uppercase px-2.5 py-1 rounded-full shadow-md z-10 animate-pulse">
                    {computedStock === 0 ? 'Out of Stock' : `Only ${computedStock} Left!`}
                  </span>
                )}
                <img src={product.imageSrc} alt={product.name} className="h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-xl" />
              </div>

              {/* Card Info details */}
              <div className="p-6 space-y-4 grow flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-lg font-black italic uppercase tracking-wider text-emerald-950 leading-tight">{product.name}</h4>
                    <span className="text-base font-black text-emerald-700 shrink-0">₹{product.price}/-</span>
                  </div>
                  <p className="text-emerald-900/60 text-xs leading-relaxed line-clamp-2 font-medium">{product.description}</p>
                  
                  {/* List components for Combo */}
                  {product.isCombo && product.comboItems && (
                    <div className="pt-1">
                      <span className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest block">Constituent items</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.comboItems.map((item, idx) => {
                          const matchedComp = products.find(p => p.id === item.productId);
                          return (
                            <span key={idx} className="bg-emerald-950/5 text-emerald-950 text-[9px] font-bold px-2 py-0.5 rounded-md border border-emerald-900/5">
                              {item.quantity}x {matchedComp ? matchedComp.name : 'Unknown'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>                {/* Performance Statistics */}
                <div className="bg-emerald-950/5 p-3 rounded-2xl border border-emerald-900/5 grid grid-cols-2 text-center">
                  <div className="border-r border-emerald-900/10 pr-2">
                    <span className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest">Units Sold</span>
                    <p className="text-xs font-black text-emerald-950 mt-0.5">{analytics.unitsSold} units</p>
                  </div>
                  <div className="pl-2">
                    <span className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest">Sales Revenue</span>
                    <p className="text-xs font-black text-emerald-950 mt-0.5">₹{analytics.revenue}</p>
                  </div>
                </div>

                {/* Stock Status Badge */}
                <div className="pt-3 border-t border-emerald-900/5">
                  {product.isCombo ? (
                    computedStock === 0 ? (
                      <div className="bg-red-600 border border-red-700 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-sm">report</span> Out of Stock
                      </div>
                    ) : (
                      <div className="bg-sky-600 border border-sky-700 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-sm">layers</span> Derived Stock: {computedStock} Packs
                      </div>
                    )
                  ) : (
                    computedStock === 0 ? (
                      <div className="bg-red-600 border border-red-700 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-sm">report</span> Out of Stock
                      </div>
                    ) : computedStock < 10 ? (
                      <div className="bg-amber-500 border border-amber-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-1.5 animate-pulse shadow-sm">
                        <span className="material-symbols-outlined text-sm">warning</span> Low Stock: {computedStock} Units
                      </div>
                    ) : (
                      <div className="bg-emerald-600 border border-emerald-700 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-sm">check_circle</span> In Stock: {computedStock} Units
                      </div>
                    )
                  )}
                </div>

                {/* CRUD buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  <button 
                    onClick={() => handleOpenEditProduct(product)}
                    className="flex items-center justify-center gap-1.5 py-3 bg-emerald-900 text-white hover:bg-emerald-800 border border-emerald-950 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all shadow-md shadow-emerald-900/10 active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span> Configure
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex items-center justify-center gap-1.5 py-3 bg-red-600 text-white hover:bg-red-700 border border-red-700 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all shadow-md shadow-red-600/10 active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAndSortedProducts.length === 0 && (
          <div className="col-span-full py-16 text-center text-emerald-900/35 font-bold uppercase text-xs tracking-widest">
            No matching assets in inventory.
          </div>
        )}
      </div>

      {/* MODAL: ADD/EDIT PRODUCT & COMBO MAKER */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}></div>
          
          <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden border border-emerald-900/5">
            <header className="p-6 border-b border-emerald-900/5 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight text-emerald-950">
                {editingProduct ? 'Configure Catalog Asset' : 'Add Catalog Asset'}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="w-10 h-10 rounded-full bg-emerald-950/5 hover:bg-emerald-900 hover:text-white text-emerald-950 flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 overflow-y-auto grow custom-scrollbar">
              {/* Product type toggle */}
              <div className="flex bg-emerald-950/5 p-1 rounded-2xl border border-emerald-900/10">
                <button 
                  type="button"
                  onClick={() => setIsCombo(false)}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isCombo ? 'bg-white text-emerald-950 shadow-md border border-emerald-900/5' : 'text-emerald-900/50 hover:text-emerald-900'}`}
                >
                  Standard Flavor Product
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCombo(true)}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isCombo ? 'bg-white text-emerald-950 shadow-md border border-emerald-900/5' : 'text-emerald-900/50 hover:text-emerald-900'}`}
                >
                  Showcase Combo Pack
                </button>
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Asset Name</label>
                <input 
                  type="text" 
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder={isCombo ? "e.g. Summer Party Pack" : "e.g. Lavender Mint"} 
                  className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 transition-all text-emerald-950"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Asset Description</label>
                <textarea 
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Describe notes, components, or pack bundle details..." 
                  rows={3}
                  className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 transition-all text-emerald-950 resize-none"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Price (INR)</label>
                  <input 
                    type="number" 
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    min={0}
                    className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 transition-all text-emerald-950"
                  />
                </div>
                {!isCombo ? (
                  <div className="space-y-1.5 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Stock Units</label>
                    <input 
                      type="number" 
                      value={prodStock}
                      onChange={(e) => setProdStock(Number(e.target.value))}
                      min={0}
                      className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 transition-all text-emerald-950"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5 opacity-60">
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Stock Level</label>
                    <div className="bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold text-emerald-900/75 select-none">
                      Derived dynamically
                    </div>
                  </div>
                )}
              </div>

              {/* MRP & Display Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">MRP (INR) - Crossed Out</label>
                  <input 
                    type="number" 
                    value={prodMrp}
                    onChange={(e) => setProdMrp(Number(e.target.value))}
                    min={0}
                    placeholder="e.g. 150"
                    className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 transition-all text-emerald-950"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Display Priority (Sort order)</label>
                  <input 
                    type="number" 
                    value={prodPriority}
                    onChange={(e) => setProdPriority(Number(e.target.value))}
                    className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 transition-all text-emerald-950"
                    title="Lower number renders first, e.g. 1, 2, 3"
                  />
                </div>
              </div>

              {/* Frontstore Location & Visibility */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Frontstore Section/Category</label>
                  <select 
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 transition-all text-emerald-955"
                  >
                    <option value="20gm Pouch (5pc Jar)">20gm Pouch (5pc Jar)</option>
                    <option value="Jar 500gm">Jar 500gm</option>
                    <option value="Signature Combos">Signature Combos</option>
                  </select>
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 p-3.5 bg-emerald-950/5 border border-emerald-900/10 rounded-xl cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={prodShowInStorefront}
                      onChange={(e) => setProdShowInStorefront(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-800"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-950">Show in Storefront</span>
                  </label>
                </div>
              </div>

              {/* Combo components Selector */}
              {isCombo && (
                <div className="space-y-3 p-4 bg-emerald-950/5 rounded-2xl border border-emerald-900/10 animate-in slide-in-from-top-2 duration-300">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Combo Package Ingredients</span>
                  <div className="space-y-2">
                    {products.filter(p => !p.isCombo).map((p) => {
                      const qty = comboComponents[p.id] || 0;
                      return (
                        <div key={p.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-900/5">
                          <div className="flex items-center gap-2">
                            <img src={p.imageSrc} alt={p.name} className="w-8 h-8 object-contain" />
                            <span className="text-xs font-bold text-emerald-950">{p.name}</span>
                          </div>
                          
                          <div className="flex items-center bg-emerald-50 rounded-lg h-8 overflow-hidden border border-emerald-900/5">
                            <button 
                              type="button"
                              onClick={() => updateComboComponentQty(p.id, qty - 1)}
                              className="w-8 h-full flex items-center justify-center text-emerald-950 hover:bg-emerald-100 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">remove</span>
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-emerald-950">{qty}</span>
                            <button 
                              type="button"
                              onClick={() => updateComboComponentQty(p.id, qty + 1)}
                              className="w-8 h-full flex items-center justify-center text-emerald-950 hover:bg-emerald-100 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">add</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Image selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Asset Image Preview</label>
                <div className="grid grid-cols-4 gap-2">
                  {IMAGE_PRESETS.map((preset) => (
                    <button 
                      key={preset.path}
                      type="button"
                      onClick={() => setProdImage(preset.path)}
                      className={`p-2 bg-emerald-950/5 border rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-emerald-950/10 transition-all ${prodImage === preset.path ? 'border-emerald-600 bg-white shadow-sm ring-1 ring-emerald-600' : 'border-emerald-900/5'}`}
                    >
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img src={preset.path} alt={preset.name} className="h-full object-contain" />
                      </div>
                      <span className="text-[8px] font-bold text-emerald-900/60 uppercase text-center block leading-none">{preset.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Color Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button 
                      key={preset.name}
                      type="button"
                      onClick={() => setProdColorIndex(idx)}
                      className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${prodColorIndex === idx ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600' : 'border-emerald-900/5 bg-white/40 hover:bg-emerald-950/5'}`}
                    >
                      <div className="flex gap-0.5 rounded overflow-hidden border border-emerald-900/10">
                        <div className={`w-3.5 h-3.5 ${preset.top}`}></div>
                        <div className={`w-3.5 h-3.5 ${preset.bottom}`}></div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-955">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex gap-3 pt-4 border-t border-emerald-900/5">
                <button 
                  type="button" 
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-1/2 py-3 bg-white border border-emerald-900/10 rounded-xl text-xs font-black uppercase tracking-widest text-emerald-900/60 hover:bg-emerald-950/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 py-3 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20"
                >
                  {editingProduct ? 'Save Flavor' : 'Create Flavor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
