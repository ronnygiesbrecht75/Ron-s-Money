import React from 'react';
import { useApp } from '../context/AppContext';
import { TabId } from '../types';
import { 
  PlusCircle, 
  ArrowDownRight, 
  ArrowUpRight, 
  FolderTree, 
  PieChart, 
  Landmark, 
  Settings, 
  Lock, 
  ChevronRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, logout, getTotalBalanceByCurrency, settings, license } = useApp();

  const pygTotal = getTotalBalanceByCurrency('PYG');
  const usdTotal = getTotalBalanceByCurrency('USD');

  const navItems: { id: TabId; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    {
      id: 'add_transaction',
      label: 'Agregar Transacción',
      icon: PlusCircle,
    },
    {
      id: 'expenses',
      label: 'Egresos (Gastos)',
      icon: ArrowDownRight,
    },
    {
      id: 'income',
      label: 'Ingresos',
      icon: ArrowUpRight,
    },
    {
      id: 'categories',
      label: 'Categoría',
      icon: FolderTree,
    },
    {
      id: 'general_balance',
      label: 'Balance General',
      icon: PieChart,
    },
    {
      id: 'banks',
      label: 'Bancos',
      icon: Landmark,
    },
    {
      id: 'settings',
      label: 'Ajustes',
      icon: Settings,
    },
  ];

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-left-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-[#00382b] dark:bg-[#01261d] border-r border-[#024936] dark:border-[#02382b] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 text-white shadow-xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Branding */}
        <div className="p-5 border-b border-[#024936] dark:border-[#02382b] flex items-center justify-between bg-[#00382b] dark:bg-[#01261d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#00382b] flex items-center justify-center font-black text-lg shadow-md border-2 border-emerald-200/30">
              <Sparkles className="w-5 h-5 text-[#00382b]" />
            </div>
            <div>
              <h2 id="sidebar-app-title" className="text-lg font-black tracking-tight text-white leading-tight">
                Ron´s Money
              </h2>
              <p className="text-[11px] text-amber-400 font-black tracking-wider uppercase">
                AHF · Gestión de Dinero
              </p>
            </div>
          </div>
        </div>

        {/* Balance Mini Preview Card */}
        <div className="mx-4 my-3.5 p-3.5 rounded-2xl bg-[#024936]/80 border border-emerald-400/20 text-white shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-black text-emerald-200 mb-1">
            <span className="tracking-wider uppercase">SALDO DISPONIBLE</span>
            <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-black shadow-xs">
              Total
            </span>
          </div>
          <div className="text-xl font-black text-white font-mono tracking-tight">
            {formatCurrency(pygTotal.net, 'PYG')}
          </div>
          {usdTotal.net !== 0 && (
            <div className="text-xs font-bold text-emerald-200 font-mono mt-0.5">
              + {formatCurrency(usdTotal.net, 'USD')}
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin">
          <div className="px-3 pb-1 text-[11px] font-black text-emerald-400 uppercase tracking-wider">
            Menú Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                type="button"
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm transition-all group ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 font-black'
                    : 'text-emerald-50 font-bold hover:bg-[#024936] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-xl ${isActive ? 'bg-orange-600 text-white' : 'text-emerald-300 group-hover:text-white'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* User & Lock Footer */}
        <div className="p-4 border-t border-[#024936] dark:border-[#02382b] bg-[#012d22] dark:bg-[#012019]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                {settings.userName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-xs font-black text-white truncate">
                  {settings.userName}
                </div>
                <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>
                    {license.licenseType === 'LIFETIME'
                      ? 'Licencia Vitalicia'
                      : license.licenseType === 'TRIAL'
                      ? 'Prueba 15 Días'
                      : 'Licencia Activa'}
                  </span>
                </div>
              </div>
            </div>
            <button
              id="btn-sidebar-lock"
              onClick={logout}
              title="Bloquear sesión"
              className="p-2 text-emerald-200 hover:text-white hover:bg-orange-500 rounded-xl transition-all"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
