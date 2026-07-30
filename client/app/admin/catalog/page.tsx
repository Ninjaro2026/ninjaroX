"use client";
import React, { useState, useEffect } from 'react';
import { getStoredProducts, saveStoredProducts, getStoredOrders, Product, Order, getProductStock } from '../../../lib/store';
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchOrders, uploadImagesToDrive, deleteImagesFromDrive, fetchTopOfferText, updateTopOfferText } from '../../../lib/api';
import { ProductCardSkeleton } from '../../../components/Skeleton';
import { ProductCard } from '../../../components/ProductCard';

const STOREFRONT_CATEGORIES = [
  'Jar 500gm',
  '20gm Pouch (5pc)',
  'Combos'
];

const TAG_PRESETS = [
  'Best Seller',
  'New Launch',
  'Must Try',
  'Sugar Free',
  'Trending',
  'Limited Edition'
];

export default function CatalogPage() {
  // Storage states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Storefront Top Announcement Banner states
  const [topOfferInput, setTopOfferInput] = useState('');
  const [isSavingTopOffer, setIsSavingTopOffer] = useState(false);
  const [topOfferSavedNotice, setTopOfferSavedNotice] = useState(false);

  // Modal & Stepper navigation states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [stepperStep, setStepperStep] = useState<1 | 2 | 3 | 4>(1);
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

  // Flexible Custom Tag Builder states
  const [prodCustomTag, setProdCustomTag] = useState('');
  const [prodTagPosition, setProdTagPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-left');
  const [prodTagColor, setProdTagColor] = useState<string>('black');

  // Form Validation State
  const isFormValid = prodName.trim().length > 0 && prodDesc.trim().length > 0 && Number(prodPrice) > 0;

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
    Promise.all([fetchProducts(), fetchOrders(), fetchTopOfferText()])
      .then(([productsData, ordersData, topOffer]) => {
        setProducts(productsData || []);
        setOrders(ordersData || []);
        if (topOffer) setTopOfferInput(topOffer);
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

  // Product Modal Openers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setStepperStep(1);
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
    setProdCustomTag('');
    setProdTagPosition('top-left');
    setProdTagColor('black');
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
    setStepperStep(1);
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
    setProdCustomTag(product.customTag || (product.isBestSeller ? 'Best Seller' : ''));
    setProdTagPosition(product.tagPosition || 'top-left');
    setProdTagColor(product.tagColor || 'black');

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

  // Handle Sequential Photo Upload to Google Drive with 2MB Limit & Sanitized Renaming
  const handleSequentialPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingToDrive(true);
    const fileList = Array.from(files);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        // 1. Enforce 2MB Maximum File Size Limit
        if (file.size > 2 * 1024 * 1024) {
          alert(`File "${file.name}" exceeds the 2MB size limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select an image under 2MB.`);
          continue;
        }

        setUploadStatusText(`Uploading photo ${i + 1} of ${fileList.length} to Google Drive...`);

        // 2. Generate Sanitized Unique Filename for Structured Storage
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const sanitizedSlug = prodName ? prodName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') : 'catalog_asset';
        const sanitizedFileName = `ninjiro_${sanitizedSlug}_${Date.now()}_${i + 1}.${fileExt}`;

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        // Call Google Drive backend upload API with sanitized file name
        const res = await uploadImagesToDrive([{ base64, fileName: sanitizedFileName }]);
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

  const handleRemovePhoto = async (index: number) => {
    const photoToRemove = uploadedPhotos[index];
    if (photoToRemove) {
      try {
        await deleteImagesFromDrive([photoToRemove]);
      } catch (err: any) {
        alert('⚠️ Failed to delete photo from Google Drive: ' + (err.message || err));
      }
    }
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

  const handleClearAllPhotos = async () => {
    if (confirm('Are you sure you want to remove all photos from this product?')) {
      if (uploadedPhotos.length > 0) {
        try {
          await deleteImagesFromDrive(uploadedPhotos);
        } catch (err: any) {
          alert('⚠️ Failed to delete photos from Google Drive: ' + (err.message || err));
        }
      }
      setUploadedPhotos([]);
    }
  };

  const handleSaveProduct = async () => {

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
      isBestSeller: prodCustomTag.trim().toLowerCase() === 'best seller',
      customTag: prodCustomTag.trim(),
      tagPosition: prodTagPosition,
      tagColor: prodTagColor
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
        const res = await deleteProduct(id);
        if (res && res.warning) {
          alert('⚠️ Notice: ' + res.warning);
        }
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
        const results = await Promise.all(selectedProductIds.map(id => deleteProduct(id)));
        const warnings = results.map((r: any) => r?.warning).filter(Boolean);
        if (warnings.length > 0) {
          alert('⚠️ Google Drive Image Deletion Warning:\n' + warnings.join('\n'));
        }
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

  // Compute metric stats for overview cards
  const totalAssetsCount = products.length;
  const liveStorefrontCount = products.filter(p => p.showInStorefront !== false).length;
  const lowStockCount = products.filter(p => {
    const s = getProductStock(p, products);
    return s > 0 && s < 10;
  }).length;
  const outOfStockCount = products.filter(p => getProductStock(p, products) === 0).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-poppins pb-12">
      {/* 0. STOREFRONT TOP ANNOUNCEMENT BANNER EDITOR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">campaign</span>
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">Top Offer Announcement Banner</h3>
            <p className="text-[11px] text-slate-500 font-medium">Text displayed in the centered top offer pill across the storefront</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto grow max-w-xl">
          <input 
            type="text" 
            value={topOfferInput}
            onChange={(e) => setTopOfferInput(e.target.value)}
            placeholder="e.g. 🎁 Free Shipping Order Above ₹249 & Apply 5% Discount"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            disabled={isSavingTopOffer}
            onClick={async () => {
              setIsSavingTopOffer(true);
              try {
                await updateTopOfferText(topOfferInput);
                setTopOfferSavedNotice(true);
                setTimeout(() => setTopOfferSavedNotice(false), 3000);
              } catch (err) {
                alert('Failed to update top offer text');
              } finally {
                setIsSavingTopOffer(false);
              }
            }}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSavingTopOffer ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : topOfferSavedNotice ? (
              <>
                <span className="material-symbols-outlined text-sm text-emerald-300">check_circle</span>
                <span>Saved!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Save Banner</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. TOP CONTROL BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          
          {/* Search Field */}
          <div className="relative w-full lg:w-80 shrink-0">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
            <input 
              type="text" 
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search assets by title or description..." 
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-10 pr-8 py-2.5 text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
            {catalogSearch && (
              <button 
                onClick={() => setCatalogSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
              </button>
            )}
          </div>

          {/* Quick Filters & Actions */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 w-full lg:w-auto">
            {/* Category Quick Pills */}
            <div className="flex items-center gap-1 bg-slate-50/80 p-1 rounded-xl border border-slate-200/80 overflow-x-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setCatalogCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${catalogCategoryFilter === 'all' ? 'bg-emerald-800 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                All
              </button>
              {STOREFRONT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatalogCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${catalogCategoryFilter === cat ? 'bg-emerald-800 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Stock Filter Menu */}
            <select 
              value={catalogStockFilter}
              onChange={(e) => setCatalogStockFilter(e.target.value as any)}
              className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Stock Status</option>
              <option value="low">Low Stock (&lt; 10)</option>
              <option value="out">Out of Stock (0)</option>
            </select>

            {/* Sort Menu */}
            <select 
              value={catalogSort}
              onChange={(e) => setCatalogSort(e.target.value as any)}
              className="bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="priority">Priority Order</option>
              <option value="name">Name A-Z</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock-asc">Stock: Low to High</option>
              <option value="stock-desc">Stock: High to Low</option>
            </select>

            {/* Add Asset Button */}
            <button 
              onClick={handleOpenAddProduct}
              className="flex items-center gap-1.5 bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>New Asset</span>
            </button>
          </div>
        </div>

        {/* Floating Bulk Action Bar */}
        {selectedProductIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950">
              <span className="material-symbols-outlined text-base text-emerald-800">checklist</span>
              <span>{selectedProductIds.length} Assets Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBulkRestock(10)} 
                className="bg-white hover:bg-slate-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-emerald-900 shadow-2xs transition-all cursor-pointer"
              >
                +10 Stock
              </button>
              <button 
                onClick={() => handleBulkRestock(50)} 
                className="bg-white hover:bg-slate-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-emerald-900 shadow-2xs transition-all cursor-pointer"
              >
                +50 Stock
              </button>
              <button 
                onClick={handleBulkDelete} 
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. INVENTORY METRICS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">inventory_2</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Total Assets</span>
            <p className="text-base font-bold text-slate-800">{totalAssetsCount} Items</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">storefront</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Storefront Live</span>
            <p className="text-base font-bold text-slate-800">{liveStorefrontCount} Active</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">warning</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Low Stock Alert</span>
            <p className="text-base font-bold text-slate-800">{lowStockCount} Items</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">report</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Out of Stock</span>
            <p className="text-base font-bold text-slate-800">{outOfStockCount} Items</p>
          </div>
        </div>
      </div>

      {/* 3. CATALOG ASSETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

            const activeTagText = product.customTag ? product.customTag.trim() : (product.isBestSeller ? 'Best Seller' : null);

            return (
              <div 
                key={product.id} 
                className={`bg-white border rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between group relative transition-all duration-300 hover:shadow-md ${isSelected ? 'ring-2 ring-emerald-600 border-emerald-600' : isHidden ? 'opacity-75 border-slate-200 bg-slate-50/50' : 'border-slate-200/80'}`}
              >
                {/* Checkbox selector */}
                <button 
                  type="button"
                  onClick={() => toggleSelectProduct(product.id)}
                  className={`absolute top-3 right-3 w-6 h-6 rounded-full border flex items-center justify-center z-20 transition-all cursor-pointer ${isSelected ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs' : 'bg-white/80 backdrop-blur border-slate-300 text-transparent hover:border-slate-500'}`}
                >
                  <span className="material-symbols-outlined text-xs">check</span>
                </button>

                {/* Card Top Visual Preview */}
                <div className="bg-slate-50/60 h-48 relative flex items-center justify-center p-3 border-b border-slate-100 overflow-hidden">
                  
                  {/* Badges Container */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 z-20 items-start">
                    {activeTagText && (
                      <span className="bg-slate-800 text-white font-semibold tracking-wider text-[8px] uppercase px-2 py-0.5 rounded-md shadow-2xs">
                        {activeTagText}
                      </span>
                    )}
                    {product.isCombo && (
                      <span className="bg-emerald-800 text-white font-semibold tracking-wider text-[8px] uppercase px-2 py-0.5 rounded-md shadow-2xs">
                        Combo Pack
                      </span>
                    )}
                    {cardDiscountPct > 0 && (
                      <span className="bg-rose-600 text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded-md shadow-2xs">
                        {cardDiscountPct}% OFF
                      </span>
                    )}
                  </div>

                  {/* Hidden Overlay Tag */}
                  {isHidden && (
                    <span className="absolute bottom-2.5 right-2.5 bg-slate-800/80 backdrop-blur text-white text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md z-20">
                      Hidden
                    </span>
                  )}

                  {/* Clean Cover Image */}
                  <img 
                    src={product.imageSrc} 
                    alt={product.name} 
                    className="h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md z-10" 
                  />
                </div>

                {/* Card Info Body */}
                <div className="p-4 space-y-3.5 grow flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 block">
                          {product.category || 'Uncategorized'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 leading-snug mt-0.5">{product.name}</h4>
                      </div>
                      
                      <div className="flex flex-col items-end shrink-0">
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-[10px] line-through text-red-600 font-extrabold">
                            ₹{product.mrp}
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          ₹{product.price}/-
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 font-medium">{product.description}</p>
                    
                    {/* Combo constituent items summary */}
                    {product.isCombo && product.comboItems && (
                      <div className="pt-1">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Bundle Ingredients</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.comboItems.map((item, idx) => {
                            const matchedComp = products.find(p => p.id === item.productId);
                            return (
                              <span key={idx} className="bg-slate-100 text-slate-700 text-[9px] font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                                {item.quantity}x {matchedComp ? matchedComp.name : 'Flavor'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Storefront Visibility & Priority Quick Row */}
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50/80 rounded-xl border border-slate-200/80 text-[10px] font-semibold">
                    <button 
                      type="button"
                      onClick={() => handleToggleQuickVisibility(product)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${!isHidden ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-500'}`}
                    >
                      <span className="material-symbols-outlined text-xs">{!isHidden ? 'visibility' : 'visibility_off'}</span>
                      <span>{!isHidden ? 'Storefront Live' : 'Hidden'}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleToggleQuickBestSeller(product)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${product.isBestSeller ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      <span className="material-symbols-outlined text-xs">star</span>
                      <span>{product.isBestSeller ? 'Best Seller' : 'Normal'}</span>
                    </button>
                  </div>

                  {/* Performance Analytics Pill */}
                  <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/80 grid grid-cols-2 text-center text-xs">
                    <div className="border-r border-slate-200 pr-1">
                      <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider block">Units Sold</span>
                      <span className="font-bold text-slate-800">{analytics.unitsSold} units</span>
                    </div>
                    <div className="pl-1">
                      <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider block">Revenue</span>
                      <span className="font-bold text-slate-800">₹{analytics.revenue}</span>
                    </div>
                  </div>

                  {/* Stock Status Badge */}
                  <div>
                    {product.isCombo ? (
                      computedStock === 0 ? (
                        <div className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">report</span> Out of Stock
                        </div>
                      ) : (
                        <div className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">layers</span> Derived Stock: {computedStock} Packs
                        </div>
                      )
                    ) : (
                      computedStock === 0 ? (
                        <div className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">report</span> Out of Stock
                        </div>
                      ) : computedStock < 10 ? (
                        <div className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">warning</span> Low Stock: {computedStock} Units
                        </div>
                      ) : (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold uppercase tracking-wider py-2 rounded-xl flex items-center justify-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">check_circle</span> In Stock: {computedStock} Units
                        </div>
                      )
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button 
                      onClick={() => handleOpenEditProduct(product)}
                      className="flex items-center justify-center gap-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">tune</span> Configure
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex items-center justify-center gap-1 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-xl font-semibold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {!loading && filteredAndSortedProducts.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 font-semibold uppercase text-xs tracking-wider">
            No matching assets in inventory.
          </div>
        )}
      </div>

      {/* MODERN MINIMALIST STEPPER MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}></div>
          
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-xl flex flex-col relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-200/80">
            
            {/* Minimalist Header & Stepper Bar */}
            <header className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold uppercase tracking-tight text-slate-800">
                    {editingProduct ? 'Configure Catalog Asset' : 'New Catalog Product'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Step {stepperStep} of 4 • Studio Configurator</p>
                </div>

                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Minimalist Horizontal Stepper Bar */}
              <div className="grid grid-cols-4 gap-2 pt-0.5">
                {[
                  { step: 1, label: 'Format & Category', icon: 'category' },
                  { step: 2, label: 'Details & Pricing', icon: 'payments' },
                  { step: 3, label: 'Photos & Custom Tag', icon: 'photo_library' },
                  { step: 4, label: 'Review & Publish', icon: 'verified' }
                ].map(({ step, label, icon }) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setStepperStep(step as any)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${stepperStep === step ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs' : stepperStep > step ? 'bg-emerald-50/80 text-emerald-900 border-emerald-200/60' : 'bg-white text-slate-400 border-slate-200/80 hover:border-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${stepperStep === step ? 'bg-white text-emerald-900' : stepperStep > step ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {stepperStep > step ? '✓' : step}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider truncate hidden md:inline">{label}</span>
                  </button>
                ))}
              </div>
            </header>

            {/* Stepper Content Area */}
            <div className="p-6 overflow-y-auto grow custom-scrollbar">
              <form id="stepper-form" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="space-y-6">
                
                {/* STEP 1: FORMAT & CATEGORY */}
                {stepperStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto py-1">
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">Step 1 of 4</span>
                      <h4 className="text-base font-bold uppercase tracking-tight text-slate-800 pt-2">Select Asset Format & Category</h4>
                      <p className="text-xs text-slate-500 font-medium">Choose whether this item is a single jar/pouch or a multi-flavor combo bundle.</p>
                    </div>

                    {/* Format Selection Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setIsCombo(false)}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-3 cursor-pointer ${!isCombo ? 'border-emerald-600/50 bg-emerald-50/40 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${!isCombo ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <span className="material-symbols-outlined text-lg">local_drink</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">Single Product</span>
                          <span className="text-[11px] text-slate-400 font-medium block">Standalone Jar or 20g Pouch</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCombo(true);
                          setProdCategory('Combos');
                        }}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-3 cursor-pointer ${isCombo ? 'border-amber-500/50 bg-amber-50/40 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isCombo ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <span className="material-symbols-outlined text-lg">inventory_2</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-950 block">Combo Pack</span>
                          <span className="text-[11px] text-slate-400 font-medium block">Multi-Flavor Bundle</span>
                        </div>
                      </button>
                    </div>

                    {/* Category Selection Grid */}
                    <div className="space-y-2 pt-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block text-center">Storefront Category Location *</label>
                      <div className="grid grid-cols-3 gap-3">
                        {STOREFRONT_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setProdCategory(cat)}
                            className={`p-3 rounded-xl border text-center text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${prodCategory === cat ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}`}
                          >
                            <span>{cat}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Combo Ingredients Selector if Combo selected */}
                    {isCombo && (
                      <div className="space-y-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-200 animate-in fade-in">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 block">Select Flavor Products Inside Bundle *</span>
                          <p className="text-[10px] text-amber-800 font-medium pt-0.5">
                            A Combo Pack bundle contains multiple single flavor items (e.g. 1x Jar + 2x Pouches). Choose quantities for the items included in this combo box:
                          </p>
                        </div>

                        {products.filter(p => !p.isCombo).length === 0 ? (
                          <div className="p-3 bg-white rounded-xl border border-amber-200 text-center space-y-1">
                            <p className="text-xs font-semibold text-amber-900">No Standalone Products Found</p>
                            <p className="text-[10px] text-slate-500 font-medium">Please save your single Jars or Pouches first before creating a multi-flavor Combo Pack bundle.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                            {products.filter(p => !p.isCombo).map((p) => {
                              const qty = comboComponents[p.id] || 0;
                              return (
                                <div key={p.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-200/80">
                                  <div className="flex items-center gap-2.5">
                                    <img src={p.imageSrc} alt={p.name} className="w-8 h-8 object-contain p-0.5 bg-slate-50 rounded-lg" />
                                    <div>
                                      <span className="text-xs font-semibold text-slate-800 block">{p.name}</span>
                                      <span className="text-[9px] text-slate-400 font-medium block">₹{p.price}/- • {p.category}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center bg-amber-100/60 rounded-lg h-7 overflow-hidden border border-amber-300/60">
                                    <button 
                                      type="button"
                                      onClick={() => updateComboComponentQty(p.id, qty - 1)}
                                      className="w-7 h-full flex items-center justify-center text-amber-950 hover:bg-amber-200 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">remove</span>
                                    </button>
                                    <span className="w-6 text-center text-xs font-bold text-amber-950">{qty}</span>
                                    <button 
                                      type="button"
                                      onClick={() => updateComboComponentQty(p.id, qty + 1)}
                                      className="w-8 h-full flex items-center justify-center text-amber-950 hover:bg-amber-200 cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">add</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: DETAILS & PRICING */}
                {stepperStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-300 max-w-2xl mx-auto py-1">
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">Step 2 of 4</span>
                      <h4 className="text-base font-bold uppercase tracking-tight text-slate-800 pt-2">Product Details & Pricing</h4>
                      <p className="text-xs text-slate-500 font-medium">Specify asset title, flavor description, selling price, and MRP.</p>
                    </div>

                    {/* Title Input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Product Title *</label>
                        <span className="text-[10px] font-medium text-slate-400">{prodName.length}/60 chars</span>
                      </div>
                      <input 
                        type="text" 
                        required
                        maxLength={60}
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        placeholder="e.g. Blue Lagoon Botanical Jar" 
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                      />
                    </div>

                    {/* Description Textarea */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Flavor Description & Preparation Notes *</label>
                      <textarea 
                        required
                        rows={3}
                        value={prodDesc}
                        onChange={(e) => setProdDesc(e.target.value)}
                        placeholder="Describe flavor profile, ingredients, and preparation steps..." 
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 text-xs font-medium outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400 leading-relaxed custom-scrollbar"
                      ></textarea>
                    </div>

                    {/* Pricing & Stock Grid */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Selling Price (₹) *</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">₹</span>
                          <input 
                            type="number" 
                            required
                            value={prodPrice}
                            onChange={(e) => setProdPrice(Number(e.target.value))}
                            min={0}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-emerald-600 text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">MRP (Crossed Price)</label>
                          {discountPct > 0 && (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{discountPct}% OFF</span>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">₹</span>
                          <input 
                            type="number" 
                            value={prodMrp}
                            onChange={(e) => setProdMrp(Number(e.target.value))}
                            min={0}
                            placeholder="e.g. 599"
                            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-emerald-600 text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stock Units & Display Priority */}
                    <div className="grid grid-cols-2 gap-4">
                      {!isCombo ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Stock Units Available *</label>
                            <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full ${prodStock === 0 ? 'bg-rose-50 text-rose-700' : prodStock < 10 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                              {prodStock === 0 ? 'Out of Stock' : prodStock < 10 ? 'Low Stock' : 'In Stock'}
                            </span>
                          </div>
                          <input 
                            type="number" 
                            required
                            value={prodStock}
                            onChange={(e) => setProdStock(Number(e.target.value))}
                            min={0}
                            className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white text-slate-800"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Combo Stock Status</label>
                          <div className="bg-amber-50/60 border border-amber-900/10 rounded-xl px-4 py-2.5 text-xs font-medium text-amber-950 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-amber-600">auto_mode</span>
                            <span>Derived dynamically</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Display Priority Rank</label>
                        <input 
                          type="number" 
                          value={prodPriority}
                          onChange={(e) => setProdPriority(Number(e.target.value))}
                          className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-emerald-600 focus:bg-white text-slate-800"
                          title="Lower number renders first"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: PHOTOS & CUSTOM TAG */}
                {stepperStep === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-300 max-w-2xl mx-auto py-1">
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">Step 3 of 4</span>
                      <h4 className="text-base font-bold uppercase tracking-tight text-slate-800 pt-2">Photos & Marketing Tag Builder</h4>
                      <p className="text-xs text-slate-500 font-medium">Upload photos to Google Drive and configure a custom badge tag.</p>
                    </div>

                    {/* Google Drive Upload Box */}
                    <div className="border border-dashed border-slate-300 bg-slate-50/50 rounded-2xl p-5 text-center space-y-2 hover:bg-slate-50 transition-all relative">
                      <input 
                        type="file" 
                        multiple
                        accept="image/*"
                        onChange={handleSequentialPhotoUpload}
                        disabled={isUploadingToDrive}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      />

                      <div className="w-9 h-9 rounded-full bg-emerald-800 text-white mx-auto flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-lg">cloud_upload</span>
                      </div>

                      {isUploadingToDrive ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900 animate-pulse">{uploadStatusText || 'Uploading to Google Drive...'}</p>
                          <div className="w-48 h-1 bg-emerald-200 rounded-full mx-auto overflow-hidden">
                            <div className="w-full h-full bg-emerald-800 animate-pulse"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-800">Click or Drag & Drop Photos to Upload</p>
                          <p className="text-[10px] font-medium text-slate-400">Uploads directly to Google Drive • Supports multiple files</p>
                        </div>
                      )}
                    </div>

                    {/* Photo Sequence Manager */}
                    {uploadedPhotos.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Uploaded Photos ({uploadedPhotos.length})</label>
                          <button
                            type="button"
                            onClick={handleClearAllPhotos}
                            className="text-[9px] font-bold text-rose-600 uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Clear All
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                          {uploadedPhotos.map((photoUrl, idx) => (
                            <div key={idx} className={`relative p-2 bg-white border rounded-xl flex flex-col items-center justify-between gap-1 group shadow-2xs ${idx === 0 ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-slate-200'}`}>
                              <span className={`absolute top-1.5 left-1.5 text-[8px] font-mono px-1.5 py-0.5 rounded-md font-bold z-10 ${idx === 0 ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-white'}`}>
                                {idx === 0 ? '#1 COVER' : `#${idx + 1}`}
                              </span>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemovePhoto(idx);
                                }}
                                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center z-10 cursor-pointer transition-colors"
                              >
                                <span className="material-symbols-outlined text-[11px]">close</span>
                              </button>
                              <div className="w-full h-16 flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 mt-3">
                                <img src={photoUrl} alt={`Photo ${idx + 1}`} className="h-full object-contain" />
                              </div>
                              {idx > 0 && (
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleMakeCoverPhoto(idx);
                                  }}
                                  className="text-[8px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md transition-all cursor-pointer mt-1"
                                >
                                  Make Cover
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Tag Builder */}
                    <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-slate-600">label</span>
                          Custom Product Badge Tag
                        </span>
                        {prodCustomTag && (
                          <button
                            type="button"
                            onClick={() => setProdCustomTag('')}
                            className="text-[9px] font-bold text-rose-600 uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            Remove Tag
                          </button>
                        )}
                      </div>

                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {TAG_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setProdCustomTag(preset)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${prodCustomTag === preset ? 'bg-emerald-800 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'}`}
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>

                      <input 
                        type="text" 
                        value={prodCustomTag}
                        onChange={(e) => setProdCustomTag(e.target.value)}
                        placeholder="Or type custom badge text (e.g. Sugar Free, Limited Edition...)" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-emerald-600 text-slate-800 placeholder-slate-400"
                      />

                      {prodCustomTag.trim() && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 block">Placement Corner</label>
                            <select 
                              value={prodTagPosition}
                              onChange={(e) => setProdTagPosition(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-semibold text-slate-800 outline-none cursor-pointer"
                            >
                              <option value="top-left">Top-Left</option>
                              <option value="top-right">Top-Right</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 block">Color Style</label>
                            <select 
                              value={prodTagColor}
                              onChange={(e) => setProdTagColor(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-semibold text-slate-800 outline-none cursor-pointer"
                            >
                              <option value="black">Dark / Black</option>
                              <option value="emerald">Emerald Green</option>
                              <option value="amber">Gold / Amber</option>
                              <option value="rose">Rose Red</option>
                              <option value="indigo">Indigo Blue</option>
                              <option value="purple">Royal Purple</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & LIVE PREVIEW */}
                {stepperStep === 4 && (
                  <div className="space-y-5 animate-in fade-in duration-300 py-1">
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">Step 4 of 4</span>
                      <h4 className="text-base font-bold uppercase tracking-tight text-slate-800 pt-2">Final Review & Storefront Preview</h4>
                      <p className="text-xs text-slate-500 font-medium">Verify specs and inspect the live storefront card before publishing.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: Specs Breakdown Summary (6 cols) */}
                      <div className="lg:col-span-6 space-y-4">
                        <div className="p-4 sm:p-5 bg-slate-50/60 rounded-2xl border border-slate-200/80 space-y-3">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200/80 pb-2">Asset Specs Checklist</h5>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-400 font-medium">Format Type:</span>
                              <span className="font-semibold text-slate-800">{isCombo ? 'Multi-Flavor Combo Pack' : 'Single Product Item'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-400 font-medium">Category:</span>
                              <span className="font-semibold text-slate-800">{prodCategory}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-400 font-medium">Selling Price / MRP:</span>
                              <span className="font-semibold text-slate-800">₹{prodPrice}/- {prodMrp > prodPrice ? `(MRP ₹${prodMrp})` : ''}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-400 font-medium">Stock Available:</span>
                              <span className="font-semibold text-slate-800">{isCombo ? 'Dynamic Derived' : `${prodStock} units`}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100">
                              <span className="text-slate-400 font-medium">Custom Tag Badge:</span>
                              <span className="font-semibold text-slate-800">{prodCustomTag.trim() ? `${prodCustomTag} (${prodTagPosition})` : 'None'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400 font-medium">Photos Count:</span>
                              <span className="font-semibold text-slate-800">{uploadedPhotos.length} photos</span>
                            </div>
                          </div>
                        </div>

                        {/* Validation Lock Warning */}
                        {!isFormValid && (
                          <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs font-medium text-amber-950 flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-base text-amber-600 shrink-0">lock</span>
                            <span>Enter Title, Description, and Selling Price to unlock the Publish button.</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Live Storefront Card Preview (6 cols) */}
                      <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Frontstore Card Preview
                        </span>

                        <div className="w-full max-w-sm mx-auto shadow-lg rounded-2xl overflow-hidden border border-slate-200 bg-white">
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
                            customTag={prodCustomTag}
                            tagPosition={prodTagPosition}
                            tagColor={prodTagColor}
                            isCombo={isCombo}
                            comboImages={liveComboImages}
                            onAddToCart={() => {}}
                            onUpdateQuantity={() => {}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* STICKY FOOTER BAR WITH PROPER CORNER BUTTONS */}
            <footer className="p-4 px-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0 z-10">
              {/* Bottom-Left Corner: Cancel or Back */}
              {stepperStep === 1 ? (
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStepperStep((stepperStep - 1) as any)}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>Back</span>
                </button>
              )}

              {/* Bottom-Right Corner: Continue or Publish */}
              {stepperStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setStepperStep((stepperStep + 1) as any)}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              ) : (
                <button 
                  type="button"
                  disabled={!isFormValid}
                  onClick={handleSaveProduct}
                  className="bg-emerald-800 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs uppercase tracking-wider px-7 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {!isFormValid && <span className="material-symbols-outlined text-sm">lock</span>}
                  <span>{editingProduct ? 'Save Changes' : 'Publish Product'}</span>
                </button>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
