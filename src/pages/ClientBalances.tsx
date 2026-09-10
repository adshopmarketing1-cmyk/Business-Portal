import React, { useState } from 'react';
import { Plus, Users, Edit2, Trash2, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Client } from '../types/database';
import { formatCurrency } from '../utils/formatters';

interface ClientBalancesProps {
  clients: Client[];
  currency: string;
  onAdd: (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'balance_amount'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Client>) => Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export const ClientBalances: React.FC<ClientBalancesProps> = ({
  clients,
  currency,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [loading, setLoading] = useState(false);

  const totalOutstanding = clients.reduce((sum, c) => sum + Number(c.balance_amount || 0), 0);

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setName('');
    setEmail('');
    setPhone('');
    setTotalAmount('');
    setPaidAmount('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setTotalAmount(c.total_amount.toString());
    setPaidAmount(c.paid_amount.toString());
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      const tot = parseFloat(totalAmount) || 0;
      const pd = parseFloat(paidAmount) || 0;

      if (editingClient) {
        await onUpdate(editingClient.id, {
          name,
          email,
          phone,
          total_amount: tot,
          paid_amount: pd,
          balance_amount: tot - pd,
          status,
        });
      } else {
        await onAdd({
          name,
          email,
          phone,
          total_amount: tot,
          paid_amount: pd,
          status,
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Client Amount Balance</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage client ledgers, total billed, paid, and outstanding balances.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-400">Total Outstanding Client Receivables</span>
          <p className="text-3xl font-extrabold text-amber-400 mt-1">{formatCurrency(totalOutstanding, currency)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Users className="w-8 h-8" />
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.length === 0 ? (
          <div className="col-span-full p-12 text-center text-zinc-500 bg-[#08090E] border border-white/10 rounded-2xl">
            <Users className="w-12 h-12 mx-auto mb-3 text-zinc-600 opacity-50" />
            <p className="text-sm font-semibold">No clients registered</p>
            <p className="text-xs mt-1">Click "Add Client" to add your first client ledger.</p>
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="bg-[#08090E] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/30 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white">{client.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-zinc-500" /> {client.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      client.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-500/10 text-zinc-400'
                    }`}
                  >
                    {client.status}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Total Billed:</span>
                    <span className="font-semibold text-white">{formatCurrency(Number(client.total_amount), currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Paid Amount:</span>
                    <span className="font-semibold text-emerald-400">{formatCurrency(Number(client.paid_amount), currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 font-bold">
                    <span className="text-zinc-300">Balance Pending:</span>
                    <span className={`text-sm ${Number(client.balance_amount) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatCurrency(Number(client.balance_amount), currency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => handleOpenEditModal(client)}
                  className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(client.id)}
                  className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingClient ? 'Edit Client Ledger' : 'Add New Client'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Corp / John Doe"
                  className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@acme.com"
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Total Billed ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Paid Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
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
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25 transition-all"
                >
                  {loading ? 'Saving...' : editingClient ? 'Update Client' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
