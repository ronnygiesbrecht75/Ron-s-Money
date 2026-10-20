export type TransactionType = 'INCOME' | 'EXPENSE';
export type CurrencyType = 'PYG' | 'USD';
export type TimeframePeriod = 'day' | 'week' | 'month' | 'year';

export type TabId = 
  | 'add_transaction'
  | 'expenses'
  | 'income'
  | 'categories'
  | 'general_balance'
  | 'banks'
  | 'settings';

export interface Bank {
  id: string;
  name: string;
  currency: CurrencyType;
  initialBalance: number;
  color: string;
  accountNumber?: string;
  type: 'checking' | 'savings' | 'cash' | 'credit' | 'wallet';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  iconName: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  cod: string; // e.g. "TRX-1001"
  bankId: string;
  type: TransactionType;
  categoryId: string;
  note?: string;
  amount: number; // Stored in the bank's native currency
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  createdAt: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  userName: string;
  userEmail?: string;
  pin: string; // Minimum 4 digits
  biometricEnabled: boolean;
  themeMode: ThemeMode;
  defaultCurrency: CurrencyType;
  exchangeRateUsdToPyg: number; // e.g., 7500 PYG per 1 USD
  requireAuthOnLoad: boolean;
  githubRepo?: string; // e.g. "ronnygies22/rons-money"
}

export interface UpdateAssetItem {
  id: string | number;
  name: string;
  downloadUrl: string;
  size: number;
  platform?: 'android' | 'windows' | 'web';
  type: 'apk' | 'exe' | 'zip' | 'other';
  description?: string;
  isRecommended?: boolean;
}

export interface AppUpdateInfo {
  version: string;
  name: string;
  notes: string;
  publishedAt: string;
  htmlUrl: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  platform: 'android' | 'windows' | 'web';
  isSimulated?: boolean;
  availableAssets?: UpdateAssetItem[];
}

export interface BalanceFilterState {
  type: 'all' | 'income' | 'expense';
  period: TimeframePeriod;
  selectedDate: string; // YYYY-MM-DD
  selectedWeekStart: string; // YYYY-MM-DD (Monday)
  selectedMonth: number; // 0-11
  selectedYear: number;
  categoryId: string; // 'all' or specific id
  bankId: string; // 'all' or specific id
  currency: 'all' | CurrencyType;
}

export type LicenseType = 'LIFETIME' | 'ANNUAL' | 'MONTHLY';

export interface SoftwareLicense {
  isLicensed: boolean;
  licenseKey: string;
  licenseType: LicenseType;
  licensedTo: string;
  activatedAt: string;
  expiresAt: string | null;
  deviceId: string;
}
