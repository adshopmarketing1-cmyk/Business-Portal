import React, { useState } from 'react';
import { Plus, TrendingUp, Download, Edit2, Trash2 } from 'lucide-react';
import { Income, Client } from '../types/database';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel } from '../utils/exporter';

interface IncomeProps {
  incomeList: Income[];
  clients: Client[];
  currency: string;
  onAdd: (income: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Income>) => Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export const IncomePage: React.FC<IncomeProps> = ({
  incomeList,
  clients,
  currency,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const [amount, setAmount] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partially_paid' | 'cancelled'>('paid');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const totalIncome = incomeList.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const handleOpenAddModal = () => {
    setEditingIncome(null);
    setAmount('');
    setClientId(clients[0]?.id || '');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentStatus('paid');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Income) => {
    setEditingIncome(item);
    setAmount(item.amount.toString());
    setClientId(item.client_id || '');
    setDescription(item.description || '');
    setDate(item.date);
    setPaymentStatus(item.payment_status);
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      if (editingIncome) {
        await onUpdate(editingIncome.id, {
          amount: parseFloat(amount),
          client_id: clientId || null,
          description,
          date,
          payment_status: paymentStatus,
          notes,
        });
      } else {
        await onAdd({
          amount: parseFloat(amount),
          client_id: clientId || null,
          description,
          date,
          payment_status: paymentStatus,
          notes,
        });
      }
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = incomeList.map((inc) => ({
      Date: inc.date,
      Client: inc.client?.name || '-',
      Description: inc.description || '-',
      Amount: inc.amount,
      Status: inc.payment_status,
      Notes: inc.notes || '-',
    }));
    exportToExcel(exportData, 'Incoming_Income_Report.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Incoming Amount</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track revenue, client retainers, and invoice payments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D0E16] border border-white/10 hover:bg-white/5 text-zinc-300 font-semibold text-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-400">Total Recorded Income</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1">{formatCurrency(totalIncome, currency)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <TrendingUp className="w-8 h-8" />
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-[#08090E] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {incomeList.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-zinc-600 opacity-50" />
            <p className="text-sm font-semibold">No income records found</p>
            <p className="text-xs mt-1">Click "Add Income" to register incoming revenue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#0D0E16] border-b border-white/10 uppercase font-semibold text-zinc-400">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {incomeList.map((inc) => (
                  <tr key={inc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{formatDate(inc.date)}</td>
                    <td className="px-6 py-4 font-medium text-indigo-400">
                      {inc.client?.name || 'Direct / General'}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{inc.description || '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          inc.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : inc.payment_status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-500/10 text-zinc-400'
                        }`}
                      >
                        {inc.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      +{formatCurrency(Number(inc.amount), currency)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(inc)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(inc.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingIncome ? 'Edit Income Record' : 'Record Incoming Amount'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Select Client (Optional)</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Direct / No Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Invoice payment, retainer fee..."
                  className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e: any) => setPaymentStatus(e.target.value)}
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="partially_paid">Partially Paid</option>
                  </select>
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
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all"
                >
                  {loading ? 'Saving...' : editingIncome ? 'Update Income' : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
