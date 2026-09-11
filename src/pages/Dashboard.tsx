import React, { useState } from 'react';
import {
  Receipt,
  TrendingUp,
  Users,
  PieChart as PieChartIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CreditCard,
  Building2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Expense, Income, Client, Budget } from '../types/database';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface DashboardProps {
  expenses: Expense[];
  income: Income[];
  clients: Client[];
  budgets: Budget[];
  currency: string;
  onNavigate: (tab: 'expenses' | 'income' | 'clients' | 'budgets') => void;
  onAddExpense?: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  expenses,
  income,
  clients,
  budgets,
  currency,
  onNavigate,
  onAddExpense,
}) => {
  // Pay Credit Card Bill Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Debit Card' | 'Other'>('UPI');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('Credit Card Bill Repayment');
  const [payLoading, setPayLoading] = useState(false);

  // Calculated Metrics from live Database Records
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalIncoming = income.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalClientBalance = clients.reduce((sum, item) => sum + Number(item.balance_amount || 0), 0);
  const totalBudget = budgets.reduce((sum, item) => sum + Number(item.budget_amount || 0), 0);

  // Credit Card Outstanding Calculation:
  // 1. Total spent via Credit Card (excluding bill payments)
  const totalCreditCardSpent = expenses
    .filter(
      (e) =>
        e.payment_method === 'Credit Card' &&
        e.category !== 'Credit Card Bill' &&
        e.category !== 'Credit Card Payment' &&
        e.category !== 'Credit Card Repayment'
    )
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // 2. Total payments/repayments made towards Credit Card
  const totalCreditCardPaid = expenses
    .filter(
      (e) =>
        e.category === 'Credit Card Bill' ||
        e.category === 'Credit Card Payment' ||
        e.category === 'Credit Card Repayment' ||
        e.description?.toLowerCase().includes('credit card bill') ||
        e.description?.toLowerCase().includes('credit card payment')
    )
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // 3. Outstanding balance = Spent - Paid (Minimum 0)
  const creditCardOutstanding = Math.max(0, totalCreditCardSpent - totalCreditCardPaid);

  const handlePayBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return;

    setPayLoading(true);
    try {
      if (onAddExpense) {
        await onAddExpense({
          amount: parseFloat(payAmount),
          category: 'Credit Card Bill',
          description: 'Credit Card Bill Payment',
          date: payDate,
          payment_method: payMethod,
          notes: payNotes,
        });
      } else {
        onNavigate('expenses');
      }
      setIsPayModalOpen(false);
    } catch (err) {
      console.error('Failed to submit credit card bill payment', err);
    } finally {
      setPayLoading(false);
    }
  };

  const upiSpent = expenses
    .filter((e) => e.payment_method === 'UPI')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const cashSpent = expenses
    .filter((e) => e.payment_method === 'Cash')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const budgetUsed = totalExpenses;
  const remainingBudget = Math.max(0, totalBudget - budgetUsed);
  const budgetPercentage = totalBudget > 0 ? Math.min(100, Math.round((budgetUsed / totalBudget) * 100)) : 0;

  // Chart data: Category Break-down for Expenses
  const expensesByCategoryMap: Record<string, number> = {};
  expenses.forEach((item) => {
    expensesByCategoryMap[item.category] = (expensesByCategoryMap[item.category] || 0) + Number(item.amount);
  });

  const categoryChartData = Object.keys(expensesByCategoryMap).map((cat) => ({
    name: cat,
    value: expensesByCategoryMap[cat],
  }));

  // Chart data: Payment Method Breakdown
  const paymentMethodMap: Record<string, number> = {};
  expenses.forEach((item) => {
    const method = item.payment_method || 'Other';
    paymentMethodMap[method] = (paymentMethodMap[method] || 0) + Number(item.amount);
  });

  const paymentMethodChartData = Object.keys(paymentMethodMap).map((method) => ({
    name: method,
    value: paymentMethodMap[method],
  }));

  const CATEGORY_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];
  const PAYMENT_COLORS = ['#F59E0B', '#6366F1', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444'];

  // Combined Recent Transactions
  const recentTransactions = [
    ...expenses.map((e) => ({ ...e, type: 'expense' as const })),
    ...income.map((i) => ({ ...i, type: 'income' as const, category: 'Income' })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/40 via-[#08090E] to-[#08090E] p-6 rounded-2xl border border-indigo-500/20">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time financial summary & credit card bill tracking powered by Supabase PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('expenses')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {/* Total Expenses */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Total Expenses</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white mt-3">{formatCurrency(totalExpenses, currency)}</p>
          <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
            <ArrowUpRight className="w-3 h-3" /> Outflow
          </span>
        </div>

        {/* Credit Card Outstanding Bill */}
        <div className="bg-[#08090E] border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent rounded-2xl p-5 hover:border-amber-500/50 transition-all shadow-lg shadow-amber-500/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300">Credit Card Bill</span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-amber-400 mt-3">{formatCurrency(creditCardOutstanding, currency)}</p>
            <span className="text-[11px] text-amber-300/80 flex items-center gap-1 mt-1 font-medium">
              {creditCardOutstanding === 0 && totalCreditCardSpent > 0 ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Paid in Full
                </span>
              ) : (
                `Spent: ${formatCurrency(totalCreditCardSpent, currency)} | Paid: ${formatCurrency(totalCreditCardPaid, currency)}`
              )}
            </span>
          </div>
          <button
            onClick={() => {
              setPayAmount(creditCardOutstanding > 0 ? creditCardOutstanding.toString() : '');
              setIsPayModalOpen(true);
            }}
            className="mt-3 w-full py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{creditCardOutstanding > 0 ? 'Pay Bill' : 'Record Payment'}</span>
          </button>
        </div>

        {/* Total Incoming Amount */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Incoming Amount</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white mt-3">{formatCurrency(totalIncoming, currency)}</p>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <ArrowDownRight className="w-3 h-3" /> Inflow
          </span>
        </div>

        {/* Total Client Balance */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Client Balance</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white mt-3">{formatCurrency(totalClientBalance, currency)}</p>
          <span className="text-[11px] text-amber-400 mt-1 font-medium block">Outstanding receivables</span>
        </div>

        {/* Total Budget */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Total Budget</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <PieChartIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white mt-3">{formatCurrency(totalBudget, currency)}</p>
          <span className="text-[11px] text-zinc-400 mt-1 font-medium block">Allocated limit</span>
        </div>

        {/* Budget Used */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Budget Used</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white mt-3">{formatCurrency(budgetUsed, currency)}</p>
          <span className="text-[11px] text-purple-400 mt-1 font-medium block">{budgetPercentage}% Utilized</span>
        </div>

        {/* Remaining Budget */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Remaining Budget</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <PieChartIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-white mt-3">{formatCurrency(remainingBudget, currency)}</p>
          <span className="text-[11px] text-blue-400 mt-1 font-medium block">Available</span>
        </div>
      </div>

      {/* Credit Card & Payment Mode Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:border-amber-500/30 transition-all">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-semibold">Credit Card Outstanding</span>
              {creditCardOutstanding === 0 && totalCreditCardSpent > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Settled
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-amber-400 mt-1">{formatCurrency(creditCardOutstanding, currency)}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Spent: {formatCurrency(totalCreditCardSpent, currency)} • Repaid: {formatCurrency(totalCreditCardPaid, currency)}
            </p>
          </div>
          <button
            onClick={() => {
              setPayAmount(creditCardOutstanding > 0 ? creditCardOutstanding.toString() : '');
              setIsPayModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Pay Credit Card Bill"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay Bill</span>
          </button>
        </div>

        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold">UPI Spent</span>
            <p className="text-lg font-bold text-indigo-400 mt-1">{formatCurrency(upiSpent, currency)}</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-semibold">Cash Spent</span>
            <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(cashSpent, currency)}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Overall Budget Utilization</h3>
          <span className="text-xs font-bold text-indigo-400">{budgetPercentage}%</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetPercentage > 90
                ? 'bg-rose-500'
                : budgetPercentage > 75
                ? 'bg-amber-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(100, budgetPercentage)}%` }}
          />
        </div>
      </div>

      {/* Charts & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Expense Break-down */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Expenses by Category</h3>
          {categoryChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-500 text-xs">
              No expenses recorded yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D0E16', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any) => [formatCurrency(Number(value), currency), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Spending by Payment Method</h3>
          {paymentMethodChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-500 text-xs">
              No expense payment data recorded.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentMethodChartData.map((entry, index) => (
                      <Cell key={`pm-cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D0E16', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any) => [formatCurrency(Number(value), currency), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Recent Transactions</h3>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                No transactions recorded yet.
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0D0E16] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        tx.type === 'expense'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {tx.type === 'expense' ? <Receipt className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {tx.description || tx.category}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {formatDate(tx.date)} {tx.type === 'expense' && `• ${tx.payment_method}`}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-extrabold shrink-0 ${
                      tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {tx.type === 'expense' ? '-' : '+'}{formatCurrency(Number(tx.amount), currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pay Credit Card Bill Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D0E16] border border-amber-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Pay Credit Card Bill</h2>
                  <p className="text-xs text-amber-400/80 font-medium">Record a bill repayment towards credit card</p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex justify-between items-center">
              <span>Current Outstanding Balance:</span>
              <span className="font-bold text-sm text-amber-400">{formatCurrency(creditCardOutstanding, currency)}</span>
            </div>

            <form onSubmit={handlePayBillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Repayment Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Enter amount"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-[#08090E] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Paid From (Payment Method)</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full bg-[#08090E] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-all"
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full bg-[#08090E] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Credit Card Bill Payment"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-[#08090E] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {payLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Confirm Payment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
