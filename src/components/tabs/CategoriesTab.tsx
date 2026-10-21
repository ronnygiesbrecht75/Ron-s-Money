import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Category, TransactionType } from '../../types';
import { 
  FolderTree, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Tag, 
  ArrowDownRight, 
  ArrowUpRight,
  Layers,
  Sparkles,
  Palette
} from 'lucide-react';
import { CategoryIcon } from '../CategoryIcon';
import { ConfirmationModal } from '../ConfirmationModal';

const AVAILABLE_COLORS = [
  '#059669', '#10b981', '#f97316', '#ea580c', '#0284c7', 
  '#2563eb', '#7c3aed', '#db2777', '#e11d48', '#d97706',
  '#64748b', '#0f766e'
];

const AVAILABLE_ICONS = [
  'Home', 'TreePine', 'Utensils', 'Car', 'Receipt', 
  'Zap', 'ShieldCheck', 'Percent', 'CreditCard', 'TrendingUp', 
  'Fuel', 'Hammer', 'Wrench', 'Briefcase', 'DollarSign', 
  'PiggyBank', 'ShoppingBag', 'HeartPulse', 'GraduationCap', 'Plane'
];

export const CategoriesTab: React.FC = () => {
  const { categories, transactions, addCategory, updateCategory, deleteCategory } = useApp();

  // Form states
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [iconName, setIconName] = useState('Home');
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab filter inside categories
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');

  // Deletion modal state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleStartEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setName(category.name);
    setType(category.type);
    setColor(category.color);
    setIconName(category.iconName);
    setFormError(null);
  };

  const handleCancelForm = () => {
    setEditingCategoryId(null);
    setName('');
    setType('EXPENSE');
    setColor(AVAILABLE_COLORS[0]);
    setIconName('Home');
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('El nombre de la categoría es obligatorio.');
      return;
    }

    if (editingCategoryId) {
      updateCategory(editingCategoryId, {
        name: name.trim(),
        type,
        color,
        iconName,
      });
      setToastMessage(`Categoría "${name}" actualizada correctamente.`);
    } else {
      addCategory({
        name: name.trim(),
        type,
        color,
        iconName,
      });
      setToastMessage(`Categoría "${name}" agregada con éxito.`);
    }

    setTimeout(() => setToastMessage(null), 3000);
    handleCancelForm();
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
      setToastMessage('Categoría eliminada.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const filteredCategories = categories.filter(c => {
    if (filterType === 'ALL') return true;
    return c.type === filterType;
  });

  return (
    <div id="tab-categories-container" className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40">
            <FolderTree className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Configuración de Categorías
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-zinc-100 mt-1">
            Categorías de Ingresos & Gastos
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
            Agrega o edita categorías personalizadas con íconos y colores para organizar tus finanzas.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-emerald-950/60 border border-emerald-500 text-emerald-800 dark:text-emerald-200 text-xs font-black flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Form + Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form: Agregar / Editar Categoría */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-base font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" />
              {editingCategoryId ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
            </h3>
            {editingCategoryId && (
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center gap-1 font-bold"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {formError && (
              <div className="p-2.5 rounded-xl bg-white dark:bg-rose-950/50 border border-rose-400 text-rose-700 text-xs font-bold">
                {formError}
              </div>
            )}

            {/* Type selector (Ingreso o Gasto) */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-zinc-200 uppercase tracking-wider mb-1.5">
                Tipo de Categoría *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-cat-type-expense"
                  onClick={() => setType('EXPENSE')}
                  className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    type === 'EXPENSE'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Para Gastos</span>
                </button>
                <button
                  type="button"
                  id="btn-cat-type-income"
                  onClick={() => setType('INCOME')}
                  className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    type === 'INCOME'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Para Ingresos</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-zinc-200 uppercase tracking-wider mb-1.5">
                Nombre de la Categoría *
              </label>
              <input
                id="input-category-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormError(null);
                }}
                placeholder="Ej: Inversión en Cripto, Patio..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-zinc-200 uppercase tracking-wider mb-1.5">
                Color Identificador
              </label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
                {AVAILABLE_COLORS.map((c) => (
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

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-zinc-200 uppercase tracking-wider mb-1.5">
                Ícono
              </label>
              <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-2 bg-white dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 scrollbar-thin">
                {AVAILABLE_ICONS.map((ic) => {
                  const isSelected = iconName === ic;
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIconName(ic)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-orange-500 text-white shadow-xs' 
                          : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <CategoryIcon name={ic} size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orange Submit Button */}
            <div className="pt-2">
              <button
                id="btn-submit-category"
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{editingCategoryId ? 'Guardar Cambios' : 'Agregar Categoría'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-base font-black text-slate-800 dark:text-zinc-100">
              Lista de Categorías ({filteredCategories.length})
            </h3>

            {/* Tab filter inside */}
            <div className="inline-flex p-1 bg-white dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  filterType === 'ALL'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFilterType('EXPENSE')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  filterType === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                Gastos
              </button>
              <button
                type="button"
                onClick={() => setFilterType('INCOME')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  filterType === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                Ingresos
              </button>
            </div>
          </div>

          {/* Grid of Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredCategories.map((cat) => {
              const txCount = transactions.filter(t => t.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  id={`category-card-${cat.id}`}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 flex items-center justify-between group hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.iconName} size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 dark:text-zinc-100 truncate">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-slate-600 dark:text-zinc-400 font-bold">
                        {cat.type === 'INCOME' ? 'Ingreso' : 'Gasto'} • {txCount} transacciones
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      title="Editar categoría"
                      className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors font-black"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(cat)}
                      title="Eliminar categoría"
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-black"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={!!categoryToDelete}
        title="¿Eliminar Categoría?"
        message={
          categoryToDelete 
            ? `¿Estás seguro de que deseas eliminar la categoría "${categoryToDelete.name}"? Las transacciones existentes conservarán su registro.`
            : ''
        }
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
};
