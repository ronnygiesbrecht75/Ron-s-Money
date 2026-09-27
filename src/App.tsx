import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { LicenseActivationScreen } from './components/LicenseActivationScreen';
import { TransactionFormTab } from './components/tabs/TransactionFormTab';
import { ExpensesTab } from './components/tabs/ExpensesTab';
import { IncomeTab } from './components/tabs/IncomeTab';
import { CategoriesTab } from './components/tabs/CategoriesTab';
import { GeneralBalanceTab } from './components/tabs/GeneralBalanceTab';
import { BanksTab } from './components/tabs/BanksTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { 
  PlusCircle, 
  ArrowDownRight, 
  ArrowUpRight, 
  FolderTree, 
  PieChart, 
  Landmark, 
  Settings 
} from 'lucide-react';
import { TabId } from './types';

const MainDashboard: React.FC = () => {
  const { activeTab, setActiveTab, isAuthenticated, license } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Require software license
  if (!license.isLicensed) {
    return <LicenseActivationScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] dark:bg-slate-950 text-black dark:text-white flex flex-col antialiased transition-colors duration-200">
      {/* Left Sidebar (Desktop + Drawer for Mobile) */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area (Offset by 72 (18rem) on large screens) */}
      <div className="lg:pl-72 flex flex-col flex-1 min-w-0 bg-[#f4f7f6] dark:bg-slate-950">
        {/* Top Header */}
        <Header onToggleMobileSidebar={() => setMobileOpen(true)} />

        {/* Dynamic Tab Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12 bg-[#f4f7f6] dark:bg-slate-950">
          {activeTab === 'add_transaction' && <TransactionFormTab />}
          {activeTab === 'expenses' && <ExpensesTab />}
          {activeTab === 'income' && <IncomeTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'general_balance' && <GeneralBalanceTab />}
          {activeTab === 'banks' && <BanksTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>

        {/* Mobile Quick Bottom Navigation Bar */}
        <div 
          id="mobile-bottom-navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#00382b] dark:bg-[#01261d] border-t border-[#024936] px-2 py-2 flex items-center justify-around shadow-2xl text-white"
        >
          <button
            onClick={() => setActiveTab('add_transaction')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-black ${
              activeTab === 'add_transaction' ? 'text-amber-400 bg-white/10' : 'text-emerald-100'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Añadir</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-black ${
              activeTab === 'expenses' ? 'text-amber-400 bg-white/10' : 'text-emerald-100'
            }`}
          >
            <ArrowDownRight className="w-5 h-5" />
            <span>Gastos</span>
          </button>

          <button
            onClick={() => setActiveTab('income')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-black ${
              activeTab === 'income' ? 'text-amber-400 bg-white/10' : 'text-emerald-100'
            }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Ingresos</span>
          </button>

          <button
            onClick={() => setActiveTab('general_balance')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-black ${
              activeTab === 'general_balance' ? 'text-amber-400 bg-white/10' : 'text-emerald-100'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span>Balance</span>
          </button>

          <button
            onClick={() => setActiveTab('banks')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-black ${
              activeTab === 'banks' ? 'text-amber-400 bg-white/10' : 'text-emerald-100'
            }`}
          >
            <Landmark className="w-5 h-5" />
            <span>Bancos</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-black ${
              activeTab === 'settings' ? 'text-amber-400 bg-white/10' : 'text-emerald-100'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Ajustes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainDashboard />
    </AppProvider>
  );
}
