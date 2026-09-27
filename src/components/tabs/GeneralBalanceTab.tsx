import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TimeframePeriod, CurrencyType, Transaction } from '../../types';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  Percent,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDateSpanish, 
  getTodayDateString, 
  getWeekRange, 
  MONTH_NAMES_SPANISH,
  getMonthName 
} from '../../utils/formatters';
import { CategoryIcon } from '../CategoryIcon';

export const GeneralBalanceTab: React.FC = () => {
  const { transactions, categories, banks } = useApp();

  // Filter States
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [period, setPeriod] = useState<TimeframePeriod>('month');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | CurrencyType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Time navigation states
  const today = getTodayDateString();
  const [selectedDay, setSelectedDay] = useState<string>(today);
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(today);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Week calculation
  const weekInfo = useMemo(() => {
    return getWeekRange(selectedWeekDate);
  }, [selectedWeekDate]);

  // Determine current period date range for filtering
  const { startDate, endDate, periodLabel } = useMemo(() => {
    if (period === 'day') {
      return {
        startDate: selectedDay,
        endDate: selectedDay,
        periodLabel: `Día: ${formatDateSpanish(selectedDay)}`,
      };
    } else if (period === 'week') {
      return {
        startDate: weekInfo.start,
        endDate: weekInfo.end,
        periodLabel: `Semana: ${weekInfo.label}`,
      };
    } else if (period === 'month') {
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      return {
        startDate: `${selectedYear}-${monthStr}-01`,
        endDate: `${selectedYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
        periodLabel: `Mes: ${getMonthName(selectedMonth)} ${selectedYear} (1 al ${lastDay})`,
      };
    } else {
      // Year
      return {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
        periodLabel: `Año: ${selectedYear}`,
      };
    }
  }, [period, selectedDay, weekInfo, selectedMonth, selectedYear]);

  // Filter transactions according to all criteria
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Date range filter
      if (tx.date < startDate || tx.date > endDate) {
        return false;
      }
      // Type filter
      if (typeFilter === 'income' && tx.type !== 'INCOME') return false;
      if (typeFilter === 'expense' && tx.type !== 'EXPENSE') return false;
      // Category filter
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
      // Currency filter
      if (currencyFilter !== 'all') {
        const bank = banks.find(b => b.id === tx.bankId);
        if (bank?.currency !== currencyFilter) return false;
      }
      return true;
    });
  }, [transactions, startDate, endDate, typeFilter, categoryFilter, currencyFilter, banks]);

  // Compute metrics for Guaraníes (PYG)
  const metricsPyg = useMemo(() => {
    const list = filteredTransactions.filter(tx => banks.find(b => b.id === tx.bankId)?.currency === 'PYG');
    const income = list.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    const savingsRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0;
    return { income, expense, net, savingsRate, count: list.length };
  }, [filteredTransactions, banks]);

  // Compute metrics for Dólares (USD)
  const metricsUsd = useMemo(() => {
    const list = filteredTransactions.filter(tx => banks.find(b => b.id === tx.bankId)?.currency === 'USD');
    const income = list.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    const savingsRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0;
    return { income, expense, net, savingsRate, count: list.length };
  }, [filteredTransactions, banks]);

  // Category breakdown for charts
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { category: any; income: number; expense: number; total: number }>();

    for (const tx of filteredTransactions) {
      const cat = categories.find(c => c.id === tx.categoryId);
      if (!cat) continue;

      if (!map.has(cat.id)) {
        map.set(cat.id, { category: cat, income: 0, expense: 0, total: 0 });
      }
      const entry = map.get(cat.id)!;
      if (tx.type === 'INCOME') {
        entry.income += tx.amount;
      } else {
        entry.expense += tx.amount;
      }
      entry.total += tx.amount;
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categories]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No hay transacciones para exportar en este período.');
      return;
    }
    const headers = ['Código', 'Fecha', 'Hora', 'Tipo', 'Categoría', 'Banco', 'Moneda', 'Monto', 'Nota'];
    const rows = filteredTransactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || '';
      const bank = banks.find(b => b.id === t.bankId);
      return [
        t.cod,
        t.date,
        t.time || '',
        t.type === 'INCOME' ? 'Ingreso' : 'Gasto',
        `"${cat}"`,
        `"${bank?.name || ''}"`,
        bank?.currency || 'PYG',
        t.amount,
        `"${(t.note || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `balance-rons-money-${period}-${startDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="tab-general-balance-container" className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white dark:bg-slate-800 text-black dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <PieChart className="w-3.5 h-3.5 text-orange-500" />
            Análisis Financiero
          </div>
          <h2 className="text-2xl font-black tracking-tight text-black dark:text-white mt-1">
            Balance General
          </h2>
          <p className="text-xs text-black dark:text-slate-300 font-medium">
            {periodLabel}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-export-balance-csv"
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-black rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Reporte CSV</span>
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Row 1: Type Selection (Ingresos y Gastos / Ingreso / Gastos) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
            1. Movimientos a Incluir:
          </div>
          <div className="inline-flex p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              id="btn-filter-type-all"
              onClick={() => setTypeFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                typeFilter === 'all'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-black dark:text-slate-300'
              }`}
            >
              Ingresos y Gastos
            </button>
            <button
              type="button"
              id="btn-filter-type-income"
              onClick={() => setTypeFilter('income')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-black dark:text-slate-300'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Solo Ingresos
            </button>
            <button
              type="button"
              id="btn-filter-type-expense"
              onClick={() => setTypeFilter('expense')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                typeFilter === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-black dark:text-slate-300'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Solo Gastos
            </button>
          </div>
        </div>

        {/* Row 2: Timeframe Period (Día / Semana / Mes / Año) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Period selector */}
          <div className="md:col-span-4">
            <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
              2. Período de Tiempo:
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                id="btn-period-day"
                onClick={() => setPeriod('day')}
                className={`py-1.5 text-xs font-black rounded-xl transition-all ${
                  period === 'day' ? 'bg-orange-500 text-white shadow-xs' : 'text-black dark:text-slate-300'
                }`}
              >
                Día
              </button>
              <button
                type="button"
                id="btn-period-week"
                onClick={() => setPeriod('week')}
                className={`py-1.5 text-xs font-black rounded-xl transition-all ${
                  period === 'week' ? 'bg-orange-500 text-white shadow-xs' : 'text-black dark:text-slate-300'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                id="btn-period-month"
                onClick={() => setPeriod('month')}
                className={`py-1.5 text-xs font-black rounded-xl transition-all ${
                  period === 'month' ? 'bg-orange-500 text-white shadow-xs' : 'text-black dark:text-slate-300'
                }`}
              >
                Mes
              </button>
              <button
                type="button"
                id="btn-period-year"
                onClick={() => setPeriod('year')}
                className={`py-1.5 text-xs font-black rounded-xl transition-all ${
                  period === 'year' ? 'bg-orange-500 text-white shadow-xs' : 'text-black dark:text-slate-300'
                }`}
              >
                Año
              </button>
            </div>
          </div>

          {/* Specific period date controller */}
          <div className="md:col-span-5">
            <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
              Selector ({period === 'day' ? 'Día específico' : period === 'week' ? 'Semana (Lun-Dom)' : period === 'month' ? 'Mes y Año' : 'Año'})
            </label>

            {period === 'day' && (
              <input
                id="input-balance-day"
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            )}

            {period === 'week' && (
              <div className="flex items-center gap-2">
                <input
                  id="input-balance-week-date"
                  type="date"
                  value={selectedWeekDate}
                  onChange={(e) => setSelectedWeekDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {period === 'month' && (
              <div className="flex items-center gap-2">
                <select
                  id="select-balance-month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                >
                  {MONTH_NAMES_SPANISH.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
                <select
                  id="select-balance-month-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-32 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {period === 'year' && (
              <select
                id="select-balance-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              >
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
              3. Filtrar Categoría:
            </label>
            <select
              id="select-balance-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'INCOME' ? 'Ingreso' : 'Gasto'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PYG Summary Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
              Balance en Guaraníes (PYG)
            </span>
            <span className="text-xs font-mono font-black bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full text-black dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
              ₲ PYG
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <div className="text-xs font-black text-black dark:text-slate-300 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                Ingresos
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(metricsPyg.income, 'PYG')}
              </div>
            </div>

            <div>
              <div className="text-xs font-black text-black dark:text-slate-300 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                Gastos
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(metricsPyg.expense, 'PYG')}
              </div>
            </div>

            <div>
              <div className="text-xs font-black text-black dark:text-slate-300">
                Balance Neto
              </div>
              <div className={`text-sm sm:text-base font-black font-mono mt-0.5 ${
                metricsPyg.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatCurrency(metricsPyg.net, 'PYG')}
              </div>
            </div>
          </div>
        </div>

        {/* USD Summary Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
              Balance en Dólares (USD)
            </span>
            <span className="text-xs font-mono font-black bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full text-black dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
              $ USD
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <div className="text-xs font-black text-black dark:text-slate-300 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                Ingresos
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(metricsUsd.income, 'USD')}
              </div>
            </div>

            <div>
              <div className="text-xs font-black text-black dark:text-slate-300 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                Gastos
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(metricsUsd.expense, 'USD')}
              </div>
            </div>

            <div>
              <div className="text-xs font-black text-black dark:text-slate-300">
                Balance Neto
              </div>
              <div className={`text-sm sm:text-base font-black font-mono mt-0.5 ${
                metricsUsd.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatCurrency(metricsUsd.net, 'USD')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIAGRAMS & CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Bar Diagram */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-black dark:text-white">
                Diagrama Comparativo de Flujo
              </h3>
              <p className="text-xs text-black dark:text-slate-300 font-medium">
                Proporción de Ingresos vs. Gastos en el período
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {/* PYG Comparison Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-black mb-2 text-black dark:text-white">
                <span>Flujo Guaraníes (₲)</span>
                <span className="font-mono text-black dark:text-slate-300">
                  {metricsPyg.income + metricsPyg.expense > 0 
                    ? `${Math.round((metricsPyg.expense / (metricsPyg.income + metricsPyg.expense || 1)) * 100)}% Gastos`
                    : 'Sin movimientos'}
                </span>
              </div>
              
              <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex shadow-inner">
                {metricsPyg.income + metricsPyg.expense > 0 ? (
                  <>
                    <div 
                      style={{ width: `${(metricsPyg.income / (metricsPyg.income + metricsPyg.expense || 1)) * 100}%` }}
                      className="bg-emerald-600 text-[10px] text-white font-black flex items-center justify-center transition-all"
                      title={`Ingresos: ${formatCurrency(metricsPyg.income, 'PYG')}`}
                    >
                      {metricsPyg.income > 0 ? 'Ingresos' : ''}
                    </div>
                    <div 
                      style={{ width: `${(metricsPyg.expense / (metricsPyg.income + metricsPyg.expense || 1)) * 100}%` }}
                      className="bg-rose-600 text-[10px] text-white font-black flex items-center justify-center transition-all"
                      title={`Gastos: ${formatCurrency(metricsPyg.expense, 'PYG')}`}
                    >
                      {metricsPyg.expense > 0 ? 'Gastos' : ''}
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center text-xs text-slate-400 py-1 font-bold">Sin datos para graficar</div>
                )}
              </div>
            </div>

            {/* USD Comparison Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-black mb-2 text-black dark:text-white">
                <span>Flujo Dólares ($ USD)</span>
                <span className="font-mono text-black dark:text-slate-300">
                  {metricsUsd.income + metricsUsd.expense > 0 
                    ? `${Math.round((metricsUsd.expense / (metricsUsd.income + metricsUsd.expense || 1)) * 100)}% Gastos`
                    : 'Sin movimientos'}
                </span>
              </div>
              
              <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex shadow-inner">
                {metricsUsd.income + metricsUsd.expense > 0 ? (
                  <>
                    <div 
                      style={{ width: `${(metricsUsd.income / (metricsUsd.income + metricsUsd.expense || 1)) * 100}%` }}
                      className="bg-emerald-600 text-[10px] text-white font-black flex items-center justify-center transition-all"
                      title={`Ingresos: ${formatCurrency(metricsUsd.income, 'USD')}`}
                    >
                      {metricsUsd.income > 0 ? 'Ingresos' : ''}
                    </div>
                    <div 
                      style={{ width: `${(metricsUsd.expense / (metricsUsd.income + metricsUsd.expense || 1)) * 100}%` }}
                      className="bg-rose-600 text-[10px] text-white font-black flex items-center justify-center transition-all"
                      title={`Gastos: ${formatCurrency(metricsUsd.expense, 'USD')}`}
                    >
                      {metricsUsd.expense > 0 ? 'Gastos' : ''}
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center text-xs text-slate-400 py-1 font-bold">Sin datos en USD</div>
                )}
              </div>
            </div>

            {/* Quick summary notes */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-black dark:text-white font-bold">
              <div className="font-black text-black dark:text-white">
                Resumen de Actividad:
              </div>
              <p>
                Total de operaciones contabilizadas: <span className="font-black text-orange-500">{filteredTransactions.length}</span> transacciones en el rango ({startDate} al {endDate}).
              </p>
            </div>
          </div>
        </div>

        {/* Category Breakdown list */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black text-black dark:text-white">
              Desglose por Categoría
            </h3>
            <span className="text-xs font-bold text-black dark:text-slate-300">
              {categoryBreakdown.length} categorías
            </span>
          </div>

          <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
            {categoryBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">
                No hay movimientos para mostrar en este filtro.
              </div>
            ) : (
              categoryBreakdown.map(({ category, income, expense, total }) => {
                return (
                  <div
                    key={category.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        <CategoryIcon name={category.iconName} size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-black dark:text-white truncate">
                          {category.name}
                        </div>
                        <div className="text-[10px] text-black dark:text-slate-300 font-bold">
                          {category.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono font-black text-xs">
                      {income > 0 && (
                        <div className="text-emerald-600 dark:text-emerald-400">
                          + {formatCurrency(income, 'PYG')}
                        </div>
                      )}
                      {expense > 0 && (
                        <div className="text-rose-600 dark:text-rose-400">
                          - {formatCurrency(expense, 'PYG')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* DETAILED TRANSACTIONS TABLE OF THE PERIOD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-black dark:text-white">
              Detalle de Transacciones del Período
            </h3>
            <p className="text-xs text-black dark:text-slate-300 font-medium">
              Registros ordenados cronológicamente
            </p>
          </div>
          <span className="text-xs font-black px-3 py-1 bg-white dark:bg-slate-800 text-black dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs">
            {filteredTransactions.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
            <thead className="bg-white dark:bg-slate-800 text-black dark:text-white font-black uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Código</th>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5">Tipo</th>
                <th className="px-5 py-3.5">Categoría</th>
                <th className="px-5 py-3.5">Banco</th>
                <th className="px-5 py-3.5">Nota</th>
                <th className="px-5 py-3.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-black dark:text-slate-400 font-bold">
                    No hay transacciones registradas para este filtro.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const bank = banks.find(b => b.id === tx.bankId);
                  const isInc = tx.type === 'INCOME';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3.5 font-mono font-black text-black dark:text-white">
                        {tx.cod}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-black dark:text-slate-300 font-bold">
                        {formatDateSpanish(tx.date)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isInc 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                        }`}>
                          {isInc ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-black text-black dark:text-white">
                        {cat?.name || 'General'}
                      </td>
                      <td className="px-5 py-3.5 text-black dark:text-white font-bold">
                        {bank?.name || 'Banco'}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs truncate text-black dark:text-slate-300 font-medium">
                        {tx.note || '-'}
                      </td>
                      <td className={`px-5 py-3.5 text-right font-mono font-black ${
                        isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isInc ? '+ ' : '- '}{formatCurrency(tx.amount, bank?.currency || 'PYG')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
