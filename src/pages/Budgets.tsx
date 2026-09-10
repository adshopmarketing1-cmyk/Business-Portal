import React, { useState } from 'react';
import { Plus, PieChart, Edit2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Budget, Expense } from '../types/database';
import { formatCurrency } from '../utils/formatters';

interface BudgetsProps {
  budgets: Budget[];
  expenses: Expense[];
  currency: string;
  onAdd: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Budget>) => Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export const Budgets: React.FC<BudgetsProps> = ({
  budgets,
  expenses,
  currency,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [category, setCategory] = useState('Travel');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    'Travel',
    'Fuel',
    'Food',
    'Office',
    'Advertising',
    'Software',
    'Transportation',
    'Equipment',
    'Communication',
    'Client Expense',
    'Printing',
    'Other',
  ];

  // Calculate spent amounts for each budget category
  const spentByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    spentByCategory[e.category] = (spentByCategory[e.category] || 0) + Number(e.amount);
  });

  const handleOpenAddModal = () => {
    setEditingBudget(null);
    setCategory('Travel');
    setBudgetAmount('');
    setStartDate('');
    setEndDate('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: Budget) => {
    setEditingBudget(b);
    setCategory(b.category);
    setBudgetAmount(b.budget_amount.toString());
    setStartDate(b.start_date || '');
    setEndDate(b.end_date || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) return;

    setLoading(true);
    try {
      if (editingBudget) {
        await onUpdate(editingBudget.id, {
          category,
          budget_amount: parseFloat(budgetAmount),
          start_date: startDate || null,
          end_date: endDate || null,
        });
      } else {
        await onAdd({
          category,
          budget_amount: parseFloat(budgetAmount),
          start_date: startDate || null,
          end_date: endDate || null,
        });
      }
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Budgets</h1>
          <p className="text-sm text-zinc-400 mt-1">Set category spending limits and monitor budget utilization.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Set Budget</span>
        </button>
      </div>

      {/* Budget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.length === 0 ? (
          <div className="col-span-full p-12 text-center text-zinc-500 bg-[#08090E] border border-white/10 rounded-2xl">
            <PieChart className="w-12 h-12 mx-auto mb-3 text-zinc-600 opacity-50" />
            <p className="text-sm font-semibold">No category budgets created</p>
            <p className="text-xs mt-1">Click "Set Budget" to allocate spending limits per category.</p>
          </div>
        ) : (
          budgets.map((b) => {
            const spent = spentByCategory[b.category] || 0;
            const percentage = b.budget_amount > 0 ? Math.min(100, Math.round((spent / b.budget_amount) * 100)) : 0;
            const remaining = Math.max(0, b.budget_amount - spent);

            return (
              <div
                key={b.id}
                className="bg-[#08090E] border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-xs">
                      {b.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(b)}
                        className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(b.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-zinc-400">Spent / Budget:</span>
                      <span className="text-sm font-extrabold text-white">
                        {formatCurrency(spent, currency)} / {formatCurrency(Number(b.budget_amount), currency)}
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden mt-2 p-0.5 border border-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percentage > 90
                            ? 'bg-rose-500'
                            : percentage > 75
                            ? 'bg-amber-500'
                            : 'bg-purple-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-zinc-400">Remaining:</span>
                      <span className={`font-bold ${remaining === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatCurrency(remaining, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingBudget ? 'Edit Category Budget' : 'Set New Category Budget'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Budget Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Start Date (Optional)</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 transition-all"
                >
                  {loading ? 'Saving...' : editingBudget ? 'Update Budget' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
