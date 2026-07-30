import { Order } from './store';

const API_BASE_URL = '/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nz_token');
}

export function setAuthToken(token: string | null): void {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('nz_token', token);
    } else {
      localStorage.removeItem('nz_token');
    }
  }
}

export function getLoggedInUser(): any | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('nz_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

export function setLoggedInUser(user: any | null): void {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('nz_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nz_user');
    }
  }
}

async function apiRequest(endpoint: string, options: any = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

// Auth API
export async function loginUser(credentials: any) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  setAuthToken(data.token);
  setLoggedInUser(data.user);
  return data.user;
}

export async function registerUser(userData: any) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  setAuthToken(data.token);
  setLoggedInUser(data.user);
  return data.user;
}

export function logoutUser() {
  setAuthToken(null);
  setLoggedInUser(null);
}

export async function getProfile() {
  const data = await apiRequest('/auth/me');
  setLoggedInUser(data.user);
  return data.user;
}

export async function addAddress(address: any) {
  return apiRequest('/auth/addresses', {
    method: 'POST',
    body: JSON.stringify(address)
  });
}

export async function deleteAddress(addressId: string) {
  return apiRequest(`/auth/addresses/${addressId}`, {
    method: 'DELETE'
  });
}

// Products API
export async function fetchProducts() {
  try {
    return await apiRequest('/products');
  } catch (e) {
    console.warn('Backend products not reachable. Using fallback local storage products.');
    throw e;
  }
}

export async function createProduct(prodData: any) {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(prodData)
  });
}

export async function updateProduct(productId: string, prodData: any) {
  return apiRequest(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(prodData)
  });
}

export async function deleteProduct(productId: string) {
  return apiRequest(`/products/${productId}`, {
    method: 'DELETE'
  });
}

export async function fetchProductById(productId: string) {
  return apiRequest(`/products/${productId}`);
}

export async function addProductReview(productId: string, reviewData: { userName: string; rating: number; comment: string }) {
  return apiRequest(`/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData)
  });
}

// Orders API
export interface FetchOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  channel?: string;
  all?: boolean;
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchOrders(params?: FetchOrdersParams): Promise<PaginatedOrdersResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.search) queryParams.set('search', params.search);
  if (params?.status && params.status !== 'All' && params.status !== 'all') queryParams.set('status', params.status);
  if (params?.channel && params.channel !== 'All' && params.channel !== 'all') queryParams.set('channel', params.channel.toLowerCase());
  if (params?.all) queryParams.set('all', 'true');

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/orders?${queryString}` : '/orders';
  const res = await apiRequest(endpoint);

  // Backwards compatibility check
  if (Array.isArray(res)) {
    return {
      orders: res,
      total: res.length,
      page: 1,
      limit: res.length || 20,
      totalPages: 1
    };
  }

  return {
    orders: res.orders || [],
    total: res.total || 0,
    page: res.page || 1,
    limit: res.limit || 20,
    totalPages: res.totalPages || 1
  };
}

export async function downloadBackendOrdersCSV(params?: { timeframe?: string; startDate?: string; endDate?: string; channel?: string; status?: string; search?: string }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('nz_token') : null;
  const queryParams = new URLSearchParams();
  if (params?.timeframe) queryParams.set('timeframe', params.timeframe);
  if (params?.startDate) queryParams.set('startDate', params.startDate);
  if (params?.endDate) queryParams.set('endDate', params.endDate);
  if (params?.channel) queryParams.set('channel', params.channel);
  if (params?.status) queryParams.set('status', params.status);
  if (params?.search) queryParams.set('search', params.search);

  const url = `${API_BASE_URL}/orders/export/csv?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error('Failed to download CSV from server');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `Ninjaro_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}

export async function createPaymentOrder(total: number) {
  return apiRequest('/orders/payment', {
    method: 'POST',
    body: JSON.stringify({ total })
  });
}

export async function placeOrder(orderData: any) {
  return apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
}

export async function trackOrderById(orderId: string) {
  return apiRequest(`/orders/track/${orderId}`);
}

export async function updateOrderAdmin(orderId: string, statusData: any) {
  return apiRequest(`/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(statusData)
  });
}

// Upload API for Google Drive
export async function uploadImagesToDrive(images: (string | { base64: string; fileName?: string })[]) {
  return apiRequest('/upload/drive', {
    method: 'POST',
    body: JSON.stringify({ images })
  });
}

export async function deleteImagesFromDrive(urls: string[]) {
  return apiRequest('/upload/drive', {
    method: 'DELETE',
    body: JSON.stringify({ urls })
  });
}

// Settings API for Top Announcement Banner
export async function fetchTopOfferText(): Promise<string> {
  const defaultText = '🎁 Free Shipping Order Above ₹249 & Apply 5% Discount on Checkout';
  try {
    const res = await apiRequest('/settings/top-offer');
    if (res && res.topOfferText) {
      if (typeof window !== 'undefined') localStorage.setItem('nz_top_offer', res.topOfferText);
      return res.topOfferText;
    }
  } catch (err) {
    // Silent fallback when API is initializing or offline
  }
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('nz_top_offer');
    if (cached) return cached;
  }
  return defaultText;
}

export async function updateTopOfferText(topOfferText: string): Promise<{ success: boolean; topOfferText: string }> {
  if (typeof window !== 'undefined') localStorage.setItem('nz_top_offer', topOfferText);
  try {
    return await apiRequest('/settings/top-offer', {
      method: 'PUT',
      body: JSON.stringify({ topOfferText })
    });
  } catch (err) {
    return { success: true, topOfferText };
  }
}

// Settings API for Top Navbar Header Ticker
export async function fetchHeaderTickerText(): Promise<string> {
  const defaultText = '🎁 Special Launch Offer: Free Express Shipping on all orders above ₹249!';
  try {
    const res = await apiRequest('/settings/header-ticker');
    if (res && res.headerTickerText) {
      if (typeof window !== 'undefined') localStorage.setItem('nz_header_ticker', res.headerTickerText);
      return res.headerTickerText;
    }
  } catch (err) {
    // Silent fallback when API is initializing or offline
  }
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('nz_header_ticker');
    if (cached) return cached;
  }
  return defaultText;
}

export async function updateHeaderTickerText(headerTickerText: string): Promise<{ success: boolean; headerTickerText: string }> {
  if (typeof window !== 'undefined') localStorage.setItem('nz_header_ticker', headerTickerText);
  try {
    return await apiRequest('/settings/header-ticker', {
      method: 'PUT',
      body: JSON.stringify({ headerTickerText })
    });
  } catch (err) {
    return { success: true, headerTickerText };
  }
}

