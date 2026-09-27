import React from 'react';
import { useApp } from '../context/AppContext';
import { Menu, Sun, Moon, Monitor, Plus, Lock, Shield } from 'lucide-react';
import { TabId, ThemeMode } from '../types';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const { activeTab, setActiveTab, settings, updateSettings, logout, setEditingTransactionId } = useApp();

  const tabTitles: Record<TabId, { title: string; subtitle: string }> = {
    add_transaction: { title: 'Añadir o Editar Transacción', subtitle: 'Registra o modifica ingresos y gastos con código único' },
    expenses: { title: 'Egresos (Gastos)', subtitle: 'Control de compras, servicios, cuotas y salidas de dinero' },
    income: { title: 'Ingresos', subtitle: 'Control de sueldos, ventas de repuestos, préstamos y entradas' },
    categories: { title: 'Categorías', subtitle: 'Administración y clasificación de conceptos' },
    general_balance: { title: 'Balance General', subtitle: 'Gráficos, balances y reportes por día, semana, mes y año' },
    banks: { title: 'Bancos y Cuentas', subtitle: 'Gestión de entidades financieras en Guaraníes y Dólares' },
    settings: { title: 'Ajustes', subtitle: 'Seguridad, tema de colores, PIN, huella dactilar y respaldos' },
  };

  const currentMeta = tabTitles[activeTab] || { title: 'Ron´s Money', subtitle: 'Gestión Financiera' };

  const handleCycleTheme = () => {
    let nextTheme: ThemeMode = 'light';
    if (settings.themeMode === 'light') {
      nextTheme = 'dark';
    } else if (settings.themeMode === 'dark') {
      nextTheme = 'system';
    } else {
      nextTheme = 'light';
    }
    updateSettings({ themeMode: nextTheme });
  };

  const handleNewTransaction = () => {
    setEditingTransactionId(null);
    setActiveTab('add_transaction');
  };

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs"
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          id="btn-mobile-sidebar-toggle"
          onClick={onToggleMobileSidebar}
          type="button"
          className="p-2 lg:hidden text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-bold"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h1 id="page-header-title" className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">
            {currentMeta.title}
          </h1>
          <p className="text-xs text-black dark:text-slate-400 font-medium hidden sm:block">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Transaction Button in Orange */}
        {activeTab !== 'add_transaction' && (
          <button
            id="btn-header-quick-add"
            onClick={handleNewTransaction}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-black rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Transacción</span>
          </button>
        )}

        {/* Theme mode toggle button cycling across 3 modes */}
        <button
          id="btn-header-theme-toggle"
          onClick={handleCycleTheme}
          title={`Tema actual: ${
            settings.themeMode === 'light' ? 'Modo claro' : settings.themeMode === 'dark' ? 'Modo noche' : 'Modo del dispositivo'
          }. Clic para cambiar.`}
          className="p-2.5 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5 text-xs font-black"
        >
          {settings.themeMode === 'light' && (
            <>
              <Sun className="w-4 h-4 text-orange-500" />
              <span className="hidden md:inline">Modo claro</span>
            </>
          )}
          {settings.themeMode === 'dark' && (
            <>
              <Moon className="w-4 h-4 text-orange-400" />
              <span className="hidden md:inline">Modo noche</span>
            </>
          )}
          {settings.themeMode === 'system' && (
            <>
              <Monitor className="w-4 h-4 text-slate-700 dark:text-slate-200" />
              <span className="hidden md:inline">Dispositivo</span>
            </>
          )}
        </button>

        {/* Lock Screen Button */}
        <button
          id="btn-header-lock-app"
          onClick={logout}
          title="Bloquear y salir"
          className="p-2.5 text-black dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 dark:hover:text-orange-400 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
