const API_BASE_URL = 'https://ninjaro-x-or1s.vercel.app/api';

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

// Orders API
export async function fetchOrders() {
  return apiRequest('/orders');
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
