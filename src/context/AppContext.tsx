import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Bank, 
  Category, 
  Transaction, 
  UserSettings, 
  TabId, 
  CurrencyType,
  TransactionType,
  SoftwareLicense
} from '../types';
import { 
  loadLicense, 
  activateLicense, 
  deactivateLicense 
} from '../services/licenseService';
import { 
  DEFAULT_BANKS, 
  DEFAULT_CATEGORIES, 
  DEFAULT_USER_SETTINGS, 
  INITIAL_TRANSACTIONS 
} from '../data/initialData';
import { generateTransactionCode } from '../utils/formatters';

interface AppContextType {
  // Software License
  license: SoftwareLicense;
  activateAppLicense: (key: string, licensedTo: string) => { success: boolean; error?: string };
  deactivateAppLicense: () => void;
  refreshLicense: () => void;

  // Navigation & UI
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  editingTransactionId: string | null;
  setEditingTransactionId: (id: string | null) => void;
  
  // Auth state
  isAuthenticated: boolean;
  loginWithPin: (pin: string) => { success: boolean; error?: string };
  loginWithBiometrics: () => Promise<boolean>;
  logout: () => void;

  // Data
  transactions: Transaction[];
  banks: Bank[];
  categories: Category[];
  settings: UserSettings;

  // CRUD Operations
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => string;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionByCod: (cod: string) => Transaction | undefined;
  
  addBank: (data: Omit<Bank, 'id' | 'createdAt'>) => string;
  updateBank: (id: string, data: Partial<Bank>) => void;
  deleteBank: (id: string) => { success: boolean; error?: string };

  addCategory: (data: Omit<Category, 'id'>) => string;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => { success: boolean; error?: string };

  updateSettings: (data: Partial<UserSettings>) => void;

  // Helper calculations
  getBankCalculatedBalance: (bankId: string) => number;
  getTotalBalanceByCurrency: (currency: CurrencyType) => { 
    initial: number; 
    income: number; 
    expense: number; 
    net: number; 
  };

  // Utilities
  getBackupData: () => Record<string, unknown>;
  exportDataJson: () => void;
  importDataJson: (jsonString: string) => { success: boolean; error?: string };
  resetToFactoryDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSACTIONS: 'rons_money_transactions_v1',
  BANKS: 'rons_money_banks_v1',
  CATEGORIES: 'rons_money_categories_v1',
  SETTINGS: 'rons_money_settings_v1',
  AUTH: 'rons_money_is_authenticated_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Software License State
  const [license, setLicense] = useState<SoftwareLicense>(() => loadLicense());

  const refreshLicense = () => {
    setLicense(loadLicense());
  };

