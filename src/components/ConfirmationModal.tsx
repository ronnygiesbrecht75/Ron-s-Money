import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="confirmation-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <motion.div
          id="confirmation-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md bg-white dark:bg-[#12231e] border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl shadow-2xl p-6 text-black dark:text-white overflow-hidden"
        >
          <button
            id="btn-close-confirm-modal"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-black dark:hover:text-white hover:bg-emerald-50 dark:hover:bg-[#18352b] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${
              isDestructive 
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800' 
                : 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-800'
            }`}>
              {isDestructive ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>

            <div className="flex-1 pr-4">
              <h3 id="confirm-modal-title" className="text-lg font-black text-black dark:text-white">
                {title}
              </h3>
              <p id="confirm-modal-description" className="mt-2 text-sm text-black dark:text-slate-200 font-medium leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-emerald-100 dark:border-emerald-900/60">
            <button
              id="btn-cancel-action"
              onClick={onCancel}
              type="button"
              className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-[#18352b] rounded-xl transition-colors"
            >
              {cancelText}
            </button>
            <button
              id="btn-confirm-action"
              onClick={onConfirm}
              type="button"
              className={`px-5 py-2.5 text-xs font-black text-white rounded-xl shadow-md transition-all ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/30'
                  : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 shadow-orange-500/30'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
