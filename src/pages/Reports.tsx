import React, { useState } from 'react';
import { Download, FileText, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { Expense, Income, Budget } from '../types/database';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel, exportToPDF } from '../utils/exporter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ReportsProps {
  expenses: Expense[];
  income: Income[];
  budgets: Budget[];
  currency: string;
}

export const Reports: React.FC<ReportsProps> = ({
  expenses,
  income,
  currency,
}) => {
  const [dateRange, setDateRange] = useState<'all' | 'this_month' | 'last_month' | 'this_year'>('this_month');

  const filterByDate = (dateStr: string) => {
    if (dateRange === 'all') return true;
    const d = new Date(dateStr);
    const now = new Date();

    if (dateRange === 'this_month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (dateRange === 'last_month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    }
    if (dateRange === 'this_year') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filteredExpenses = expenses.filter((e) => filterByDate(e.date));
  const filteredIncome = income.filter((i) => filterByDate(i.date));

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncome = filteredIncome.reduce((sum, i) => sum + Number(i.amount), 0);
  const netSavings = totalIncome - totalExpense;

  // Monthly summary bar chart data
  const chartMap: Record<string, { month: string; Income: number; Expenses: number }> = {};

  filteredIncome.forEach((inc) => {
    const monthKey = inc.date.slice(0, 7); // YYYY-MM
    if (!chartMap[monthKey]) chartMap[monthKey] = { month: monthKey, Income: 0, Expenses: 0 };
    chartMap[monthKey].Income += Number(inc.amount);
  });

  filteredExpenses.forEach((exp) => {
    const monthKey = exp.date.slice(0, 7);
    if (!chartMap[monthKey]) chartMap[monthKey] = { month: monthKey, Income: 0, Expenses: 0 };
    chartMap[monthKey].Expenses += Number(exp.amount);
  });

  const chartData = Object.values(chartMap).sort((a, b) => a.month.localeCompare(b.month));

  const handleExportExcel = () => {
    const reportData = [
      ...filteredIncome.map((i) => ({
        Type: 'INCOME',
        Date: i.date,
        Category: 'Incoming Revenue',
        Description: i.description || '-',
        Amount: i.amount,
      })),
      ...filteredExpenses.map((e) => ({
        Type: 'EXPENSE',
        Date: e.date,
        Category: e.category,
        Description: e.description || '-',
        Amount: e.amount,
      })),
    ];
    exportToExcel(reportData, `Financial_Report_${dateRange}.xlsx`);
  };

  const handleExportPDF = () => {
    exportToPDF('report-container', `Financial_Report_${dateRange}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial Reports</h1>
          <p className="text-sm text-zinc-400 mt-1">In-depth financial analytics, profit & loss statement, and document export.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D0E16] border border-white/10 hover:bg-white/5 text-zinc-300 font-semibold text-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Excel Export</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Export</span>
          </button>
        </div>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex items-center gap-2 bg-[#08090E] border border-white/10 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'this_month', label: 'This Month' },
          { id: 'last_month', label: 'Last Month' },
          { id: 'this_year', label: 'This Year' },
          { id: 'all', label: 'All Time' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDateRange(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              dateRange === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Printable Report Container */}
      <div id="report-container" className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5">
            <span className="text-xs font-semibold text-zinc-400">Total Income</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-2">{formatCurrency(totalIncome, currency)}</p>
          </div>
          <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5">
            <span className="text-xs font-semibold text-zinc-400">Total Expenses</span>
            <p className="text-2xl font-extrabold text-rose-400 mt-2">{formatCurrency(totalExpense, currency)}</p>
          </div>
          <div className="bg-[#08090E] border border-white/10 rounded-2xl p-5">
            <span className="text-xs font-semibold text-zinc-400">Net Profit / Savings</span>
            <p className={`text-2xl font-extrabold mt-2 ${netSavings >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              {formatCurrency(netSavings, currency)}
            </p>
          </div>
        </div>

        {/* Income vs Expenses Bar Chart */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Income vs Expense Comparison</h3>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-zinc-500 text-xs">
              No data for the selected period.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="month" stroke="#71717A" fontSize={12} />
                  <YAxis stroke="#71717A" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0D0E16', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
