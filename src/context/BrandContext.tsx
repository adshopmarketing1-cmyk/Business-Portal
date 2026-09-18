import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppBranding, DEFAULT_BRANDING } from '../types/branding';
import { supabase } from '../lib/supabase';

interface BrandContextType {
  branding: AppBranding;
  updateBranding: (updates: Partial<AppBranding>) => void;
  resetLogo: () => void;
  resetBranding: () => void;
  isCustomized: boolean;
}

const STORAGE_KEY = 'expenseflow_branding_config';

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<AppBranding>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_BRANDING, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load branding from localStorage', e);
    }
    return DEFAULT_BRANDING;
  });

  // Save branding changes to localStorage & update document title
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    } catch (e) {
      console.error('Failed to save branding to localStorage', e);
    }

    if (branding.appName) {
      document.title = branding.appSubtitle
        ? `${branding.appName} | ${branding.appSubtitle}`
        : branding.appName;
    }
  }, [branding]);

  // Try fetching saved profile branding from Supabase if logged in
  useEffect(() => {
    const syncProfileBranding = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('company_name, app_name, app_subtitle, app_logo, accent_color')
            .eq('id', session.user.id)
            .single();
          
          if (data) {
            setBranding((prev) => ({
              ...prev,
              appName: data.app_name || data.company_name || prev.appName,
              appSubtitle: data.app_subtitle || prev.appSubtitle,
              appLogo: data.app_logo || prev.appLogo,
              accentColor: data.accent_color || prev.accentColor,
            }));
          }
        }
      } catch (e) {
        console.error('Failed to sync profile branding from Supabase', e);
      }
    };
    syncProfileBranding();
  }, []);

  const updateBranding = async (updates: Partial<AppBranding>) => {
    const nextBranding = { ...branding, ...updates };
    setBranding(nextBranding);

    // Sync with Supabase if logged in
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').upsert({
          id: session.user.id,
          app_name: nextBranding.appName,
          app_subtitle: nextBranding.appSubtitle,
          app_logo: nextBranding.appLogo,
          accent_color: nextBranding.accentColor,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Could not sync branding to Supabase profile:', e);
    }
  };

  const resetLogo = () => {
    setBranding((prev) => ({ ...prev, appLogo: DEFAULT_BRANDING.appLogo }));
  };

  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isCustomized =
    branding.appName !== DEFAULT_BRANDING.appName ||
    branding.appSubtitle !== DEFAULT_BRANDING.appSubtitle ||
    branding.appLogo !== DEFAULT_BRANDING.appLogo ||
    branding.accentColor !== DEFAULT_BRANDING.accentColor;

  return (
    <BrandContext.Provider
      value={{
        branding,
        updateBranding,
        resetLogo,
        resetBranding,
        isCustomized,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};

export const useAppBrand = (): BrandContextType => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useAppBrand must be used within a BrandProvider');
  }
  return context;
};
