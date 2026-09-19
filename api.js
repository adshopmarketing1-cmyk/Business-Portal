/**
 * ExpenseFlow API Service Layer
 * Communicates with POCO Phone Termux SQLite Backend
 */
const EXPENSEFLOW_API = (function () {
  let baseUrl = localStorage.getItem('expenseflow_api_base_url') || 'http://localhost:5000/api';

  function getBaseUrl() {
    return baseUrl;
  }

  function setBaseUrl(url) {
    let cleaned = url.trim().replace(/\/+$/, '');
    if (!cleaned.endsWith('/api')) {
      cleaned += '/api';
    }
    baseUrl = cleaned;
    localStorage.setItem('expenseflow_api_base_url', baseUrl);
    return baseUrl;
  }

  function getToken() {
    return localStorage.getItem('expenseflow_auth_token') || null;
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem('expenseflow_auth_token', token);
    } else {
      localStorage.removeItem('expenseflow_auth_token');
    }
  }

  function getUser() {
    const raw = localStorage.getItem('expenseflow_user_info');
    return raw ? JSON.parse(raw) : null;
  }

  function setUser(user) {
    if (user) {
      localStorage.setItem('expenseflow_user_info', JSON.stringify(user));
    } else {
      localStorage.removeItem('expenseflow_user_info');
    }
  }

  function logout() {
    localStorage.removeItem('expenseflow_auth_token');
    localStorage.removeItem('expenseflow_user_info');
    window.location.href = 'login.html';
  }

  async function request(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { ...options, headers };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 || response.status === 403) {
        if (!window.location.pathname.endsWith('login.html')) {
          logout();
        }
      }

      if (options.isBlob) {
        if (!response.ok) throw new Error('Download failed');
        return await response.blob();
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP Error ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }

  // Auth & Profile
  async function login(email, password) {
    const res = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res.token) setToken(res.token);
    if (res.user) setUser(res.user);
    return res;
  }

  async function register(name, email, password, company_name) {
    const res = await request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, company_name }) });
    if (res.token) setToken(res.token);
    if (res.user) setUser(res.user);
    return res;
  }

  async function getMe() {
    const res = await request('/auth/me');
    if (res.user) setUser(res.user);
    return res;
  }

  async function updateProfile(profileData) {
    const res = await request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) });
    if (res.user) setUser(res.user);
    return res;
  }

  async function checkHealth() {
    try {
      const res = await fetch(`${baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(4000) });
      if (res.ok) return await res.json();
      return { status: 'offline' };
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  }

  // Dashboard Stats
  async function getStats() {
    return await request('/dashboard/stats');
  }

  // Expenses API
  async function getExpenses(queryParams = {}) {
    const params = new URLSearchParams(queryParams);
    return await request(`/expenses?${params.toString()}`);
  }

  async function createExpense(data) {
    return await request('/expenses', { method: 'POST', body: JSON.stringify(data) });
  }

  async function updateExpense(id, data) {
    return await request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async function deleteExpense(id) {
    return await request(`/expenses/${id}`, { method: 'DELETE' });
  }

  // Income API
  async function getIncome() {
    return await request('/income');
  }

  async function createIncome(data) {
    return await request('/income', { method: 'POST', body: JSON.stringify(data) });
  }

  async function deleteIncome(id) {
    return await request(`/income/${id}`, { method: 'DELETE' });
  }

  // Clients API
  async function getClients() {
    return await request('/clients');
  }

  async function createClient(data) {
    return await request('/clients', { method: 'POST', body: JSON.stringify(data) });
  }

  async function updateClient(id, data) {
    return await request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async function deleteClient(id) {
    return await request(`/clients/${id}`, { method: 'DELETE' });
  }

  // Budgets API
  async function getBudgets() {
    return await request('/budgets');
  }

  async function createBudget(data) {
    return await request('/budgets', { method: 'POST', body: JSON.stringify(data) });
  }

  async function deleteBudget(id) {
    return await request(`/budgets/${id}`, { method: 'DELETE' });
  }

  return {
    getBaseUrl,
    setBaseUrl,
    getToken,
    setToken,
    getUser,
    setUser,
    logout,
    login,
    register,
    getMe,
    updateProfile,
    checkHealth,
    getStats,
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getIncome,
    createIncome,
    deleteIncome,
    getClients,
    createClient,
    updateClient,
    deleteClient,
    getBudgets,
    createBudget,
    deleteBudget
  };
})();

// Alias for compatibility
const CRM_API = EXPENSEFLOW_API;
