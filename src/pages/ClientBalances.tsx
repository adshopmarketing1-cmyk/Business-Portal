import React, { useState } from 'react';
import {
  Plus,
  Users,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Search,
  DollarSign,
  Eye,
  X,
  Building,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Client, Income } from '../types/database';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ClientBalancesProps {
  clients: Client[];
  income?: Income[];
  currency: string;
  onAdd: (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'balance_amount'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Client>) => Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onAddIncome?: (income: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const ClientBalances: React.FC<ClientBalancesProps> = ({
  clients,
  income = [],
  currency,
  onAdd,
  onUpdate,
  onDelete,
  onAddIncome,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'active'>('all');

  // Add / Edit Client Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [loading, setLoading] = useState(false);

  // View Client Details Modal
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  // Receive Payment Modal
  const [paymentModalClient, setPaymentModalClient] = useState<Client | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDescription, setPayDescription] = useState('Payment Received');
  const [payNotes, setPayNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  // Summary Metrics
  const totalBilled = clients.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);
  const totalPaid = clients.reduce((sum, c) => sum + Number(c.paid_amount || 0), 0);
  const totalOutstanding = clients.reduce((sum, c) => sum + Number(c.balance_amount || 0), 0);
  const activeCount = clients.filter((c) => c.status === 'active').length;

  // Filtered Clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (statusFilter === 'pending') {
      matchesFilter = Number(c.balance_amount) > 0;
    } else if (statusFilter === 'paid') {
      matchesFilter = Number(c.balance_amount) <= 0;
    } else if (statusFilter === 'active') {
      matchesFilter = c.status === 'active';
    }

    return matchesSearch && matchesFilter;
  });

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
          balance_amount: Math.max(0, tot - pd),
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

  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalClient || !payAmount || parseFloat(payAmount) <= 0) return;

    setPayLoading(true);
    try {
      const recAmount = parseFloat(payAmount);
      const newPaid = Number(paymentModalClient.paid_amount || 0) + recAmount;
      const newBalance = Math.max(0, Number(paymentModalClient.total_amount || 0) - newPaid);

      // 1. Update Client Ledger
      await onUpdate(paymentModalClient.id, {
        paid_amount: newPaid,
        balance_amount: newBalance,
      });

      // 2. Add Income entry if onAddIncome callback exists
      if (onAddIncome) {
        await onAddIncome({
          client_id: paymentModalClient.id,
          amount: recAmount,
          description: payDescription || `Payment from ${paymentModalClient.name}`,
          date: new Date().toISOString().split('T')[0],
          payment_status: 'paid',
          notes: payNotes,
        });
      }

      setPaymentModalClient(null);
      setPayAmount('');
      setPayDescription('Payment Received');
      setPayNotes('');
    } catch (err) {
      console.error('Failed to record payment', err);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Client Amount Balance</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage client ledgers, total contract amounts, payments, and outstanding balances.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Total Billed Contract</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{formatCurrency(totalBilled, currency)}</p>
          <span className="text-[11px] text-zinc-400 mt-1 block">Full Client Contract Value</span>
        </div>

        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Total Paid / Received</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">{formatCurrency(totalPaid, currency)}</p>
          <span className="text-[11px] text-emerald-400/80 mt-1 block">Collected Payments</span>
        </div>

        <div className="bg-[#08090E] border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent rounded-2xl p-5 hover:border-amber-500/50 transition-all shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">Total Outstanding Receivables</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-400 mt-2">{formatCurrency(totalOutstanding, currency)}</p>
          <span className="text-[11px] text-amber-300/80 mt-1 block">Pending Receivables</span>
        </div>

        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Active Accounts</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{activeCount} / {clients.length}</p>
          <span className="text-[11px] text-blue-400 mt-1 block">Active Client Ledgers</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#08090E] border border-white/10 p-4 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search client by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0D0E16] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Clients' },
            { id: 'pending', label: 'Pending Balance' },
            { id: 'paid', label: 'Fully Paid' },
            { id: 'active', label: 'Active Status' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full p-12 text-center text-zinc-500 bg-[#08090E] border border-white/10 rounded-2xl">
            <Users className="w-12 h-12 mx-auto mb-3 text-zinc-600 opacity-50" />
            <p className="text-sm font-semibold text-white">No clients found</p>
            <p className="text-xs mt-1">Try adjusting your search query or add a new client.</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const tot = Number(client.total_amount || 0);
            const pd = Number(client.paid_amount || 0);
            const bal = Number(client.balance_amount || 0);
            const pct = tot > 0 ? Math.min(100, Math.round((pd / tot) * 100)) : 100;

            return (
              <div
                key={client.id}
                className="bg-[#08090E] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all space-y-4 shadow-lg hover:shadow-amber-500/5"
              >
                <div>
                  {/* Client Name & Status Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-white tracking-tight">{client.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400">
                        {client.phone && (
                          <span className="flex items-center gap-1 text-zinc-300">
                            <Phone className="w-3 h-3 text-amber-400" /> {client.phone}
                          </span>
                        )}
                        {client.email && (
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Mail className="w-3 h-3 text-indigo-400" /> {client.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        client.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}
                    >
                      {client.status}
                    </span>
                  </div>

                  {/* Payment Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 mb-1.5">
                      <span>Payment Progress</span>
                      <span className={bal === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {pct}% Paid
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          bal === 0 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Total Billed (Full Amount):</span>
                      <span className="font-bold text-white">{formatCurrency(tot, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Paid / Collected Amount:</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(pd, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                      <span className="text-zinc-300 font-bold">Balance Pending:</span>
                      <span className={`text-sm font-extrabold ${bal > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatCurrency(bal, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingClient(client)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition-all flex items-center gap-1"
                      title="View Full Client Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {bal > 0 && (
                      <button
                        onClick={() => {
                          setPaymentModalClient(client);
                          setPayAmount(bal.toString());
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all flex items-center gap-1"
                        title="Receive Payment"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(client)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit Client"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(client.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View Full Client Details Modal */}
      {viewingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D0E16] border border-white/10 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{viewingClient.name}</h2>
                  <span className="text-xs text-zinc-400">Client Profile & Ledger History</span>
                </div>
              </div>
              <button
                onClick={() => setViewingClient(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#08090E] border border-white/5 flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Phone</span>
                  <span className="text-xs font-semibold text-white">{viewingClient.phone || 'Not provided'}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#08090E] border border-white/5 flex items-center gap-3">
                <Mail className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Email</span>
                  <span className="text-xs font-semibold text-white">{viewingClient.email || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Full Financial Ledger Card */}
            <div className="p-4 rounded-xl bg-[#08090E] border border-amber-500/20 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Financial Ledger Summary</h4>
              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="p-3 rounded-xl bg-white/5">
                  <span className="text-[10px] text-zinc-400 block">Total Contract Billed</span>
                  <span className="text-base font-extrabold text-white mt-1 block">
                    {formatCurrency(Number(viewingClient.total_amount), currency)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 block">Paid Amount</span>
                  <span className="text-base font-extrabold text-emerald-400 mt-1 block">
                    {formatCurrency(Number(viewingClient.paid_amount), currency)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] text-amber-300 block">Pending Balance</span>
                  <span className="text-base font-extrabold text-amber-400 mt-1 block">
                    {formatCurrency(Number(viewingClient.balance_amount), currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Income Payments History List */}
            <div>
              <h4 className="text-xs font-bold text-white mb-3">Received Payments History</h4>
              {income.filter((i) => i.client_id === viewingClient.id).length === 0 ? (
                <div className="p-6 text-center text-zinc-500 bg-[#08090E] rounded-xl text-xs border border-white/5">
                  No payment history recorded yet for this client.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {income
                    .filter((i) => i.client_id === viewingClient.id)
                    .map((inc) => (
                      <div
                        key={inc.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#08090E] border border-white/5 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{inc.description || 'Income Payment'}</p>
                          <span className="text-[11px] text-zinc-400">{formatDate(inc.date)}</span>
                        </div>
                        <span className="font-bold text-emerald-400">+{formatCurrency(Number(inc.amount), currency)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setViewingClient(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {paymentModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0D0E16] border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Record Payment Received</h3>
                  <p className="text-xs text-zinc-400">{paymentModalClient.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalClient(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex justify-between items-center text-amber-300">
              <span>Current Pending Balance:</span>
              <span className="font-bold text-amber-400">{formatCurrency(Number(paymentModalClient.balance_amount), currency)}</span>
            </div>

            <form onSubmit={handleReceivePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Amount Received ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-[#08090E] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Phase 1 Payment"
                  value={payDescription}
                  onChange={(e) => setPayDescription(e.target.value)}
                  className="w-full bg-[#08090E] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Additional notes"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-[#08090E] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPaymentModalClient(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all"
                >
                  {payLoading ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
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
                  className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Total Billed Full Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Paid / Collected ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