  const activateAppLicense = (key: string, licensedTo: string) => {
    const res = activateLicense(key, licensedTo);
    if (res.success && res.license) {
      setLicense(res.license);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const deactivateAppLicense = () => {
    deactivateLicense();
    setLicense(loadLicense());
  };

  // Load Settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_USER_SETTINGS;
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  });

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // If requireAuthOnLoad is false, start authenticated, else check session
    try {
      const savedAuth = sessionStorage.getItem(STORAGE_KEYS.AUTH);
      if (savedAuth === 'true') return true;
      return !settings.requireAuthOnLoad;
    } catch {
      return true;
    }
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabId>('add_transaction');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Banks State
  const [banks, setBanks] = useState<Bank[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BANKS);
      return saved ? JSON.parse(saved) : DEFAULT_BANKS;
    } catch {
      return DEFAULT_BANKS;
    }
  });

  // Categories State
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(banks));
  }, [banks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  // Apply Dark/Light theme class to html root
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (settings.themeMode === 'dark') {
        root.classList.add('dark');
      } else if (settings.themeMode === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();

    const handleSystemThemeChange = () => {
      if (settings.themeMode === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [settings.themeMode]);

  // Auth Handlers
  const loginWithPin = (enteredPin: string) => {
    if (enteredPin === settings.pin) {
      setIsAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      return { success: true };
    }
    return { success: false, error: 'Contraseña o PIN incorrecto.' };
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    if (!settings.biometricEnabled) return false;
    // Simulate biometric sensor read
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsAuthenticated(true);
        sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        resolve(true);
      }, 700);
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
  };

  // Transaction CRUD
  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>): string => {
    const existingCodes = transactions.map(t => t.cod);
    const finalCod = data.cod?.trim() ? data.cod.trim().toUpperCase() : generateTransactionCode(existingCodes);

    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      cod: finalCod,
      createdAt: new Date().toISOString(),
    };

    setTransactions(prev => [newTx, ...prev]);
    return newTx.id;
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions(prev => 
      prev.map(tx => tx.id === id ? { ...tx, ...data } : tx)
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
    if (editingTransactionId === id) {
      setEditingTransactionId(null);
    }
  };

  const getTransactionByCod = (cod: string): Transaction | undefined => {
    const cleanCod = cod.trim().toUpperCase();
    return transactions.find(t => t.cod.toUpperCase() === cleanCod);
  };

  // Bank CRUD
  const addBank = (data: Omit<Bank, 'id' | 'createdAt'>): string => {
    const newBank: Bank = {
      ...data,
      id: `bank-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setBanks(prev => [...prev, newBank]);
    return newBank.id;
  };

  const updateBank = (id: string, data: Partial<Bank>) => {
    setBanks(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const deleteBank = (id: string): { success: boolean; error?: string } => {
    const associatedTx = transactions.filter(t => t.bankId === id);
    if (associatedTx.length > 0) {
      return {
        success: false,
        error: `No se puede eliminar este banco porque tiene ${associatedTx.length} transacciones asociadas. Por favor reasigne o elimine las transacciones primero.`,
      };
    }
    setBanks(prev => prev.filter(b => b.id !== id));
    return { success: true };
  };

  // Category CRUD
  const addCategory = (data: Omit<Category, 'id'>): string => {
    const newCat: Category = {
      ...data,
      id: `cat-${Date.now()}`,
    };
    setCategories(prev => [...prev, newCat]);
    return newCat.id;
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCategory = (id: string): { success: boolean; error?: string } => {
    const associatedTx = transactions.filter(t => t.categoryId === id);
    if (associatedTx.length > 0) {
      return {
        success: false,
        error: `No se puede eliminar esta categoría porque tiene ${associatedTx.length} transacciones asociadas.`,
      };
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    return { success: true };
  };

  const updateSettings = (data: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...data }));
  };

  // Calculations
  const getBankCalculatedBalance = (bankId: string): number => {
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return 0;
    
    let balance = bank.initialBalance;
    for (const tx of transactions) {
      if (tx.bankId === bankId) {
        if (tx.type === 'INCOME') {
          balance += tx.amount;
        } else if (tx.type === 'EXPENSE') {
          balance -= tx.amount;
        }
      }
    }
    return balance;
  };

  const getTotalBalanceByCurrency = (currency: CurrencyType) => {
    const targetBanks = banks.filter(b => b.currency === currency);
    const initial = targetBanks.reduce((sum, b) => sum + b.initialBalance, 0);
    
    let income = 0;
    let expense = 0;

    const bankIds = new Set(targetBanks.map(b => b.id));

    for (const tx of transactions) {
      if (bankIds.has(tx.bankId)) {
        if (tx.type === 'INCOME') {
          income += tx.amount;
        } else if (tx.type === 'EXPENSE') {
          expense += tx.amount;
        }
      }
    }

    const net = initial + income - expense;
    return { initial, income, expense, net };
  };

  // Backup and Restore
  const getBackupData = () => {
    return {
      appName: "Ron's Money",
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      banks,
      categories,
      transactions,
    };
  };

  const exportDataJson = () => {
    const exportData = getBackupData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rons-money-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importDataJson = (jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.banks) && Array.isArray(parsed.categories) && Array.isArray(parsed.transactions)) {
        setBanks(parsed.banks);
        setCategories(parsed.categories);
        setTransactions(parsed.transactions);
        if (parsed.settings) {
          setSettings(prev => ({ ...prev, ...parsed.settings }));
        }
        return { success: true };
      }
      return { success: false, error: 'El archivo no tiene el formato válido de Ron´s Money.' };
    } catch {
      return { success: false, error: 'Error al procesar el archivo JSON.' };
    }
  };

  const resetToFactoryDefaults = () => {
    setBanks(DEFAULT_BANKS);
    setCategories(DEFAULT_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setSettings(DEFAULT_USER_SETTINGS);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        editingTransactionId,
        setEditingTransactionId,
        license,
        activateAppLicense,
        deactivateAppLicense,
        refreshLicense,
        isAuthenticated,
        loginWithPin,
        loginWithBiometrics,
        logout,
        transactions,
        banks,
        categories,
        settings,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransactionByCod,
        addBank,
        updateBank,
        deleteBank,
        addCategory,
        updateCategory,
        deleteCategory,
        updateSettings,
        getBankCalculatedBalance,
        getTotalBalanceByCurrency,
        getBackupData,
        exportDataJson,
        importDataJson,
        resetToFactoryDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
