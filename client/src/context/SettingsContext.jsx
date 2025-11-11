import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSettings as fetchSettingsSupabase, upsertSettings as upsertSettingsSupabase } from '../services/supabaseSettings';

const SettingsContext = createContext({
  settings: null,
  loading: true,
  error: null,
  refresh: async () => {},
  updateSettings: (newSettings) => {}
});

const SETTINGS_STORAGE_KEY = 'app_settings_cache';
const SETTINGS_CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

const loadCachedSettings = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed || !parsed.data || !parsed.timestamp) {
      return null;
    }
    const age = Date.now() - parsed.timestamp;
    if (age > SETTINGS_CACHE_TTL_MS) {
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.warn('Failed to parse cached settings:', error);
    return null;
  }
};

const persistSettingsCache = (data) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now()
      })
    );
  } catch (error) {
    console.warn('Failed to persist settings cache:', error);
  }
};

const DEFAULT_SETTINGS = {
  app_name: 'Nhà Trọ',
  app_logo: null,
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  company_website: '',
  company_tax_code: '',
  company_representative: '',
  company_representative_position: '',
  company_bank_account: '',
  company_bank_name: '',
  company_bank_branch: '',
  notes: ''
};

const normalizeSettings = (rawSettings) => {
  if (!rawSettings || typeof rawSettings !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }
  const { firebase_key, ...rest } = rawSettings;
  return {
    ...DEFAULT_SETTINGS,
    ...rest
  };
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => normalizeSettings(loadCachedSettings()));
  const [loading, setLoading] = useState(() => !loadCachedSettings());
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchSettingsSupabase();
      const data = normalizeSettings(response || {});
      setSettings(data);
      persistSettingsCache(data);
    } catch (err) {
      console.error('Failed to load app settings:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading) {
      fetchSettings();
    }
  }, [loading, fetchSettings]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const title = settings?.app_name?.trim() || DEFAULT_SETTINGS.app_name;
    if (document.title !== title) {
      document.title = title;
    }

    const defaultIcon = '/vite.svg';
    const faviconHref = settings?.app_logo || defaultIcon;
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    if (settings?.app_logo?.startsWith('data:image/')) {
      const type = settings.app_logo.substring(5, settings.app_logo.indexOf(';'));
      link.type = type || 'image/png';
    } else if (settings?.app_logo) {
      link.type = '';
    } else {
      link.type = 'image/svg+xml';
    }

    if (link.href !== faviconHref) {
      link.href = faviconHref;
    }
  }, [settings?.app_name, settings?.app_logo]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      refresh: fetchSettings,
      updateSettings: async (newSettings) => {
        try {
          setError(null);
          const saved = await upsertSettingsSupabase({ ...settings, ...newSettings });
          const normalized = normalizeSettings(saved || newSettings);
          setSettings(normalized);
          persistSettingsCache(normalized);
          return normalized;
        } catch (err) {
          console.error('Failed to update app settings:', err);
          setError(err);
          throw err;
        }
      }
    }),
    [settings, loading, error, fetchSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useAppSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within SettingsProvider');
  }
  return context;
};

