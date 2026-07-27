"use client";
import React, { useState, useEffect } from 'react';
import { getStoredProducts, saveStoredProducts, getStoredOrders, Product, Order, getProductStock } from '../../../lib/store';
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchOrders, uploadImagesToDrive } from '../../../lib/api';
import { ProductCardSkeleton } from '../../../components/Skeleton';
import { ProductCard } from '../../../components/ProductCard';

const STOREFRONT_CATEGORIES = [
  'Jar 500gm',
  '20gm Pouch (5pc)',
  'Signature Combos',
  'Combos'
];

export default function CatalogPage() {
  // Storage states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Step Wizard states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for product/combo
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState(499);
  const [prodStock, setProdStock] = useState(50);
  const [isCombo, setIsCombo] = useState(false);
  
  // Custom storefront location & marketing parameters
  const [prodMrp, setProdMrp] = useState(599);
  const [prodCategory, setProdCategory] = useState('Jar 500gm');
  const [prodShowInStorefront, setProdShowInStorefront] = useState(true);
  const [prodPriority, setProdPriority] = useState(0);
  const [prodIsBestSeller, setProdIsBestSeller] = useState(false);

  // Sequential Google Drive Photo Upload states
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [customPhotoInput, setCustomPhotoInput] = useState('');

  // Component items for combo: maps productId to quantity
  const [comboComponents, setComboComponents] = useState<{ [productId: string]: number }>({});

  // Catalog search/sorting/filtering
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogSort, setCatalogSort] = useState<'name' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'priority'>('priority');
  const [catalogStockFilter, setCatalogStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchOrders()])
      .then(([productsData, ordersData]) => {
        setProducts(productsData || []);
        setOrders(ordersData || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Dynamic performance indicators per product
  const getProductAnalytics = (productName: string) => {
    let unitsSold = 0;
    let revenue = 0;
    
    orders.forEach(order => {
      if (order.status !== 'Cancelled') {
        (order.items || []).forEach(item => {
          if (item.name === productName) {
            unitsSold += item.quantity;
            revenue += item.price;
          }
        });
      }
    });

    return { unitsSold, revenue };
  };

  // Step-by-Step Wizard Openers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setModalStep(1);
    setProdCategory('Jar 500gm');
    setIsCombo(false);
    setProdName('');
    setProdDesc('');
    setProdPrice(499);
    setProdStock(50);
    setProdMrp(599);
    setProdShowInStorefront(true);
    setProdPriority(0);
    setProdIsBestSeller(false);
    setUploadedPhotos([]);
    setCustomPhotoInput('');
    
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
    setModalStep(1);
    setProdCategory(product.category || 'Jar 500gm');
    setIsCombo(!!product.isCombo);
    setProdName(product.name);
    setProdDesc(product.description);
    setProdPrice(product.price);
    setProdStock(product.stock);
    setProdMrp(product.mrp || product.price);
    setProdShowInStorefront(product.showInStorefront !== false);
    setProdPriority(product.priority || 0);
    setProdIsBestSeller(!!product.isBestSeller);

    // Load existing photos
    const existingPhotos: string[] = [];
    if (product.imageSrc) existingPhotos.push(product.imageSrc);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img: string) => {
        if (!existingPhotos.includes(img)) existingPhotos.push(img);
      });
    }
    setUploadedPhotos(existingPhotos);

    // Initialize combo items if applicable
    const comps: { [id: string]: number } = {};
    products.filter(p => !p.isCombo).forEach(p => {
      const match = product.comboItems?.find(item => item.productId === p.id);
      comps[p.id] = match ? match.quantity : 0;
    });
    setComboComponents(comps);
    
    setIsProductModalOpen(true);
  };

  // Handle Sequential Photo Upload to Google Drive
  const handleSequentialPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingToDrive(true);
    const fileList = Array.from(files);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadStatusText(`Uploading photo ${i + 1} of ${fileList.length} to Google Drive...`);

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        // Call Google Drive backend upload API
        const res = await uploadImagesToDrive([{ base64, fileName: file.name }]);
        if (res && res.urls && res.urls.length > 0) {
          setUploadedPhotos(prev => [...prev, res.urls[0]]);
        } else if (res && res.url) {
          setUploadedPhotos(prev => [...prev, res.url]);
        }
      }
    } catch (err: any) {
      alert('Google Drive upload failed: ' + (err.message || err));
    } finally {
      setIsUploadingToDrive(false);
      setUploadStatusText('');
      e.target.value = '';
    }
  };

  const handleAddCustomUrlPhoto = () => {
    if (customPhotoInput.trim()) {
      setUploadedPhotos(prev => [...prev, customPhotoInput.trim()]);
      setCustomPhotoInput('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleMakeCoverPhoto = (index: number) => {
    if (index === 0) return;
    setUploadedPhotos(prev => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
  };

  const handleMovePhoto = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= uploadedPhotos.length) return;
    setUploadedPhotos(prev => {
      const copy = [...prev];
      const item = copy.splice(fromIndex, 1)[0];
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  const handleClearAllPhotos = () => {
    if (confirm('Are you sure you want to remove all photos from this product?')) {
      setUploadedPhotos([]);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodDesc.trim()) {
      alert('Please fill out all required fields (Name and Description).');
      return;
    }

    const primaryImage = uploadedPhotos.length > 0 ? uploadedPhotos[0] : '/bluelagoonjar.jpeg';

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

    const payload: any = {
      name: prodName.trim(),
      description: prodDesc.trim(),
      price: Number(prodPrice),
      stock: isCombo ? 0 : Number(prodStock),
      imageSrc: primaryImage,
      images: uploadedPhotos.length > 0 ? uploadedPhotos : [primaryImage],
      imageAlt: prodName.toLowerCase() + ' mocktail',
      topBgColor: editingProduct?.topBgColor || 'bg-slate-50',
      bottomBgColor: editingProduct?.bottomBgColor || 'bg-slate-100',
      buttonTextColor: editingProduct?.buttonTextColor || 'text-emerald-900',
      isCombo: isCombo,
      comboItems: isCombo ? selectedComponents : undefined,
      mrp: Number(prodMrp),
      category: prodCategory,
      showInStorefront: prodShowInStorefront,
      priority: Number(prodPriority),
      isBestSeller: prodIsBestSeller
    };

    try {
      if (editingProduct) {
        const updatedProd = await updateProduct(editingProduct.id, payload);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProd : p));
      } else {
        const newProd = await createProduct(payload);
        setProducts(prev => [...prev, newProd]);
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        setSelectedProductIds(prev => prev.filter(item => item !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  const handleToggleQuickVisibility = async (product: Product) => {
    const newVisibility = !(product.showInStorefront !== false);
    try {
      const updated = await updateProduct(product.id, { showInStorefront: newVisibility });
      setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    } catch (err: any) {
      alert(err.message || 'Failed to update visibility');
    }
  };

  const handleToggleQuickBestSeller = async (product: Product) => {
    const newBestSeller = !product.isBestSeller;
    try {
      const updated = await updateProduct(product.id, { isBestSeller: newBestSeller });
      setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    } catch (err: any) {
      alert(err.message || 'Failed to update best seller status');
    }
  };

  // Bulk Actions
  const handleBulkRestock = async (amount: number) => {
    if (selectedProductIds.length === 0) {
      alert('No products selected.');
      return;
    }
    try {
      const promises = selectedProductIds.map(id => {
        const p = products.find(prod => prod.id === id);
        if (p && !p.isCombo) {
          return updateProduct(id, { stock: p.stock + amount });
        }
        return Promise.resolve(p);
      });
      const updatedList = await Promise.all(promises);
      setProducts(prev => prev.map(p => {
        const match = updatedList.find(u => u && u.id === p.id);
        return match || p;
      }));
      setSelectedProductIds([]);
    } catch (err: any) {
      alert('Bulk restock failed: ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (confirm(`Are you sure you want to delete the ${selectedProductIds.length} selected products?`)) {
      try {
        await Promise.all(selectedProductIds.map(id => deleteProduct(id)));
        setProducts(prev => prev.filter(p => !selectedProductIds.includes(p.id)));
        setSelectedProductIds([]);
      } catch (err: any) {
        alert('Bulk delete failed: ' + err.message);
      }
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

  // Active Category List for filtering
  const activeCategories = Array.from(new Set(products.map(p => p.category || 'Uncategorized')));

  // Filtering & Sorting Products
  const filteredAndSortedProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                            p.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                            (p.category || '').toLowerCase().includes(catalogSearch.toLowerCase());
      
      const computedStock = getProductStock(p, products);
      const matchesStock = catalogStockFilter === 'all' ? true :
                           catalogStockFilter === 'low' ? computedStock > 0 && computedStock < 10 :
                           computedStock === 0;
      
      const matchesCat = catalogCategoryFilter === 'all' ? true : (p.category || 'Uncategorized') === catalogCategoryFilter;

      return matchesSearch && matchesStock && matchesCat;
    })
    .sort((a, b) => {
      if (catalogSort === 'priority') return (a.priority ?? 999) - (b.priority ?? 999);
      if (catalogSort === 'name') return a.name.localeCompare(b.name);
      if (catalogSort === 'price-asc') return a.price - b.price;
      if (catalogSort === 'price-desc') return b.price - a.price;
      
      const stockA = getProductStock(a, products);
      const stockB = getProductStock(b, products);
      if (catalogSort === 'stock-asc') return stockA - stockB;
      return stockB - stockA;
    });

  // Calculate preview discount percentage
  const activePreviewImage = uploadedPhotos.length > 0 ? uploadedPhotos[0] : '/bluelagoonjar.jpeg';
  const discountPct = prodMrp > prodPrice ? Math.round(((prodMrp - prodPrice) / prodMrp) * 100) : 0;

  // Resolve live combo constituent images for Modal Live Preview
  const liveComboImages = isCombo 
    ? Object.keys(comboComponents)
        .filter(id => comboComponents[id] > 0)
        .map(id => {
          const comp = products.find(p => p.id === id);
          return {
            src: comp?.imageSrc || '/bluelagoonjar.jpeg',
            count: comboComponents[id],
            name: comp?.name || ''
          };
        })
    : undefined;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-poppins">
      {/* Catalog Control Header */}
      <div className="bg-white p-6 border-2 border-emerald-900/10 rounded-3xl shadow-xl flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          {/* Search */}
          <div className="relative w-full lg:w-96 shrink-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900/50 text-lg">search</span>
            <input 
              type="text" 
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search flavors, jars, pouches & combos..." 
              className="w-full bg-slate-50 border-2 border-emerald-900/15 rounded-2xl pl-12 pr-6 py-3.5 text-xs font-black outline-none focus:border-emerald-700 focus:bg-white transition-all text-emerald-900 placeholder-emerald-900/40"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-slate-100 border border-emerald-900/15 rounded-xl px-3">
              <span className="material-symbols-outlined text-sm text-emerald-900/60">category</span>
              <select 
                value={catalogCategoryFilter}
                onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase text-emerald-900 py-3.5 outline-none border-none cursor-pointer tracking-wider"
              >
                <option value="all">All Categories</option>
                {STOREFRONT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {activeCategories.filter(c => !STOREFRONT_CATEGORIES.includes(c)).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div className="flex items-center gap-1 bg-slate-100 border border-emerald-900/15 rounded-xl px-3">
              <span className="material-symbols-outlined text-sm text-emerald-900/60">filter_list</span>
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

            {/* Sort Filter */}
            <div className="flex items-center gap-1 bg-slate-100 border border-emerald-900/15 rounded-xl px-3">
              <span className="material-symbols-outlined text-sm text-emerald-900/60">sort</span>
              <select 
                value={catalogSort}
                onChange={(e) => setCatalogSort(e.target.value as any)}
                className="bg-transparent text-[11px] font-black uppercase text-emerald-900 py-3.5 outline-none border-none cursor-pointer tracking-wider"
              >
                <option value="priority">Sort by Priority (Display Order)</option>
                <option value="name">Sort by Name</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="stock-asc">Stock: Low to High</option>
                <option value="stock-desc">Stock: High to Low</option>
              </select>
            </div>

            <button 
              onClick={handleOpenAddProduct}
              className="flex items-center justify-center gap-2 bg-emerald-900 text-white px-6 py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span> Add Product / Combo
            </button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedProductIds.length > 0 && (
          <div className="flex items-center justify-between p-3.5 bg-emerald-950/5 rounded-2xl border border-emerald-900/15 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-900">
              <span className="material-symbols-outlined text-base text-emerald-900">checklist</span>
              <span>{selectedProductIds.length} Items Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBulkRestock(50)} 
                className="bg-white hover:bg-emerald-50 border-2 border-emerald-900/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-emerald-900 shadow-sm transition-all cursor-pointer"
              >
                Bulk Restock (+50 Units)
              </button>
              <button 
                onClick={handleBulkDelete} 
                className="bg-rose-50 hover:bg-rose-100 border border-rose-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-rose-700 shadow-sm transition-all cursor-pointer"
              >
                Bulk Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        ) : (
          filteredAndSortedProducts.map((product) => {
          const analytics = getProductAnalytics(product.name);
          const isSelected = selectedProductIds.includes(product.id);
          const computedStock = getProductStock(product, products);
          const isHidden = product.showInStorefront === false;
          const cardDiscountPct = (product.mrp && product.mrp > product.price) 
            ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
            : 0;

          const productComboImages = product.isCombo && product.comboItems && product.comboItems.length > 0
            ? product.comboItems.map(item => {
                const comp = products.find(p => p.id === item.productId);
                return {
                  src: comp?.imageSrc || '/bluelagoonjar.jpeg',
                  count: item.quantity,
                  name: comp?.name || ''
                };
              })
            : undefined;
          
          return (
            <div key={product.id} className={`bg-white border-2 rounded-3xl overflow-hidden shadow-lg flex flex-col justify-between group relative transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isSelected ? 'ring-4 ring-emerald-600 border-emerald-700' : isHidden ? 'opacity-75 border-zinc-200 bg-zinc-50' : 'border-emerald-900/10'}`}>
              
              {/* Selection checkbox */}
              <button 
                type="button"
                onClick={() => toggleSelectProduct(product.id)}
                className={`absolute top-4 right-4 w-7 h-7 rounded-full border-2 flex items-center justify-center z-20 transition-all cursor-pointer ${isSelected ? 'bg-emerald-900 text-white border-emerald-900 shadow-md' : 'bg-white/80 backdrop-blur border-emerald-900/30 text-transparent hover:border-emerald-900'}`}
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
              </button>

              {/* Card visual header */}
              <div className="bg-slate-50/80 h-48 relative flex items-center justify-center p-4 border-b border-emerald-900/10 overflow-hidden">
                
                {/* Badges Container */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-20 items-start">
                  {product.isBestSeller && (
                    <span className="bg-black text-white font-black tracking-wider text-[8px] uppercase px-2.5 py-0.5 rounded-xs shadow-md">
                      ★ Best Seller
                    </span>
                  )}
                  {product.isCombo && (
                    <span className="bg-emerald-950 text-white font-black tracking-wider text-[8px] uppercase px-2.5 py-0.5 rounded-full shadow-md">
                      Combo Pack
                    </span>
                  )}
                  {cardDiscountPct > 0 && (
                    <span className="bg-[#f43f5e] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs">
                      {cardDiscountPct}% OFF
                    </span>
                  )}
                  {!product.isCombo && computedStock < 10 && (
                    <span className="bg-rose-600 text-white font-black tracking-wider text-[8px] uppercase px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                      {computedStock === 0 ? 'Out of Stock' : `Only ${computedStock} Left!`}
                    </span>
                  )}
                </div>

                {/* Hidden Overlay Tag */}
                {isHidden && (
                  <span className="absolute bottom-3 right-3 bg-zinc-900/80 backdrop-blur text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg z-20">
                    Hidden from Storefront
                  </span>
                )}

                {/* Multi-Image Composite Frame for Combos OR Single Product Image */}
                {product.isCombo && productComboImages && productComboImages.length > 0 ? (
                  <div className="w-full h-full relative flex items-center justify-center p-2 z-10">
                    {productComboImages.length === 1 && (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img src={productComboImages[0].src} alt={product.name} className="h-full object-contain drop-shadow-md" />
                        {productComboImages[0].count && productComboImages[0].count > 1 && (
                          <span className="absolute bottom-1 right-2 bg-emerald-950 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-md z-20">
                            {productComboImages[0].count}x
                          </span>
                        )}
                      </div>
                    )}
                    {productComboImages.length === 2 && (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="relative w-1/2 h-4/5 -mr-4 transform -rotate-6 z-10 flex items-center justify-center">
                          <img src={productComboImages[0].src} alt="" className="w-full h-full object-contain drop-shadow-lg" />
                          {productComboImages[0].count && productComboImages[0].count > 0 && (
                            <span className="absolute bottom-0 left-0 bg-emerald-950 text-white font-black text-[8px] px-1.5 py-0.5 rounded-md shadow-md z-20">
                              {productComboImages[0].count}x
                            </span>
                          )}
                        </div>
                        <div className="relative w-1/2 h-4/5 transform rotate-6 z-20 flex items-center justify-center">
                          <img src={productComboImages[1].src} alt="" className="w-full h-full object-contain drop-shadow-lg" />
                          {productComboImages[1].count && productComboImages[1].count > 0 && (
                            <span className="absolute bottom-0 right-0 bg-emerald-950 text-white font-black text-[8px] px-1.5 py-0.5 rounded-md shadow-md z-20">
                              {productComboImages[1].count}x
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {productComboImages.length === 3 && (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="absolute left-1 w-2/5 h-3/4 transform -rotate-12 -translate-x-1 scale-95 opacity-90 z-10 flex items-center justify-center">
                          <img src={productComboImages[0].src} alt="" className="w-full h-full object-contain drop-shadow-md" />
                          {productComboImages[0].count && productComboImages[0].count > 0 && (
                            <span className="absolute -bottom-1 left-0 bg-emerald-950 text-white font-black text-[7px] px-1.5 py-0.5 rounded-md shadow-sm">
                              {productComboImages[0].count}x
                            </span>
                          )}
                        </div>
                        <div className="relative w-2/5 h-full z-30 flex items-center justify-center">
                          <img src={productComboImages[1].src} alt="" className="w-full h-full object-contain drop-shadow-xl" />
                          {productComboImages[1].count && productComboImages[1].count > 0 && (
                            <span className="absolute bottom-0 right-0 bg-emerald-950 text-white font-black text-[8px] px-1.5 py-0.5 rounded-md shadow-md z-40">
                              {productComboImages[1].count}x
                            </span>
                          )}
                        </div>
                        <div className="absolute right-1 w-2/5 h-3/4 transform rotate-12 translate-x-1 scale-95 opacity-90 z-20 flex items-center justify-center">
                          <img src={productComboImages[2].src} alt="" className="w-full h-full object-contain drop-shadow-md" />
                          {productComboImages[2].count && productComboImages[2].count > 0 && (
                            <span className="absolute -bottom-1 right-0 bg-emerald-950 text-white font-black text-[7px] px-1.5 py-0.5 rounded-md shadow-sm">
                              {productComboImages[2].count}x
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {productComboImages.length >= 4 && (
                      <div className="w-full h-full grid grid-cols-2 gap-1 p-1">
                        {productComboImages.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="relative w-full h-full flex items-center justify-center p-0.5 bg-white/40 rounded-lg border border-zinc-200/50">
                            <img src={item.src} alt="" className="h-full max-h-20 object-contain drop-shadow-xs" />
                            {item.count && item.count > 0 && (
                              <span className="absolute bottom-0.5 right-0.5 bg-emerald-950 text-white font-black text-[7px] px-1 py-0.2 rounded-xs shadow-xs">
                                {item.count}x
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <img src={product.imageSrc} alt={product.name} className="h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-xl z-10" />
                )}
              </div>

              {/* Card Info details */}
              <div className="p-6 space-y-4 grow flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-900/50 block">
                        {product.category || 'Uncategorized'}
                      </span>
                      <h4 className="text-base font-black italic uppercase tracking-wider text-emerald-900 leading-tight mt-0.5">{product.name}</h4>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0">
                      {product.mrp && product.mrp > product.price && (
                        <span className="text-[9px] line-through text-zinc-400 font-bold">
                          ₹{product.mrp}
                        </span>
                      )}
                      <span className="text-sm font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-900/10">₹{product.price}/-</span>
                    </div>
                  </div>

                  <p className="text-emerald-900/80 text-xs leading-relaxed line-clamp-2 font-semibold">{product.description}</p>
                  
                  {/* List components for Combo */}
                  {product.isCombo && product.comboItems && (
                    <div className="pt-1">
                      <span className="text-[9px] font-black text-emerald-900 uppercase tracking-widest block">Constituent items</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.comboItems.map((item, idx) => {
                          const matchedComp = products.find(p => p.id === item.productId);
                          return (
                            <span key={idx} className="bg-slate-100 text-emerald-900 text-[9px] font-black px-2 py-0.5 rounded-md border border-emerald-900/10">
                              {item.quantity}x {matchedComp ? matchedComp.name : 'Unknown'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Toggle Toolbar */}
                <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-emerald-900/5 text-[9px] font-bold">
                  <button 
                    type="button"
                    onClick={() => handleToggleQuickVisibility(product)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${!isHidden ? 'bg-emerald-100 text-emerald-900 font-black' : 'bg-zinc-200 text-zinc-600'}`}
                  >
                    <span className="material-symbols-outlined text-xs">{!isHidden ? 'visibility' : 'visibility_off'}</span>
                    <span>{!isHidden ? 'Visible' : 'Hidden'}</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleToggleQuickBestSeller(product)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${product.isBestSeller ? 'bg-amber-100 text-amber-900 font-black' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                  >
                    <span className="material-symbols-outlined text-xs">star</span>
                    <span>{product.isBestSeller ? 'Best Seller' : 'Normal'}</span>
                  </button>

                  <span className="text-zinc-400 font-mono text-[9px]">P:{product.priority || 0}</span>
                </div>

                {/* Performance Statistics */}
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
                <div className="pt-2 border-t border-emerald-900/5">
                  {product.isCombo ? (
                    computedStock === 0 ? (
                      <div className="bg-red-600 border border-red-700 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-sm">report</span> Out of Stock
                      </div>
                    ) : (
                      <div className="bg-sky-600 border border-sky-700 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-sm">layers</span> Derived Stock: {computedStock} Packs
                      </div>
                    )
                  ) : (
                    computedStock === 0 ? (
                      <div className="bg-red-600 border border-red-700 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-sm">report</span> Out of Stock
                      </div>
                    ) : computedStock < 10 ? (
                      <div className="bg-amber-500 border border-amber-600 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-2xl flex items-center justify-center gap-1.5 animate-pulse shadow-sm">
                        <span className="material-symbols-outlined text-sm">warning</span> Low Stock: {computedStock} Units
                      </div>
                    ) : (
                      <div className="bg-emerald-600 border border-emerald-700 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm">
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
                    <span className="material-symbols-outlined text-sm">tune</span> Configure
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
        }))}

        {!loading && filteredAndSortedProducts.length === 0 && (
          <div className="col-span-full py-16 text-center text-emerald-900/35 font-bold uppercase text-xs tracking-widest">
            No matching assets in inventory.
          </div>
        )}
      </div>

      {/* STEP WIZARD MODAL: CONFIGURATION & LIVE STOREFRONT PREVIEW */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-emerald-950/50 backdrop-blur-md" onClick={() => setIsProductModalOpen(false)}></div>
          
          <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-[2.5rem] shadow-2xl flex flex-col relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden border border-emerald-900/10">
            {/* Header & Step Wizard Indicator */}
            <header className="p-6 border-b border-emerald-900/10 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-white flex items-center justify-center shadow-md shrink-0">
                  <span className="material-symbols-outlined text-xl">tune</span>
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-emerald-950">
                    {editingProduct ? 'Configure Catalog Asset' : 'Add New Catalog Asset'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Sequential Wizard Config with Google Drive Cloud Storage</p>
                </div>
              </div>

              {/* Wizard Steps Pills */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-emerald-900/10 shadow-xs self-start sm:self-auto">
                <button 
                  type="button" 
                  onClick={() => setModalStep(1)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${modalStep === 1 ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-900/60 hover:text-emerald-900'}`}
                >
                  1. Category
                </button>
                <button 
                  type="button" 
                  onClick={() => setModalStep(2)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${modalStep === 2 ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-900/60 hover:text-emerald-900'}`}
                >
                  2. Details
                </button>
                <button 
                  type="button" 
                  onClick={() => setModalStep(3)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${modalStep === 3 ? 'bg-emerald-900 text-white shadow-sm' : 'text-emerald-900/60 hover:text-emerald-900'}`}
                >
                  3. Photos ({uploadedPhotos.length})
                </button>

                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-emerald-950/5 hover:bg-emerald-900 hover:text-white text-emerald-950 flex items-center justify-center transition-all ml-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </header>

            {/* Split View Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto grow custom-scrollbar">
              {/* Left Column: Multi-Step Form (7 cols) */}
              <form onSubmit={handleSaveProduct} id="config-form" className="lg:col-span-7 p-6 space-y-6 border-r border-emerald-900/10 flex flex-col justify-between">
                
                {/* STEP 1: Choose Category & Product Type */}
                {modalStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Step 1 of 3</span>
                      <h4 className="text-lg font-black uppercase text-emerald-950 pt-1">Select Frontstore Category</h4>
                      <p className="text-xs text-zinc-500">Choose where this product appears in the storefront catalog.</p>
                    </div>

                    {/* Category Selection Grid */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Category Section *</label>
                      <div className="grid grid-cols-2 gap-3">
                        {STOREFRONT_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setProdCategory(cat)}
                            className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${prodCategory === cat ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600 shadow-sm' : 'border-emerald-900/10 bg-slate-50 hover:bg-emerald-950/5'}`}
                          >
                            <span className="material-symbols-outlined text-emerald-900 text-xl">
                              {cat.includes('Jar') ? 'local_bar' : cat.includes('Pouch') ? 'inventory_2' : 'card_giftcard'}
                            </span>
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-950">{cat}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Product Type Toggle */}
                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Asset Format Type *</label>
                      <div className="flex bg-emerald-950/5 p-1 rounded-2xl border border-emerald-900/10">
                        <button 
                          type="button"
                          onClick={() => setIsCombo(false)}
                          className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${!isCombo ? 'bg-white text-emerald-950 shadow-md border border-emerald-900/5' : 'text-emerald-900/50 hover:text-emerald-900'}`}
                        >
                          Single Flavor Product
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsCombo(true)}
                          className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${isCombo ? 'bg-white text-emerald-950 shadow-md border border-emerald-900/5' : 'text-emerald-900/50 hover:text-emerald-900'}`}
                        >
                          Multi-Flavor Combo Pack
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setModalStep(2)}
                        className="bg-emerald-900 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                      >
                        <span>Next: Product Details</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Title, Description, Pricing, Stock & Options */}
                {modalStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Step 2 of 3</span>
                      <h4 className="text-lg font-black uppercase text-emerald-950 pt-1">Product Details & Specs</h4>
                    </div>

                    {/* Product Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Asset Title / Name *</label>
                      <input 
                        type="text" 
                        required
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        placeholder={isCombo ? "e.g. Signature Party Bundle" : "e.g. Blue Lagoon Mocktail Jar (500g)"} 
                        className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all text-emerald-950"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Description *</label>
                      <textarea 
                        required
                        value={prodDesc}
                        onChange={(e) => setProdDesc(e.target.value)}
                        placeholder="Describe flavor notes, ingredients, or bundle details..." 
                        rows={3}
                        className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all text-emerald-950 resize-none"
                      />
                    </div>

                    {/* Price & Stock */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Selling Price (₹) *</label>
                        <input 
                          type="number" 
                          required
                          value={prodPrice}
                          onChange={(e) => setProdPrice(Number(e.target.value))}
                          min={0}
                          className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all text-emerald-950"
                        />
                      </div>
                      {!isCombo ? (
                        <div className="space-y-1.5 animate-in fade-in duration-300">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Stock Units *</label>
                          <input 
                            type="number" 
                            required
                            value={prodStock}
                            onChange={(e) => setProdStock(Number(e.target.value))}
                            min={0}
                            className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all text-emerald-950"
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
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">MRP (Crossed Price)</label>
                          {discountPct > 0 && (
                            <span className="text-[9px] font-black text-rose-600 uppercase">{discountPct}% OFF</span>
                          )}
                        </div>
                        <input 
                          type="number" 
                          value={prodMrp}
                          onChange={(e) => setProdMrp(Number(e.target.value))}
                          min={0}
                          placeholder="e.g. 599"
                          className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all text-emerald-950"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Display Priority Order</label>
                        <input 
                          type="number" 
                          value={prodPriority}
                          onChange={(e) => setProdPriority(Number(e.target.value))}
                          className="w-full bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white transition-all text-emerald-950"
                          title="Lower number renders first on storefront"
                        />
                      </div>
                    </div>

                    {/* Badges Toggle */}
                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-2 p-3 bg-emerald-950/5 border border-emerald-900/10 rounded-xl cursor-pointer select-none grow">
                        <input 
                          type="checkbox" 
                          checked={prodShowInStorefront}
                          onChange={(e) => setProdShowInStorefront(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-800"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-950">Show in Store</span>
                      </label>

                      <label className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-900/10 rounded-xl cursor-pointer select-none grow">
                        <input 
                          type="checkbox" 
                          checked={prodIsBestSeller}
                          onChange={(e) => setProdIsBestSeller(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-950">Best Seller</span>
                      </label>
                    </div>

                    {/* Combo components Selector */}
                    {isCombo && (
                      <div className="space-y-3 p-4 bg-emerald-950/5 rounded-2xl border border-emerald-900/10 animate-in slide-in-from-top-2 duration-300">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Combo Ingredients Selection</span>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
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

                    <div className="pt-4 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setModalStep(1)}
                        className="bg-white border border-emerald-900/15 text-emerald-900 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-xl hover:bg-emerald-950/5 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalStep(3)}
                        className="bg-emerald-900 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                      >
                        <span>Next: Sequential Photos ({uploadedPhotos.length})</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Sequential Photo Uploads & Order Arrangement controls */}
                {modalStep === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Step 3 of 3</span>
                      <h4 className="text-lg font-black uppercase text-emerald-950 pt-1">Product Photo Gallery & Reordering</h4>
                      <p className="text-xs text-zinc-500">Upload multiple photos, arrange sequence order, and delete unwanted images.</p>
                    </div>

                    {/* Sequential File Upload Drop Area */}
                    <div className="border-2 border-dashed border-emerald-900/20 bg-emerald-50/40 rounded-2xl p-5 text-center space-y-2.5 hover:bg-emerald-50/80 transition-all relative">
                      <input 
                        type="file" 
                        multiple
                        accept="image/*"
                        onChange={handleSequentialPhotoUpload}
                        disabled={isUploadingToDrive}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      />

                      <div className="w-10 h-10 rounded-full bg-emerald-900 text-white mx-auto flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-xl">cloud_upload</span>
                      </div>

                      {isUploadingToDrive ? (
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-wider text-emerald-900 animate-pulse">{uploadStatusText || 'Uploading to Google Drive...'}</p>
                          <div className="w-48 h-1.5 bg-emerald-200 rounded-full mx-auto overflow-hidden">
                            <div className="w-full h-full bg-emerald-800 animate-pulse"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-wider text-emerald-950">Click or Drag & Drop Photos to Upload</p>
                          <p className="text-[10px] font-bold text-zinc-400">Uploads directly to Google Drive • Supports multiple sequential files</p>
                        </div>
                      )}
                    </div>

                    {/* Google Drive OAuth 1-Click Authorize Banner */}
                    <div className="flex items-center justify-between p-3 bg-amber-50/80 rounded-xl border border-amber-900/10 text-[10px] font-bold text-amber-950">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-amber-600">lock_open</span>
                        <span>First time uploading? Authorize Google Account quota</span>
                      </div>
                      <a 
                        href={`${(process.env.NEXT_PUBLIC_API_URL || 'https://ninjaro-x-or1s-hbdiel76e-ninjaro.vercel.app/api').replace(/\/$/, '')}/upload/auth`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[9px] px-3 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1"
                      >
                        <span>Authorize Drive</span>
                        <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                      </a>
                    </div>

                    {/* Direct URL Input Fallback */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={customPhotoInput}
                        onChange={(e) => setCustomPhotoInput(e.target.value)}
                        placeholder="Or paste direct image URL (e.g. /bluelagoonjar.jpeg or https://...)" 
                        className="grow bg-emerald-950/5 border border-emerald-900/10 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-emerald-600 focus:bg-white text-emerald-950"
                      />
                      <button 
                        type="button"
                        onClick={handleAddCustomUrlPhoto}
                        className="bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer"
                      >
                        Add URL
                      </button>
                    </div>

                    {/* Gallery Stream & Reorder / Delete Controls */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 block">Photo Gallery Sequence ({uploadedPhotos.length})</label>
                        {uploadedPhotos.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllPhotos}
                            className="text-[9px] font-black text-rose-600 uppercase tracking-widest hover:underline cursor-pointer"
                          >
                            Clear All Photos
                          </button>
                        )}
                      </div>

                      {uploadedPhotos.length === 0 ? (
                        <div className="p-6 bg-slate-50 rounded-2xl border border-emerald-900/10 text-center text-xs font-bold text-zinc-400">
                          No photos uploaded yet. Select files above to upload directly to Google Drive.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                          {uploadedPhotos.map((photoUrl, idx) => (
                            <div key={idx} className={`relative p-2.5 bg-white border-2 rounded-2xl flex flex-col items-center justify-between gap-2 group shadow-xs transition-all ${idx === 0 ? 'border-emerald-600 ring-2 ring-emerald-600/30' : 'border-zinc-200 hover:border-emerald-900/20'}`}>
                              {/* Position Badge & Cover Tag */}
                              <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                                <span className="bg-zinc-900/80 backdrop-blur text-white text-[8px] font-mono px-1.5 py-0.5 rounded-md font-bold">
                                  #{idx + 1}
                                </span>
                                {idx === 0 && (
                                  <span className="bg-emerald-900 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                                    Cover
                                  </span>
                                )}
                              </div>

                              {/* Delete Quick Button Top Right */}
                              <button 
                                type="button"
                                onClick={() => handleRemovePhoto(idx)}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 flex items-center justify-center transition-all z-10 cursor-pointer shadow-xs"
                                title="Delete photo"
                              >
                                <span className="material-symbols-outlined text-[13px]">delete</span>
                              </button>

                              {/* Thumbnail */}
                              <div className="w-full h-24 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 mt-4">
                                <img src={photoUrl} alt={`Photo ${idx + 1}`} className="h-full object-contain" />
                              </div>

                              {/* Arrange & Delete Control Toolbar */}
                              <div className="w-full pt-2 border-t border-zinc-100 flex flex-col gap-1.5">
                                {/* Move Left / Move Right Buttons */}
                                <div className="flex items-center justify-between gap-1 bg-slate-50 p-1 rounded-xl border border-zinc-200/60">
                                  <button 
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMovePhoto(idx, idx - 1)}
                                    className="flex-1 py-1 bg-white hover:bg-emerald-50 text-emerald-950 disabled:opacity-30 disabled:hover:bg-white border border-zinc-200 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-0.5 transition-all cursor-pointer disabled:cursor-not-allowed"
                                    title="Move left"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">arrow_back</span>
                                    <span>Left</span>
                                  </button>

                                  <button 
                                    type="button"
                                    disabled={idx === uploadedPhotos.length - 1}
                                    onClick={() => handleMovePhoto(idx, idx + 1)}
                                    className="flex-1 py-1 bg-white hover:bg-emerald-50 text-emerald-950 disabled:opacity-30 disabled:hover:bg-white border border-zinc-200 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-0.5 transition-all cursor-pointer disabled:cursor-not-allowed"
                                    title="Move right"
                                  >
                                    <span>Right</span>
                                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                                  </button>
                                </div>

                                {/* Set as Cover / Delete Action bar */}
                                <div className="flex items-center justify-between px-1">
                                  {idx > 0 ? (
                                    <button 
                                      type="button"
                                      onClick={() => handleMakeCoverPhoto(idx)}
                                      className="text-emerald-800 hover:text-emerald-950 font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[12px]">star</span>
                                      <span>Set as Cover</span>
                                    </button>
                                  ) : (
                                    <span className="text-emerald-900 font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                      <span>Primary Cover</span>
                                    </span>
                                  )}

                                  <button 
                                    type="button"
                                    onClick={() => handleRemovePhoto(idx)}
                                    className="text-rose-600 hover:text-rose-800 font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setModalStep(2)}
                        className="bg-white border border-emerald-900/15 text-emerald-900 font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-xl hover:bg-emerald-950/5 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        <span>Back</span>
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-900 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-xl shadow-emerald-900/20 cursor-pointer"
                      >
                        {editingProduct ? 'Save Product' : 'Publish Product'}
                      </button>
                    </div>
                  </div>
                )}
              </form>

              {/* Right Column: Live Frontstore Product Card Preview (5 cols) */}
              <div className="lg:col-span-5 p-6 bg-slate-50 flex flex-col items-center justify-between border-t lg:border-t-0 border-emerald-900/10">
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/60 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Frontstore Preview
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">Step {modalStep} of 3</span>
                  </div>

                  {/* Render Live ProductCard Component */}
                  <div className="w-full max-w-sm mx-auto shadow-xl rounded-2xl overflow-hidden border border-emerald-900/10 bg-white">
                    <ProductCard 
                      id="preview-id"
                      name={prodName || (isCombo ? 'Sample Combo Bundle' : 'Sample Mocktail')}
                      description={prodDesc || 'Sample botanical flavor description will appear here...'}
                      price={`₹${prodPrice || 0}/-`}
                      imageSrc={activePreviewImage}
                      imageAlt={prodName}
                      topBgColor="bg-slate-50"
                      bottomBgColor="bg-slate-100"
                      buttonTextColor="text-emerald-900"
                      quantity={0}
                      stock={isCombo ? 50 : prodStock}
                      mrp={prodMrp > prodPrice ? `₹${prodMrp}/-` : undefined}
                      isBestSeller={prodIsBestSeller}
                      isCombo={isCombo}
                      comboImages={liveComboImages}
                      onAddToCart={() => {}}
                      onUpdateQuantity={() => {}}
                    />
                  </div>

                  {/* Multi-Photo Thumbnails Stream Preview */}
                  {uploadedPhotos.length > 1 && !isCombo && (
                    <div className="w-full max-w-sm mx-auto p-3 bg-white rounded-2xl border border-emerald-900/10 space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">Gallery Photo Sequence ({uploadedPhotos.length})</span>
                      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                        {uploadedPhotos.map((url, i) => (
                          <div key={i} className={`w-12 h-12 rounded-xl border p-1 flex items-center justify-center shrink-0 ${i === 0 ? 'border-emerald-600 ring-2 ring-emerald-600 bg-emerald-50' : 'border-zinc-200 bg-slate-50'}`}>
                            <img src={url} alt="" className="h-full object-contain" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="w-full flex gap-3 pt-6 mt-6 border-t border-emerald-900/10">
                  <button 
                    type="button" 
                    onClick={() => setIsProductModalOpen(false)}
                    className="w-1/2 py-3.5 bg-white border border-emerald-900/10 rounded-2xl text-xs font-black uppercase tracking-widest text-emerald-900/60 hover:bg-emerald-950/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    form="config-form"
                    className="w-1/2 py-3.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20 cursor-pointer"
                  >
                    {editingProduct ? 'Save Changes' : 'Publish Asset'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
