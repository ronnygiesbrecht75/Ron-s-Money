import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction } from '../../types';
import { 
  ArrowUpRight, 
  Search, 
  Trash2, 
  Edit3, 
  Plus, 
  Calendar, 
  Landmark, 
  Wallet,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatDateSpanish } from '../../utils/formatters';
import { CategoryIcon } from '../CategoryIcon';
import { ConfirmationModal } from '../ConfirmationModal';

export const IncomeTab: React.FC = () => {
  const { 
    transactions, 
    categories, 
    banks, 
    deleteTransaction, 
    setEditingTransactionId, 
    setActiveTab 
  } = useApp();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  // Modal confirmation state
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  // Filter only INCOME transactions
  const incomeTransactions = useMemo(() => {
    return transactions.filter(t => t.type === 'INCOME');
  }, [transactions]);

  // Available income categories
  const incomeCategories = useMemo(() => {
    return categories.filter(c => c.type === 'INCOME');
  }, [categories]);

  // Filtered transactions
  const filteredList = useMemo(() => {
    return incomeTransactions.filter(tx => {
      // Category filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) {
        return false;
      }
      // Bank filter
      if (selectedBank !== 'all' && tx.bankId !== selectedBank) {
        return false;
      }
      // Month filter
      if (monthFilter !== 'all') {
        const txMonth = tx.date.slice(0, 7); // YYYY-MM
        if (txMonth !== monthFilter) return false;
      }
      // Search query (cod or note)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codMatch = tx.cod.toLowerCase().includes(q);
        const noteMatch = (tx.note || '').toLowerCase().includes(q);
        const cat = categories.find(c => c.id === tx.categoryId);
        const catMatch = cat?.name.toLowerCase().includes(q);
        if (!codMatch && !noteMatch && !catMatch) return false;
      }
      return true;
    });
  }, [incomeTransactions, selectedCategory, selectedBank, monthFilter, searchQuery, categories]);

  // Calculate totals
  const totalPyg = useMemo(() => {
    return filteredList
      .filter(tx => {
        const bank = banks.find(b => b.id === tx.bankId);
        return bank?.currency === 'PYG';
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredList, banks]);

  const totalUsd = useMemo(() => {
    return filteredList
      .filter(tx => {
        const bank = banks.find(b => b.id === tx.bankId);
        return bank?.currency === 'USD';
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [filteredList, banks]);

  // Handlers for Delete & Edit
  const handleConfirmDelete = () => {
    if (txToDelete) {
      deleteTransaction(txToDelete.id);
      setTxToDelete(null);
    }
  };

  const handleConfirmEdit = () => {
    if (txToEdit) {
      setEditingTransactionId(txToEdit.id);
      setActiveTab('add_transaction');
      setTxToEdit(null);
    }
  };

  const handleQuickAddIncome = () => {
    setEditingTransactionId(null);
    setActiveTab('add_transaction');
  };

  return (
    <div id="tab-income-container" className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Summary Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white dark:bg-emerald-950/60 text-black dark:text-emerald-300 border border-slate-200 dark:border-emerald-800/40">
            <ArrowUpRight className="w-3.5 h-3.5 text-black" />
            Control de Ingresos
          </div>
          <h2 className="text-2xl font-black tracking-tight text-black dark:text-white mt-1">
            Registro de Ingresos
          </h2>
          <p className="text-xs text-black dark:text-slate-300 font-medium">
            Entradas de Sueldo R, Sueldo G, Préstamo, Repuestos de Generadores y otros.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-add-income-quick"
            onClick={handleQuickAddIncome}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-black rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Ingreso</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#12231e] border border-slate-200 dark:border-emerald-900/50 shadow-xs">
          <div className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
            Total Ingresos (Guaraníes)
          </div>
          <div className="text-2xl font-black font-mono text-black dark:text-emerald-400 mt-1">
            {formatCurrency(totalPyg, 'PYG')}
          </div>
          <div className="text-xs font-bold text-black dark:text-slate-300 mt-1">
            {filteredList.filter(t => banks.find(b => b.id === t.bankId)?.currency === 'PYG').length} ingresos registrados
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#12231e] border border-slate-200 dark:border-emerald-900/50 shadow-xs">
          <div className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
            Total Ingresos (Dólares)
          </div>
          <div className="text-2xl font-black font-mono text-black dark:text-emerald-400 mt-1">
            {formatCurrency(totalUsd, 'USD')}
          </div>
          <div className="text-xs font-bold text-black dark:text-slate-300 mt-1">
            {filteredList.filter(t => banks.find(b => b.id === t.bankId)?.currency === 'USD').length} ingresos en USD
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#12231e] border border-slate-200 dark:border-emerald-900/50 shadow-xs">
          <div className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
            Fuentes de Ingreso
          </div>
          <div className="text-2xl font-black text-black dark:text-emerald-400 mt-1">
            {incomeCategories.length} Categorías
          </div>
          <div className="text-xs font-bold text-black dark:text-slate-300 mt-1">
            Sueldo R, Sueldo G, Generadores...
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#12231e] border border-slate-200 dark:border-emerald-900/50 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-black absolute left-3 top-3" />
            <input
              id="input-filter-income-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ingreso por código o nota..."
              className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-[#18352b] border border-slate-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-black dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              id="select-filter-income-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#18352b] border border-slate-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Todas las Categorías de Ingresos</option>
              {incomeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bank Filter */}
          <div className="relative">
            <select
              id="select-filter-income-bank"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#18352b] border border-slate-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Todos los Bancos</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="relative">
            <select
              id="select-filter-income-month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#18352b] border border-slate-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Todos los Meses</option>
              <option value="2026-08">Agosto 2026</option>
              <option value="2026-07">Julio 2026</option>
              <option value="2026-06">Junio 2026</option>
              <option value="2026-05">Mayo 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white dark:bg-[#12231e] border border-slate-200 dark:border-emerald-900/50 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table id="table-income" className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
            <thead className="bg-white dark:bg-[#18352b] text-black dark:text-white font-black uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-emerald-900/40">
              <tr>
                <th className="px-5 py-4">Cod</th>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Categoría</th>
                <th className="px-5 py-4">Banco</th>
                <th className="px-5 py-4">Nota / Concepto</th>
                <th className="px-5 py-4 text-right">Suma</th>
                <th className="px-5 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/30 font-medium">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-600" />
                    No se encontraron ingresos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredList.map((tx) => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const bank = banks.find(b => b.id === tx.bankId);
                  const currency = bank?.currency || 'PYG';

                  return (
                    <tr 
                      key={tx.id} 
                      id={`income-row-${tx.cod}`}
                      className="hover:bg-slate-50 dark:hover:bg-[#18352b]/50 transition-colors"
                    >
                      {/* Code */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#18352b] text-black dark:text-emerald-300 font-mono font-black border border-slate-300 dark:border-emerald-800 shadow-2xs">
                          {tx.cod}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-bold">
                        <div>{formatDateSpanish(tx.date)}</div>
                        {tx.time && <div className="text-[10px] text-slate-500 font-mono">{tx.time}</div>}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-1.5 rounded-lg shrink-0" 
                            style={{ backgroundColor: `${cat?.color || '#10b981'}20`, color: cat?.color || '#10b981' }}
                          >
                            <CategoryIcon name={cat?.iconName || 'Wallet'} size={15} />
                          </div>
                          <span className="font-black text-black dark:text-white">
                            {cat?.name || 'Ingreso General'}
                          </span>
                        </div>
                      </td>

                      {/* Bank */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bank?.color || '#94a3b8' }} />
                          <span className="font-bold text-black dark:text-white">
                            {bank?.name || 'Banco'}
                          </span>
                        </div>
                      </td>

                      {/* Note */}
                      <td className="px-5 py-4 max-w-xs truncate text-slate-700 dark:text-slate-300 font-medium">
                        {tx.note || <span className="italic text-slate-400">Sin nota</span>}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                        + {formatCurrency(tx.amount, currency)}
                      </td>

                      {/* Actions Column (Eliminar y Editar con confirmación) */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Editar */}
                          <button
                            id={`btn-edit-income-${tx.cod}`}
                            onClick={() => setTxToEdit(tx)}
                            title="Editar transacción"
                            className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors font-bold"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            id={`btn-delete-income-${tx.cod}`}
                            onClick={() => setTxToDelete(tx)}
                            title="Eliminar transacción"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-bold"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={!!txToDelete}
        title="¿Eliminar este Ingreso?"
        message={
          txToDelete 
            ? `¿Estás seguro de que deseas eliminar permanentemente el ingreso "${txToDelete.cod}" por valor de ${formatCurrency(txToDelete.amount, banks.find(b => b.id === txToDelete.bankId)?.currency || 'PYG')}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmText="Sí, Eliminar Ingreso"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTxToDelete(null)}
      />

      {/* Confirmation Modal for Edit */}
      <ConfirmationModal
        isOpen={!!txToEdit}
        title="¿Editar esta Transacción?"
        message={
          txToEdit
            ? `¿Deseas editar la transacción ${txToEdit.cod}? Serás llevado a la pestaña "Agregar Transacción" con todos sus datos cargados para modificarlos.`
            : ''
        }
        confirmText="Sí, Ir a Editar"
        cancelText="Volver"
        isDestructive={false}
        onConfirm={handleConfirmEdit}
        onCancel={() => setTxToEdit(null)}
      />
    </div>
  );
};
