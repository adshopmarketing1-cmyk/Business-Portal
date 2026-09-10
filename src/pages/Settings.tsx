import React, { useState, useEffect } from 'react';
import { User, Building, DollarSign, Save, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Profile } from '../types/database';
import { updateProfile } from '../services/profiles';

interface SettingsProps {
  userId: string;
  profile: Profile | null;
  onProfileUpdated: (updated: Profile) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const Settings: React.FC<SettingsProps> = ({
  userId,
  profile,
  onProfileUpdated,
  showToast,
}) => {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [currency, setCurrency] = useState(profile?.currency || 'INR');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCompanyName(profile.company_name || '');
      setPhone(profile.phone || '');
      setCurrency(profile.currency || 'INR');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updated = await updateProfile(userId, {
        full_name: fullName,
        company_name: companyName,
        phone,
        currency,
      });
      onProfileUpdated(updated);
      showToast('Settings & Profile updated successfully in Supabase!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account & Application Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Configure profile details, business entity metadata, and currency format.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Details Box */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <span>Personal Profile</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Muhammed Salih"
                className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Company Metadata Box */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-400" />
            <span>Business Entity & Currency</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Company / Studio Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Enterprises"
                className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#0D0E16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (AED)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Database Status Box */}
        <div className="bg-[#08090E] border border-white/10 rounded-2xl p-6 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Database & Security Architecture</span>
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            All user data is stored securely in Supabase PostgreSQL and isolated with Row Level Security (RLS) policies.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving Changes...' : 'Save Settings'}</span>
        </button>
      </form>
    </div>
  );
};
