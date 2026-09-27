import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bank, CurrencyType } from '../../types';
import { 
  Landmark, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  CreditCard, 
  Wallet, 
  DollarSign,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmationModal } from '../ConfirmationModal';

const BANK_COLORS = [
  '#059669', '#10b981', '#f97316', '#ea580c', '#0284c7', 
  '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#475569'
];

export const BanksTab: React.FC = () => {
  const { 
    banks, 
    transactions, 
    addBank, 
    updateBank, 
    deleteBank, 
    getBankCalculatedBalance,
    getTotalBalanceByCurrency 
  } = useApp();

  const pygTotal = getTotalBalanceByCurrency('PYG');
  const usdTotal = getTotalBalanceByCurrency('USD');

  // Form states
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<CurrencyType>('PYG');
  const [initialBalanceStr, setInitialBalanceStr] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankType, setBankType] = useState<Bank['type']>('checking');
  const [color, setColor] = useState(BANK_COLORS[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deletion modal state
  const [bankToDelete, setBankToDelete] = useState<Bank | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleStartEdit = (bank: Bank) => {
    setEditingBankId(bank.id);
    setName(bank.name);
    setCurrency(bank.currency);
    setInitialBalanceStr(bank.initialBalance.toString());
    setAccountNumber(bank.accountNumber || '');
    setBankType(bank.type);
    setColor(bank.color);
    setFormError(null);
  };

  const handleCancelForm = () => {
    setEditingBankId(null);
    setName('');
    setCurrency('PYG');
    setInitialBalanceStr('');
    setAccountNumber('');
    setBankType('checking');
    setColor(BANK_COLORS[0]);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('El nombre del banco o cuenta es obligatorio.');
      return;
    }

    const initialNum = parseFloat(initialBalanceStr) || 0;

    if (editingBankId) {
      updateBank(editingBankId, {
        name: name.trim(),
        currency,
        initialBalance: initialNum,
        accountNumber: accountNumber.trim() || undefined,
        type: bankType,
        color,
      });
      setToastMessage(`Banco "${name}" actualizado con éxito.`);
    } else {
      addBank({
        name: name.trim(),
        currency,
        initialBalance: initialNum,
        accountNumber: accountNumber.trim() || undefined,
        type: bankType,
        color,
      });
      setToastMessage(`Banco "${name}" registrado correctamente.`);
    }

    setTimeout(() => setToastMessage(null), 3500);
    handleCancelForm();
  };

  const handleConfirmDelete = () => {
    if (bankToDelete) {
      const result = deleteBank(bankToDelete.id);
      if (!result.success) {
        setDeleteErrorMessage(result.error || 'No se puede eliminar el banco.');
      } else {
        setBankToDelete(null);
        setDeleteErrorMessage(null);
        setToastMessage('Banco eliminado con éxito.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  };

  return (
    <div id="tab-banks-container" className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
            <Landmark className="w-3.5 h-3.5" />
            Entidades & Cuentas
          </div>
          <h2 className="text-2xl font-black tracking-tight text-black dark:text-white mt-1">
            Gestión de Bancos
          </h2>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            Administra tus cuentas bancarias y efectivo en Guaraníes (PYG ₲) y Dólares (USD $).
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Balances Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-slate-900 dark:bg-slate-800 text-white shadow-md relative overflow-hidden border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Saldo Total en Guaraníes
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-xs font-black">
              PYG ₲
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-2">
            {formatCurrency(pygTotal.net, 'PYG')}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-300 pt-3 border-t border-slate-700/60 font-bold">
            <div>Inicial: <span className="font-mono">{formatCurrency(pygTotal.initial, 'PYG')}</span></div>
            <div>Ingresos: <span className="font-mono">+{formatCurrency(pygTotal.income, 'PYG')}</span></div>
            <div>Gastos: <span className="font-mono">-{formatCurrency(pygTotal.expense, 'PYG')}</span></div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 dark:bg-slate-800 text-white shadow-md border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Saldo Total en Dólares
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-xs font-black">
              USD $
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-2">
            {formatCurrency(usdTotal.net, 'USD')}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-300 pt-3 border-t border-slate-700/60 font-bold">
            <div>Inicial: <span className="font-mono">{formatCurrency(usdTotal.initial, 'USD')}</span></div>
            <div>Ingresos: <span className="font-mono">+{formatCurrency(usdTotal.income, 'USD')}</span></div>
            <div>Gastos: <span className="font-mono">-{formatCurrency(usdTotal.expense, 'USD')}</span></div>
          </div>
        </div>
      </div>

      {/* Grid: Form (Add/Edit) + Bank Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form: Tabla para Registrar / Editar Bancos */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black text-black dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" />
              {editingBankId ? 'Editar Banco' : 'Agregar Nuevo Banco'}
            </h3>
            {editingBankId && (
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-xs text-slate-500 hover:text-black dark:hover:text-white flex items-center gap-1 font-bold"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {formError && (
              <div className="p-2.5 rounded-xl bg-white dark:bg-rose-950/50 border border-rose-400 text-rose-700 dark:text-rose-300 text-xs font-bold">
                {formError}
              </div>
            )}

            {/* Currency Choice (Guaraní y Dólares) */}
            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
                Moneda de la Cuenta *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-bank-curr-pyg"
                  onClick={() => setCurrency('PYG')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    currency === 'PYG'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-black dark:text-white'
                  }`}
                >
                  <span>Guaraníes (₲ PYG)</span>
                </button>
                <button
                  type="button"
                  id="btn-bank-curr-usd"
                  onClick={() => setCurrency('USD')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    currency === 'USD'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-black dark:text-white'
                  }`}
                >
                  <span>Dólares ($ USD)</span>
                </button>
              </div>
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
                Nombre del Banco / Cuenta *
              </label>
              <input
                id="input-bank-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormError(null);
                }}
                placeholder="Ej: Banco Continental, Itaú, Efectivo..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Initial Balance */}
            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
                Saldo Inicial ({currency === 'PYG' ? '₲' : '$'})
              </label>
              <input
                id="input-bank-initial-balance"
                type="number"
                step={currency === 'USD' ? '0.01' : '1'}
                value={initialBalanceStr}
                onChange={(e) => setInitialBalanceStr(e.target.value)}
                placeholder={currency === 'PYG' ? 'Ej: 5000000' : 'Ej: 1000'}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-black dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Account Number or Reference */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
                  N° de Cuenta / Ref
                </label>
                <input
                  id="input-bank-account-num"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Ej: •••• 4821"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
                  Tipo de Cuenta
                </label>
                <select
                  id="select-bank-type"
                  value={bankType}
                  onChange={(e) => setBankType(e.target.value as Bank['type'])}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-black dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                >
                  <option value="checking">Cuenta Corriente</option>
                  <option value="savings">Caja de Ahorro</option>
                  <option value="cash">Efectivo / Billetera</option>
                  <option value="credit">Línea de Crédito</option>
                </select>
              </div>
            </div>

            {/* Color Tag */}
            <div>
              <label className="block text-xs font-black text-black dark:text-white uppercase tracking-wider mb-1.5">
                Color de la Tarjeta
              </label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                {BANK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-orange-500 ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Orange Submit Button */}
            <div className="pt-2">
              <button
                id="btn-submit-bank"
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{editingBankId ? 'Guardar Cambios del Banco' : 'Registrar Banco'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Bank List & Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-black dark:text-white">
                Lista de Bancos Registrados ({banks.length})
              </h3>
              <span className="text-xs font-bold text-black dark:text-slate-300">
                Saldos en tiempo real
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {banks.map((b) => {
                const currentBalance = getBankCalculatedBalance(b.id);
                const txCount = transactions.filter(t => t.bankId === b.id).length;

                return (
                  <div
                    key={b.id}
                    id={`bank-card-display-${b.id}`}
                    className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-all shadow-2xs"
                  >
                    {/* Top color accent strip */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1.5" 
                      style={{ backgroundColor: b.color }} 
                    />

                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3.5 h-3.5 rounded-full shadow-2xs" 
                            style={{ backgroundColor: b.color }} 
                          />
                          <h4 className="font-black text-sm text-black dark:text-white">
                            {b.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-black dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600">
                          {b.currency}
                        </span>
                      </div>

                      <div className="text-[11px] text-black dark:text-slate-300 mt-1 font-mono font-bold">
                        {b.accountNumber || 'Cuenta sin N°'}
                      </div>

                      <div className="mt-4">
                        <div className="text-[10px] font-black text-black dark:text-slate-300 uppercase tracking-wider">
                          Saldo Actual Calculado:
                        </div>
                        <div className="text-xl font-black font-mono text-black dark:text-white mt-0.5">
                          {formatCurrency(currentBalance, b.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-[10px] text-black dark:text-slate-300 font-bold">
                        {txCount} transacciones
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          id={`btn-edit-bank-${b.id}`}
                          onClick={() => handleStartEdit(b)}
                          title="Editar banco"
                          className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors font-bold"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          id={`btn-delete-bank-${b.id}`}
                          onClick={() => setBankToDelete(b)}
                          title="Eliminar banco"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-bold"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={!!bankToDelete}
        title="¿Eliminar Banco / Cuenta?"
        message={
          deleteErrorMessage 
            ? deleteErrorMessage 
            : bankToDelete 
            ? `¿Estás seguro de que deseas eliminar la cuenta "${bankToDelete.name}" (${bankToDelete.currency})?` 
            : ''
        }
        confirmText={deleteErrorMessage ? 'Entendido' : 'Sí, Eliminar'}
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          if (deleteErrorMessage) {
            setDeleteErrorMessage(null);
            setBankToDelete(null);
          } else {
            handleConfirmDelete();
          }
        }}
        onCancel={() => {
          setBankToDelete(null);
          setDeleteErrorMessage(null);
        }}
      />
    </div>
  );
};
