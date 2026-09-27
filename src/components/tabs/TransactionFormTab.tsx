import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TransactionType } from '../../types';
import { 
  PlusCircle, 
  Search, 
  Check, 
  X, 
  Landmark, 
  Calendar, 
  Clock, 
  FileText, 
  DollarSign, 
  ArrowDownRight, 
  ArrowUpRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  formatCurrency, 
  getTodayDateString, 
  getCurrentTimeString, 
  generateTransactionCode 
} from '../../utils/formatters';
import { CategoryIcon } from '../CategoryIcon';
import confetti from 'canvas-confetti';

export const TransactionFormTab: React.FC = () => {
  const { 
    banks, 
    categories, 
    transactions, 
    addTransaction, 
    updateTransaction, 
    editingTransactionId, 
    setEditingTransactionId,
    setActiveTab,
    getBankCalculatedBalance
  } = useApp();

  // Search by code state
  const [searchCodInput, setSearchCodInput] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Form states
  const [selectedBankId, setSelectedBankId] = useState<string>(banks[0]?.id || '');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [categoryId, setCategoryId] = useState<string>('');
  const [note, setNote] = useState('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [customCod, setCustomCod] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Get current bank info
  const currentBank = banks.find(b => b.id === selectedBankId) || banks[0];
  const currentCurrency = currentBank?.currency || 'PYG';

  // Filter categories by selected transaction type
  const availableCategories = categories.filter(c => c.type === type);

  // Auto-generate code when in new transaction mode
  useEffect(() => {
    if (!editingTransactionId) {
      const existingCodes = transactions.map(t => t.cod);
      setCustomCod(generateTransactionCode(existingCodes));
    }
  }, [transactions, editingTransactionId]);

  // Load editing transaction if set
  useEffect(() => {
    if (editingTransactionId) {
      const tx = transactions.find(t => t.id === editingTransactionId);
      if (tx) {
        setCustomCod(tx.cod);
        setSelectedBankId(tx.bankId);
        setType(tx.type);
        setCategoryId(tx.categoryId);
        setNote(tx.note || '');
        setAmountStr(tx.amount.toString());
        setDate(tx.date);
        setTime(tx.time || getCurrentTimeString());
        setSearchCodInput(tx.cod);
        setSearchFeedback({
          type: 'info',
          message: `Editando transacción ${tx.cod}`
        });
      }
    }
  }, [editingTransactionId, transactions]);

  // Set default category when type or categories change if none selected or invalid
  useEffect(() => {
    if (!categoryId || !availableCategories.some(c => c.id === categoryId)) {
      if (availableCategories.length > 0) {
        setCategoryId(availableCategories[0].id);
      }
    }
  }, [type, availableCategories, categoryId]);

  // Handle Search Transaction by Code
  const handleSearchByCod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCodInput.trim()) {
      setSearchFeedback({ type: 'error', message: 'Ingresa un código de transacción (ej: TRX-1001)' });
      return;
    }

    const clean = searchCodInput.trim().toUpperCase();
    const found = transactions.find(t => t.cod.toUpperCase() === clean);

    if (found) {
      setEditingTransactionId(found.id);
      setSearchFeedback({
        type: 'success',
        message: `Transacción ${found.cod} cargada para edición.`
      });
    } else {
      setSearchFeedback({
        type: 'error',
        message: `No se encontró ninguna transacción con el código "${clean}".`
      });
    }
  };

  const handleClearEditing = () => {
    setEditingTransactionId(null);
    setSearchCodInput('');
    setSearchFeedback(null);
    setNote('');
    setAmountStr('');
    setDate(getTodayDateString());
    setTime(getCurrentTimeString());
    const existingCodes = transactions.map(t => t.cod);
    setCustomCod(generateTransactionCode(existingCodes));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
    if (!numAmount || numAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (!selectedBankId) {
      alert('Por favor selecciona un banco.');
      return;
    }

    if (!categoryId) {
      alert('Por favor selecciona una categoría.');
      return;
    }

    if (editingTransactionId) {
      // Update existing
      updateTransaction(editingTransactionId, {
        cod: customCod.trim().toUpperCase(),
        bankId: selectedBankId,
        type,
        categoryId,
        note: note.trim(),
        amount: numAmount,
        date,
        time,
      });

      setSuccessToast(`Transacción ${customCod} actualizada correctamente.`);
      setTimeout(() => setSuccessToast(null), 4000);
      handleClearEditing();
    } else {
      // Add new
      addTransaction({
        cod: customCod.trim().toUpperCase(),
        bankId: selectedBankId,
        type,
        categoryId,
        note: note.trim(),
        amount: numAmount,
        date,
        time,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#f97316', '#059669', '#ea580c'],
        });
      } catch {
        // Ignored
      }

      setSuccessToast(`Transacción ${customCod} registrada con éxito.`);
      setTimeout(() => setSuccessToast(null), 4000);

      // Reset amount and note for fast consecutive entries
      setAmountStr('');
      setNote('');
      const existingCodes = transactions.map(t => t.cod);
      setCustomCod(generateTransactionCode(existingCodes));
    }
  };

  return (
    <div id="tab-transaction-form" className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {successToast && (
        <div 
          id="transaction-success-toast"
          className="p-4 rounded-2xl bg-white dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white font-black">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black">¡Operación Exitosa!</div>
              <div className="text-xs font-bold">{successToast}</div>
            </div>
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="p-1 text-emerald-700 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-emerald-900/40 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Search Box by Transaction Code */}
      <div 
        id="search-by-cod-card" 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-black dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-orange-500" />
              Buscar Transacción por Código
            </h3>
            <p className="text-xs text-black dark:text-slate-300 font-medium mt-0.5">
              Ingresa el código (ej. TRX-1001) para cargar y editar cualquier transacción
            </p>
          </div>

          {editingTransactionId && (
            <button
              id="btn-cancel-edit-mode"
              type="button"
              onClick={handleClearEditing}
              className="px-3.5 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-black hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Modo Nueva Transacción</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSearchByCod} className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              id="input-search-transaction-cod"
              type="text"
              value={searchCodInput}
              onChange={(e) => {
                setSearchCodInput(e.target.value);
                setSearchFeedback(null);
              }}
              placeholder="Buscar ej: TRX-1001, TRX-1002..."
              className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-mono font-bold text-black dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {searchCodInput && (
              <button
                type="button"
                onClick={() => setSearchCodInput('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-black dark:text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            id="btn-submit-search-cod"
            type="submit"
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-xs rounded-2xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Buscar y Editar</span>
          </button>
        </form>

        {/* Search Feedback Message */}
        {searchFeedback && (
          <div className={`mt-3 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 ${
            searchFeedback.type === 'success' 
              ? 'bg-white dark:bg-slate-800 text-black dark:text-slate-200 border border-emerald-500'
              : searchFeedback.type === 'error'
              ? 'bg-white dark:bg-rose-950/50 text-rose-700 dark:text-rose-200 border border-rose-400'
              : 'bg-white dark:bg-slate-800 text-black dark:text-slate-200 border border-slate-300'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 text-black dark:text-white" />
            <span>{searchFeedback.message}</span>
          </div>
        )}
      </div>

      {/* 2. Main Transaction Form Card */}
      <div 
        id="main-transaction-form-card" 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-white dark:bg-slate-800 text-black dark:text-slate-200 mb-2 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              {editingTransactionId ? 'Modificando Registro' : 'Nuevo Registro'}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-black dark:text-white">
              {editingTransactionId ? `Editar Transacción: ${customCod}` : 'Registrar Transacción'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-black dark:text-slate-300 uppercase tracking-wider">
              Código:
            </span>
            <span className="px-3 py-1.5 bg-white dark:bg-slate-800 text-black dark:text-slate-200 font-mono font-black text-sm rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs">
              {customCod || 'TRX-AUTO'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Step 1: Type Selection (Ingresos vs Gastos) */}
          <div>
            <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2.5">
              1. Tipo de Movimiento *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-select-expense"
                onClick={() => setType('EXPENSE')}
                className={`py-3.5 px-4 rounded-2xl border-2 font-black text-sm flex items-center justify-center gap-2.5 transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-black dark:text-white hover:border-slate-400'
                }`}
              >
                <ArrowDownRight className="w-5 h-5" />
                <span>Egreso / Gasto</span>
              </button>

              <button
                type="button"
                id="btn-select-income"
                onClick={() => setType('INCOME')}
                className={`py-3.5 px-4 rounded-2xl border-2 font-black text-sm flex items-center justify-center gap-2.5 transition-all ${
                  type === 'INCOME'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-black dark:text-white hover:border-slate-400'
                }`}
              >
                <ArrowUpRight className="w-5 h-5" />
                <span>Ingreso</span>
              </button>
            </div>
          </div>

          {/* Step 2: Choose Bank */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                2. Elegir 1 de los Bancos Registrados *
              </label>
              <button
                type="button"
                onClick={() => setActiveTab('banks')}
                className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-bold"
              >
                + Gestionar Bancos
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {banks.map((b) => {
                const isSelected = selectedBankId === b.id;
                const calcBalance = getBankCalculatedBalance(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    id={`bank-option-${b.id}`}
                    onClick={() => setSelectedBankId(b.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all relative ${
                      isSelected
                        ? 'border-orange-500 bg-white dark:bg-slate-800 shadow-md ring-1 ring-orange-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: b.color }} 
                        />
                        <span className="font-black text-xs text-black dark:text-white truncate">
                          {b.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white text-black dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600">
                        {b.currency}
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-bold text-black dark:text-slate-300">
                      Saldo disponible:
                    </div>
                    <div className="text-sm font-black font-mono text-black dark:text-white">
                      {formatCurrency(calcBalance, b.currency)}
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 text-orange-500">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Category Picker */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                3. Categoría * ({type === 'EXPENSE' ? 'Gastos' : 'Ingresos'})
              </label>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-black"
              >
                + Añadir Nueva Categoría
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-1 scrollbar-thin">
              {availableCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    id={`category-option-${cat.id}`}
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-black text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-black dark:text-white hover:border-slate-300'
                    }`}
                  >
                    <div 
                      className={`p-1 rounded-lg shrink-0 ${isSelected ? 'bg-white/20 text-white' : ''}`}
                      style={{ color: isSelected ? '#ffffff' : cat.color }}
                    >
                      <CategoryIcon name={cat.iconName} size={16} />
                    </div>
                    <span className="truncate text-black dark:text-white">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Amount and Date/Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Amount / Suma */}
            <div className="md:col-span-1">
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2">
                4. Suma / Monto ({currentCurrency}) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-black text-black dark:text-slate-400">
                  {currentCurrency === 'PYG' ? '₲' : '$'}
                </div>
                <input
                  id="input-transaction-amount"
                  type="number"
                  step={currentCurrency === 'USD' ? '0.01' : '1'}
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder={currentCurrency === 'PYG' ? 'Ej: 350000' : 'Ej: 150.00'}
                  className="w-full pl-9 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-lg font-black font-mono text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2">
                Fecha *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="input-transaction-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-black text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2">
                Hora (Opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  id="input-transaction-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-black text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Step 5: Note (Opcional) */}
          <div>
            <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2">
              5. Nota / Concepto (Opcional)
            </label>
            <div className="relative">
              <div className="absolute top-3.5 left-3.5 text-black dark:text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                id="input-transaction-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Detalle o descripción de la transacción (ej: Pago de combustible, compra de generador...)"
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-black dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Orange Submit Button */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {editingTransactionId && (
              <button
                id="btn-cancel-edit-form"
                type="button"
                onClick={handleClearEditing}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-black dark:text-white font-black text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar Edición
              </button>
            )}

            <button
              id="btn-submit-transaction-form"
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 font-black text-xs text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-2xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>{editingTransactionId ? 'Guardar Cambios' : 'Registrar Transacción'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
