import React, { useState, useEffect } from 'react';
import { getToken, removeToken, getStoredUser, apiFetch } from './lib/api';
import { Expense, Income, Client, Budget, Profile } from './types/database';
import { Layout, TabType } from './components/Layout';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';

import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { IncomePage } from './pages/Income';
import { ClientBalances } from './pages/ClientBalances';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

import { getProfile, updateProfile } from './services/profiles';
import { getExpenses, createExpense, updateExpense, deleteExpense } from './services/expenses';
import { getIncome, createIncome, updateIncome, deleteIncome } from './services/income';
import { getClients, createClient, updateClient, deleteClient } from './services/clients';
import { getBudgets, createBudget, updateBudget, deleteBudget } from './services/budgets';

export const App: React.FC = () => {
  const [user, setUser] = useState<any | null>(() => getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = (message: string, type: ToastType) => {
    const newToast: ToastMessage = {
      id: Date.now().toString() + Math.random().toString(),
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth & Session Check
  useEffect(() => {
    const checkAuthSession = async () => {
      const token = getToken();
      if (token) {
        try {
          const data = await apiFetch('/api/auth/me');
          if (data && data.user) {
            setUser(data.user);
          }
        } catch (e) {
          console.warn('Invalid session or server offline on app launch:', e);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    };

    checkAuthSession();

    const handleSessionExpired = () => {
      setUser(null);
      showToast('Session expired. Please log in again.', 'warning');
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => window.removeEventListener('auth_session_expired', handleSessionExpired);
  }, []);

  // Fetch application data when authenticated
  const loadData = async () => {
    if (!getToken()) return;
    setDataLoading(true);
    try {
      const [profData, expData, incData, cliData, budData] = await Promise.all([
        getProfile().catch(() => null),
        getExpenses().catch(() => []),
        getIncome().catch(() => []),
        getClients().catch(() => []),
        getBudgets().catch(() => []),
      ]);

      setProfile(profData);
      setExpenses(expData);
      setIncome(incData);
      setClients(cliData);
      setBudgets(budData);
    } catch (err: any) {
      showToast('Error loading application data: ' + err.message, 'error');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setExpenses([]);
      setIncome([]);
      setClients([]);
      setBudgets([]);
      setProfile(null);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      removeToken();
      setUser(null);
      showToast('Signed out of session', 'info');
    }
  };

  // CRUD Handlers - Expenses
  const handleAddExpense = async (data: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    try {
      const created = await createExpense(user.id, data);
      setExpenses((prev) => [created, ...prev]);
      showToast('Expense added successfully to POCO server!', 'success');
    } catch (err: any) {
      showToast('Failed to add expense: ' + err.message, 'error');
      throw err;
    }
  };

  const handleUpdateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const updated = await updateExpense(id, updates);
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      showToast('Expense updated successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to update expense: ' + err.message, 'error');
      throw err;
    }
  };

  const handleDeleteExpense = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense record? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteExpense(id);
          setExpenses((prev) => prev.filter((e) => e.id !== id));
          showToast('Expense deleted from server', 'success');
        } catch (err: any) {
          showToast('Failed to delete expense: ' + err.message, 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // CRUD Handlers - Income
  const handleAddIncome = async (data: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    try {
      const created = await createIncome(user.id, data);
      setIncome((prev) => [created, ...prev]);
      loadData(); // reload to refresh client balances & totals
      showToast('Income record saved to POCO server!', 'success');
    } catch (err: any) {
      showToast('Failed to save income: ' + err.message, 'error');
      throw err;
    }
  };

  const handleUpdateIncome = async (id: string, updates: Partial<Income>) => {
    try {
      const updated = await updateIncome(id, updates);
      setIncome((prev) => prev.map((i) => (i.id === id ? updated : i)));
      showToast('Income record updated!', 'success');
    } catch (err: any) {
      showToast('Failed to update income: ' + err.message, 'error');
      throw err;
    }
  };

  const handleDeleteIncome = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Income Record',
      message: 'Are you sure you want to delete this income record?',
      onConfirm: async () => {
        try {
          await deleteIncome(id);
          setIncome((prev) => prev.filter((i) => i.id !== id));
          showToast('Income record deleted', 'success');
        } catch (err: any) {
          showToast('Failed to delete income: ' + err.message, 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // CRUD Handlers - Clients
  const handleAddClient = async (data: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'balance_amount'>) => {
    if (!user) return;
    try {
      const created = await createClient(user.id, data);
      setClients((prev) => [created, ...prev]);
      showToast('Client added to directory!', 'success');
    } catch (err: any) {
      showToast('Failed to add client: ' + err.message, 'error');
      throw err;
    }
  };

  const handleUpdateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const updated = await updateClient(id, updates);
      setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast('Client record updated!', 'success');
    } catch (err: any) {
      showToast('Failed to update client: ' + err.message, 'error');
      throw err;
    }
  };

  const handleDeleteClient = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Client',
      message: 'Are you sure you want to delete this client? All linked payment ledgers will also be deleted.',
      onConfirm: async () => {
        try {
          await deleteClient(id);
          setClients((prev) => prev.filter((c) => c.id !== id));
          showToast('Client deleted', 'success');
        } catch (err: any) {
          showToast('Failed to delete client: ' + err.message, 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // CRUD Handlers - Budgets
  const handleAddBudget = async (data: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    try {
      const created = await createBudget(user.id, data);
      setBudgets((prev) => [created, ...prev]);
      showToast('Budget target created!', 'success');
    } catch (err: any) {
      showToast('Failed to create budget: ' + err.message, 'error');
      throw err;
    }
  };

  const handleUpdateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const updated = await updateBudget(id, updates);
      setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
      showToast('Budget updated!', 'success');
    } catch (err: any) {
      showToast('Failed to update budget: ' + err.message, 'error');
      throw err;
    }
  };

  const handleDeleteBudget = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Budget Target',
      message: 'Are you sure you want to delete this category budget target?',
      onConfirm: async () => {
        try {
          await deleteBudget(id);
          setBudgets((prev) => prev.filter((b) => b.id !== id));
          showToast('Budget target deleted', 'success');
        } catch (err: any) {
          showToast('Failed to delete budget: ' + err.message, 'error');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Handler - Update Profile / Currency Settings
  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    try {
      const updated = await updateProfile(user.id, updates);
      setProfile(updated);
      showToast('Profile settings saved!', 'success');
    } catch (err: any) {
      showToast('Failed to update profile settings: ' + err.message, 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Connecting to POCO Phone Server...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={loadData} showToast={showToast} />;
  }

  return (
    <Layout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      user={user}
      onLogout={handleLogout}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {currentTab === 'dashboard' && (
        <Dashboard
          expenses={expenses}
          income={income}
          clients={clients}
          budgets={budgets}
          currency={profile?.currency || 'INR'}
          onNavigate={setCurrentTab}
          loading={dataLoading}
        />
      )}

      {currentTab === 'expenses' && (
        <Expenses
          expenses={expenses}
          currency={profile?.currency || 'INR'}
          onAddExpense={handleAddExpense}
          onUpdateExpense={handleUpdateExpense}
          onDeleteExpense={handleDeleteExpense}
          searchQuery={searchQuery}
          showToast={showToast}
        />
      )}

      {currentTab === 'income' && (
        <IncomePage
          income={income}
          clients={clients}
          currency={profile?.currency || 'INR'}
          onAddIncome={handleAddIncome}
          onUpdateIncome={handleUpdateIncome}
          onDeleteIncome={handleDeleteIncome}
          searchQuery={searchQuery}
          showToast={showToast}
        />
      )}

      {currentTab === 'clients' && (
        <ClientBalances
          clients={clients}
          currency={profile?.currency || 'INR'}
          onAddClient={handleAddClient}
          onUpdateClient={handleUpdateClient}
          onDeleteClient={handleDeleteClient}
          onRefresh={loadData}
          searchQuery={searchQuery}
          showToast={showToast}
        />
      )}

      {currentTab === 'budgets' && (
        <Budgets
          budgets={budgets}
          expenses={expenses}
          currency={profile?.currency || 'INR'}
          onAddBudget={handleAddBudget}
          onUpdateBudget={handleUpdateBudget}
          onDeleteBudget={handleDeleteBudget}
          showToast={showToast}
        />
      )}

      {currentTab === 'reports' && (
        <Reports
          expenses={expenses}
          income={income}
          clients={clients}
          currency={profile?.currency || 'INR'}
          appName={profile?.app_name || 'SalihPort'}
        />
      )}

      {currentTab === 'settings' && (
        <Settings
          profile={profile}
          user={user}
          onUpdateProfile={handleUpdateProfile}
          showToast={showToast}
        />
      )}

      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </Layout>
  );
};
