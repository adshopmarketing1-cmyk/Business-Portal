/**
 * ExpenseFlow Master Application Controller
 * Manages Dashboard, Expenses, Income, Client Ledgers, Budgets, Reports & Settings
 */
document.addEventListener('DOMContentLoaded', () => {
  // Auth Guard
  if (!EXPENSEFLOW_API.getToken() && !window.location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
    return;
  }

  // Active Tab State
  let currentTab = 'dashboard';
  let userProfile = EXPENSEFLOW_API.getUser() || {};
  let currentCurrency = userProfile.currency || 'INR';

  // Data Caches
  let expensesData = [];
  let incomeData = [];
  let clientsData = [];
  let budgetsData = [];

  // Edit State Tracking
  let editingId = null;

  // DOM Elements
  const tabTitle = document.getElementById('tabTitle');
  const globalSearchInput = document.getElementById('globalSearchInput');
  const userDisplay = document.getElementById('userDisplay');
  const serverStatusPill = document.getElementById('serverStatusPill');

  // Sidebar & Navigation
  const navItems = document.querySelectorAll('.nav-item');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');

  // Toast System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span style="font-size:1.1rem">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function escapeHtml(str) {
    return (str || '').toString().replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  function formatMoney(amount) {
    const num = Number(amount || 0);
    const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ' };
    const sym = symbols[currentCurrency] || `${currentCurrency} `;
    return `${sym}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Sync Theme Accent & Branding from Profile
  function applyBranding(user) {
    if (!user) return;
    if (user.currency) currentCurrency = user.currency;

    const brandNameElems = document.querySelectorAll('.brand-name-display');
    const brandSubElems = document.querySelectorAll('.brand-sub-display');
    const brandLogoElems = document.querySelectorAll('.brand-logo-display');

    brandNameElems.forEach((el) => (el.textContent = user.app_name || 'Salih Expense'));
    brandSubElems.forEach((el) => (el.textContent = user.app_subtitle || 'Business Suite'));

    if (user.app_logo) {
      brandLogoElems.forEach((img) => (img.src = user.app_logo));
    }

    // Apply Accent Theme Class to body
    document.body.className = `theme-${user.accent_color || 'indigo'}`;

    if (user.app_name) {
      document.title = user.app_subtitle ? `${user.app_name} | ${user.app_subtitle}` : user.app_name;
    }
  }

  // Health Status Polling
  async function pollHealth() {
    if (!serverStatusPill) return;
    const dot = serverStatusPill.querySelector('.dot');
    const label = serverStatusPill.querySelector('.status-text');

    const health = await EXPENSEFLOW_API.checkHealth();
    if (health.status === 'online') {
      dot.className = 'dot online';
      label.textContent = 'POCO Termux Connected';
    } else {
      dot.className = 'dot offline';
      label.textContent = 'POCO Offline';
    }
  }

  // Navigation Handler
  function switchTab(tabId) {
    currentTab = tabId;
    navItems.forEach((item) => {
      if (item.dataset.tab === tabId) item.classList.add('active');
      else item.classList.remove('active');
    });

    // Hide all tab views
    document.querySelectorAll('.tab-view').forEach((view) => (view.style.display = 'none'));

    // Show active tab view
    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) activeView.style.display = 'block';

    if (tabTitle) {
      const activeNav = Array.from(navItems).find((n) => n.dataset.tab === tabId);
      if (activeNav) tabTitle.textContent = activeNav.textContent.trim();
    }

    if (mobileDrawer) mobileDrawer.classList.remove('active');

    // Reload data for active tab
    loadTabData();
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => mobileDrawer.classList.add('active'));
  }
  if (closeDrawerBtn && mobileDrawer) {
    closeDrawerBtn.addEventListener('click', () => mobileDrawer.classList.remove('active'));
  }

  // Global Search Handler
  if (globalSearchInput) {
    let searchTimer;
    globalSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const query = e.target.value.trim();
        if (query) {
          switchTab('expenses');
          const searchInput = document.getElementById('expenseSearch');
          if (searchInput) {
            searchInput.value = query;
            renderExpenses();
          }
        }
      }, 300);
    });
  }

  // Data Fetching Central Dispatcher
  async function loadTabData() {
    try {
      if (currentTab === 'dashboard') await renderDashboard();
      else if (currentTab === 'expenses') await renderExpenses();
      else if (currentTab === 'income') await renderIncome();
      else if (currentTab === 'clients') await renderClients();
      else if (currentTab === 'budgets') await renderBudgets();
      else if (currentTab === 'reports') await renderReports();
      else if (currentTab === 'settings') renderSettings();
    } catch (err) {
      showToast(err.message || 'Error loading tab data', 'error');
    }
  }

  // =========================================================================
  // 1. DASHBOARD TAB
  // =========================================================================
  async function renderDashboard() {
    const [statsRes, expRes, incRes, cliRes, budRes] = await Promise.all([
      EXPENSEFLOW_API.getStats(),
      EXPENSEFLOW_API.getExpenses(),
      EXPENSEFLOW_API.getIncome(),
      EXPENSEFLOW_API.getClients(),
      EXPENSEFLOW_API.getBudgets()
    ]);

    if (expRes.success) expensesData = expRes.data;
    if (incRes.success) incomeData = incRes.data;
    if (cliRes.success) clientsData = cliRes.data;
    if (budRes.success) budgetsData = budRes.data;

    const s = statsRes.stats || {};

    // Update KPI Cards
    document.getElementById('dashTotalExpenses').textContent = formatMoney(s.totalExpenses);
    document.getElementById('dashIncoming').textContent = formatMoney(s.totalIncome);
    document.getElementById('dashClientBalance').textContent = formatMoney(s.totalClientBalance);
    document.getElementById('dashTotalBudget').textContent = formatMoney(s.totalBudget);
    document.getElementById('dashNetCashflow').textContent = formatMoney(s.netCashflow);
    document.getElementById('dashRemainingBudget').textContent = formatMoney(s.remainingBudget);

    // Credit Card Outstanding Calculation
    const ccSpent = expensesData
      .filter((e) => e.payment_method === 'Credit Card' && !e.category.includes('Credit Card Bill'))
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const ccPaid = expensesData
      .filter((e) => e.category.includes('Credit Card Bill') || e.description?.toLowerCase().includes('credit card bill'))
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const ccBalance = Math.max(0, ccSpent - ccPaid);
    document.getElementById('dashCcBill').textContent = formatMoney(ccBalance);

    // Render Canvas Pie Chart (Category Expenses)
    renderCategoryChart();

    // Render Recent Activity List
    const recentList = document.getElementById('dashRecentList');
    if (recentList) {
      const recent = [...expensesData.map((e) => ({ ...e, type: 'expense' })), ...incomeData.map((i) => ({ ...i, type: 'income' }))]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      if (recent.length === 0) {
        recentList.innerHTML = `<div class="empty-state">No financial transactions logged yet.</div>`;
      } else {
        recentList.innerHTML = recent.map((tx) => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; border-bottom:1px solid var(--border-color);">
            <div>
              <div style="font-weight:600; font-size:0.85rem;">${escapeHtml(tx.description || tx.category)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${tx.date} • ${tx.type === 'expense' ? tx.payment_method : 'Revenue'}</div>
            </div>
            <div style="font-weight:700; font-size:0.9rem; color: ${tx.type === 'expense' ? 'var(--danger)' : 'var(--success)'};">
              ${tx.type === 'expense' ? '-' : '+'}${formatMoney(tx.amount)}
            </div>
          </div>
        `).join('');
      }
    }
  }

  function renderCategoryChart() {
    const canvas = document.getElementById('categoryPieCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const categoryMap = {};
    expensesData.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
    });

    const categories = Object.keys(categoryMap);
    const total = Object.values(categoryMap).reduce((a, b) => a + b, 0);

    if (categories.length === 0 || total === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No expense data to display', canvas.width / 2, canvas.height / 2);
      return;
    }

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
    let startAngle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    categories.forEach((cat, index) => {
      const sliceAngle = (categoryMap[cat] / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Inner Donut Cutout
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.55, 0, 2 * Math.PI);
    ctx.fillStyle = '#0F111A';
    ctx.fill();
  }

  // =========================================================================
  // 2. MY EXPENSES TAB
  // =========================================================================
  async function renderExpenses() {
    const category = document.getElementById('expenseCategoryFilter')?.value || 'All';
    const method = document.getElementById('expenseMethodFilter')?.value || 'All';
    const search = document.getElementById('expenseSearch')?.value || '';

    const res = await EXPENSEFLOW_API.getExpenses({ category, payment_method: method, search });
    if (res.success) expensesData = res.data;

    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;

    if (expensesData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No expense records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = expensesData.map((e) => `
      <tr>
        <td><strong>${escapeHtml(e.expense_id)}</strong></td>
        <td>
          <div style="font-weight:600;">${escapeHtml(e.description || e.category)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(e.notes || '')}</div>
        </td>
        <td><span class="badge" style="background:rgba(255,255,255,0.06); color:var(--text-main);">${escapeHtml(e.category)}</span></td>
        <td><strong style="color:var(--danger);">${formatMoney(e.amount)}</strong></td>
        <td><span class="source-tag">${escapeHtml(e.payment_method)}</span></td>
        <td style="font-size:0.8rem; color:var(--text-dim);">${e.date}</td>
        <td>
          <button class="btn btn-secondary btn-icon" onclick="editExpense(${e.id})">✏️</button>
          <button class="btn btn-danger btn-icon" onclick="deleteExpense(${e.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  window.editExpense = function (id) {
    const exp = expensesData.find((e) => e.id === id);
    if (!exp) return;
    editingId = id;
    document.getElementById('expModalTitle').textContent = `Edit Expense ${exp.expense_id}`;
    document.getElementById('expAmount').value = exp.amount;
    document.getElementById('expCategory').value = exp.category;
    document.getElementById('expDescription').value = exp.description || '';
    document.getElementById('expMethod').value = exp.payment_method || 'UPI';
    document.getElementById('expDate').value = exp.date;
    document.getElementById('expNotes').value = exp.notes || '';
    document.getElementById('expenseModal').classList.add('active');
  };

  window.deleteExpense = async function (id) {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await EXPENSEFLOW_API.deleteExpense(id);
        showToast('Expense record deleted.', 'success');
        renderExpenses();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  // =========================================================================
  // 3. INCOMING AMOUNT TAB
  // =========================================================================
  async function renderIncome() {
    const [incRes, cliRes] = await Promise.all([EXPENSEFLOW_API.getIncome(), EXPENSEFLOW_API.getClients()]);
    if (incRes.success) incomeData = incRes.data;
    if (cliRes.success) clientsData = cliRes.data;

    const tbody = document.getElementById('incomeTableBody');
    if (!tbody) return;

    // Populate Client Select Dropdown in Income Modal
    const clientSelect = document.getElementById('incClientId');
    if (clientSelect) {
      clientSelect.innerHTML = `<option value="">General Income (No Client)</option>` +
        clientsData.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    }

    if (incomeData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No income records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = incomeData.map((i) => `
      <tr>
        <td><strong>${escapeHtml(i.income_id)}</strong></td>
        <td>
          <div style="font-weight:600;">${escapeHtml(i.description || 'Income Payment')}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(i.notes || '')}</div>
        </td>
        <td>${escapeHtml(i.client_name || 'General Source')}</td>
        <td><strong style="color:var(--success);">${formatMoney(i.amount)}</strong></td>
        <td><span class="badge badge-${i.payment_status}">${escapeHtml(i.payment_status)}</span></td>
        <td style="font-size:0.8rem; color:var(--text-dim);">${i.date}</td>
        <td>
          <button class="btn btn-danger btn-icon" onclick="deleteIncome(${i.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  window.deleteIncome = async function (id) {
    if (confirm('Delete this income record?')) {
      try {
        await EXPENSEFLOW_API.deleteIncome(id);
        showToast('Income record deleted.', 'success');
        renderIncome();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  // =========================================================================
  // 4. CLIENT AMOUNT BALANCE TAB
  // =========================================================================
  async function renderClients() {
    const res = await EXPENSEFLOW_API.getClients();
    if (res.success) clientsData = res.data;

    const grid = document.getElementById('clientCardsGrid');
    if (!grid) return;

    if (clientsData.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">No client ledgers created yet.</div>`;
      return;
    }

    grid.innerHTML = clientsData.map((c) => {
      const tot = Number(c.total_amount || 0);
      const pd = Number(c.paid_amount || 0);
      const bal = Number(c.balance_amount || 0);
      const pct = tot > 0 ? Math.min(100, Math.round((pd / tot) * 100)) : 100;

      return `
        <div class="glass-panel client-card">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:start;">
              <div>
                <h3 style="font-size:1.1rem; font-weight:700;">${escapeHtml(c.name)}</h3>
                <div style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(c.email || c.phone || 'No contact')}</div>
              </div>
              <span class="badge badge-${c.status}">${c.status}</span>
            </div>

            <div style="margin-top:1rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:600; margin-bottom:0.3rem;">
                <span>Payment Progress</span>
                <span style="color: ${bal === 0 ? 'var(--success)' : 'var(--warning)'};">${pct}% Paid</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill ${bal === 0 ? 'progress-green' : 'progress-amber'}" style="width:${pct}%;"></div>
              </div>
            </div>

            <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border-color); display:flex; flex-direction:column; gap:0.4rem; font-size:0.85rem;">
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--text-muted);">Total Billed:</span>
                <strong>${formatMoney(tot)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--text-muted);">Paid Amount:</span>
                <strong style="color:var(--success);">${formatMoney(pd)}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.95rem; font-weight:700; padding-top:0.4rem; border-top:1px solid rgba(255,255,255,0.05);">
                <span>Balance Due:</span>
                <strong style="color: ${bal > 0 ? 'var(--warning)' : 'var(--success)'};">${formatMoney(bal)}</strong>
              </div>
            </div>
          </div>

          <div style="display:flex; gap:0.5rem; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border-color);">
            ${bal > 0 ? `<button class="btn btn-primary btn-icon" style="flex:1;" onclick="openReceivePayment(${c.id})">💳 Receive Payment</button>` : ''}
            <button class="btn btn-secondary btn-icon" onclick="editClient(${c.id})">✏️ Edit</button>
            <button class="btn btn-danger btn-icon" onclick="deleteClient(${c.id})">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.openReceivePayment = function (clientId) {
    const c = clientsData.find((cli) => cli.id === clientId);
    if (!c) return;
    document.getElementById('recClientId').value = c.id;
    document.getElementById('recClientName').textContent = c.name;
    document.getElementById('recBalanceDue').textContent = formatMoney(c.balance_amount);
    document.getElementById('recAmount').value = c.balance_amount;
    document.getElementById('receivePaymentModal').classList.add('active');
  };

  window.editClient = function (id) {
    const c = clientsData.find((cli) => cli.id === id);
    if (!c) return;
    editingId = id;
    document.getElementById('cliModalTitle').textContent = `Edit Client ${c.client_id}`;
    document.getElementById('cliName').value = c.name;
    document.getElementById('cliEmail').value = c.email || '';
    document.getElementById('cliPhone').value = c.phone || '';
    document.getElementById('cliTotalAmount').value = c.total_amount;
    document.getElementById('cliPaidAmount').value = c.paid_amount;
    document.getElementById('cliStatus').value = c.status || 'active';
    document.getElementById('clientModal').classList.add('active');
  };

  window.deleteClient = async function (id) {
    if (confirm('Delete this client ledger record?')) {
      try {
        await EXPENSEFLOW_API.deleteClient(id);
        showToast('Client ledger deleted.', 'success');
        renderClients();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  // =========================================================================
  // 5. BUDGETS TAB
  // =========================================================================
  async function renderBudgets() {
    const [budRes, expRes] = await Promise.all([EXPENSEFLOW_API.getBudgets(), EXPENSEFLOW_API.getExpenses()]);
    if (budRes.success) budgetsData = budRes.data;
    if (expRes.success) expensesData = expRes.data;

    const list = document.getElementById('budgetsList');
    if (!list) return;

    if (budgetsData.length === 0) {
      list.innerHTML = `<div class="empty-state">No category budget limits allocated yet.</div>`;
      return;
    }

    list.innerHTML = budgetsData.map((b) => {
      const spent = expensesData
        .filter((e) => e.category === b.category)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const limit = Number(b.budget_amount || 0);
      const remaining = Math.max(0, limit - spent);
      const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
      const progressClass = pct >= 100 ? 'progress-red' : pct >= 75 ? 'progress-amber' : 'progress-green';

      return `
        <div class="glass-panel" style="padding:1.25rem; margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h3 style="font-size:1.1rem; font-weight:700;">${escapeHtml(b.category)} Budget</h3>
              <span style="font-size:0.78rem; color:var(--text-muted);">${b.start_date || 'Monthly'} to ${b.end_date || 'Ongoing'}</span>
            </div>
            <div style="text-align:right;">
              <span style="font-size:1.2rem; font-weight:800; color:${pct >= 100 ? 'var(--danger)' : 'var(--text-main)'};">${pct}% Used</span>
              ${pct >= 100 ? `<div style="font-size:0.75rem; color:var(--danger); font-weight:700;">⚠️ OVER BUDGET</div>` : ''}
            </div>
          </div>

          <div style="margin-top:1rem;">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill ${progressClass}" style="width:${pct}%;"></div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border-color); text-align:center;">
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Allocated Limit</div>
              <strong style="font-size:1rem;">${formatMoney(limit)}</strong>
            </div>
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Amount Spent</div>
              <strong style="font-size:1rem; color:var(--danger);">${formatMoney(spent)}</strong>
            </div>
            <div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Remaining</div>
              <strong style="font-size:1rem; color:var(--success);">${formatMoney(remaining)}</strong>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // 6. REPORTS TAB
  // =========================================================================
  async function renderReports() {
    const [statsRes, expRes, incRes] = await Promise.all([
      EXPENSEFLOW_API.getStats(),
      EXPENSEFLOW_API.getExpenses(),
      EXPENSEFLOW_API.getIncome()
    ]);

    const s = statsRes.stats || {};
    document.getElementById('repTotalRevenue').textContent = formatMoney(s.totalIncome);
    document.getElementById('repTotalExpenses').textContent = formatMoney(s.totalExpenses);
    document.getElementById('repNetSavings').textContent = formatMoney(s.netCashflow);
    document.getElementById('repClientBalance').textContent = formatMoney(s.totalClientBalance);
  }

  // =========================================================================
  // 7. SETTINGS & BRANDING TAB
  // =========================================================================
  function renderSettings() {
    const user = EXPENSEFLOW_API.getUser();
    if (!user) return;
    document.getElementById('setFullName').value = user.name || '';
    document.getElementById('setEmail').value = user.email || '';
    document.getElementById('setPhone').value = user.phone || '';
    document.getElementById('setCompanyName').value = user.company_name || '';
    document.getElementById('setCurrency').value = user.currency || 'INR';

    document.getElementById('setAppName').value = user.app_name || 'Salih Expense';
    document.getElementById('setAppSubtitle').value = user.app_subtitle || 'Business Suite';
    document.getElementById('setAccentColor').value = user.accent_color || 'indigo';
  }

  // Settings Profile Save Form
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          name: document.getElementById('setFullName').value,
          phone: document.getElementById('setPhone').value,
          company_name: document.getElementById('setCompanyName').value,
          currency: document.getElementById('setCurrency').value,
          app_name: document.getElementById('setAppName').value,
          app_subtitle: document.getElementById('setAppSubtitle').value,
          accent_color: document.getElementById('setAccentColor').value
        };

        const res = await EXPENSEFLOW_API.updateProfile(payload);
        applyBranding(res.user);
        showToast('Settings & App Identity updated!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Modal Submit Event Listeners
  // 1. Add / Edit Expense Form
  const expenseForm = document.getElementById('expenseForm');
  if (expenseForm) {
    expenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        amount: parseFloat(document.getElementById('expAmount').value) || 0,
        category: document.getElementById('expCategory').value,
        description: document.getElementById('expDescription').value,
        payment_method: document.getElementById('expMethod').value,
        date: document.getElementById('expDate').value,
        notes: document.getElementById('expNotes').value
      };

      try {
        if (editingId) {
          await EXPENSEFLOW_API.updateExpense(editingId, data);
          showToast('Expense record updated!', 'success');
        } else {
          await EXPENSEFLOW_API.createExpense(data);
          showToast('New expense saved!', 'success');
        }
        document.getElementById('expenseModal').classList.remove('active');
        editingId = null;
        renderExpenses();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 2. Add Income Form
  const incomeForm = document.getElementById('incomeForm');
  if (incomeForm) {
    incomeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        client_id: document.getElementById('incClientId').value || null,
        amount: parseFloat(document.getElementById('incAmount').value) || 0,
        description: document.getElementById('incDescription').value,
        date: document.getElementById('incDate').value,
        payment_status: document.getElementById('incStatus').value,
        notes: document.getElementById('incNotes').value
      };

      try {
        await EXPENSEFLOW_API.createIncome(data);
        showToast('Income record saved!', 'success');
        document.getElementById('incomeModal').classList.remove('active');
        renderIncome();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 3. Add / Edit Client Form
  const clientForm = document.getElementById('clientForm');
  if (clientForm) {
    clientForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('cliName').value,
        email: document.getElementById('cliEmail').value,
        phone: document.getElementById('cliPhone').value,
        total_amount: parseFloat(document.getElementById('cliTotalAmount').value) || 0,
        paid_amount: parseFloat(document.getElementById('cliPaidAmount').value) || 0,
        status: document.getElementById('cliStatus').value
      };

      try {
        if (editingId) {
          await EXPENSEFLOW_API.updateClient(editingId, data);
          showToast('Client ledger updated!', 'success');
        } else {
          await EXPENSEFLOW_API.createClient(data);
          showToast('New client added!', 'success');
        }
        document.getElementById('clientModal').classList.remove('active');
        editingId = null;
        renderClients();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 4. Receive Client Payment Form
  const receivePaymentForm = document.getElementById('receivePaymentForm');
  if (receivePaymentForm) {
    receivePaymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const clientId = document.getElementById('recClientId').value;
      const recAmount = parseFloat(document.getElementById('recAmount').value) || 0;

      try {
        await EXPENSEFLOW_API.createIncome({
          client_id: clientId,
          amount: recAmount,
          description: `Payment from Client`,
          date: new Date().toISOString().slice(0, 10),
          payment_status: 'paid'
        });

        showToast('Client payment recorded & ledger updated!', 'success');
        document.getElementById('receivePaymentModal').classList.remove('active');
        renderClients();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 5. Add Budget Form
  const budgetForm = document.getElementById('budgetForm');
  if (budgetForm) {
    budgetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        category: document.getElementById('budCategory').value,
        budget_amount: parseFloat(document.getElementById('budAmount').value) || 0,
        start_date: document.getElementById('budStartDate').value || null,
        end_date: document.getElementById('budEndDate').value || null
      };

      try {
        await EXPENSEFLOW_API.createBudget(data);
        showToast('Budget allocated successfully!', 'success');
        document.getElementById('budgetModal').classList.remove('active');
        renderBudgets();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Modal Open Triggers
  document.getElementById('addExpenseBtn')?.addEventListener('click', () => {
    editingId = null;
    document.getElementById('expenseForm').reset();
    document.getElementById('expDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('expenseModal').classList.add('active');
  });

  document.getElementById('addIncomeBtn')?.addEventListener('click', () => {
    document.getElementById('incomeForm').reset();
    document.getElementById('incDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('incomeModal').classList.add('active');
  });

  document.getElementById('addClientBtn')?.addEventListener('click', () => {
    editingId = null;
    document.getElementById('clientForm').reset();
    document.getElementById('clientModal').classList.add('active');
  });

  document.getElementById('addBudgetBtn')?.addEventListener('click', () => {
    document.getElementById('budgetForm').reset();
    document.getElementById('budgetModal').classList.add('active');
  });

  // Modal Close Buttons
  document.querySelectorAll('.close-modal-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.remove('active'));
    });
  });

  // API Config Modal Setup
  const configApiBtn = document.getElementById('configApiBtn');
  const configModal = document.getElementById('configModal');
  if (configApiBtn && configModal) {
    configApiBtn.addEventListener('click', () => {
      document.getElementById('apiInput').value = EXPENSEFLOW_API.getBaseUrl();
      configModal.classList.add('active');
    });

    document.getElementById('configForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const newUrl = document.getElementById('apiInput').value;
      EXPENSEFLOW_API.setBaseUrl(newUrl);
      configModal.classList.remove('active');
      showToast(`API URL updated to ${newUrl}`, 'info');
      pollHealth();
      loadTabData();
    });
  }

  // Logout Trigger
  document.getElementById('logoutBtn')?.addEventListener('click', () => EXPENSEFLOW_API.logout());

  // Initialization
  applyBranding(userProfile);
  pollHealth();
  setInterval(pollHealth, 15000);
  switchTab('dashboard');
});
