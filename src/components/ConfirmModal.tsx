import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Confirmar Exclusão',
  message,
  confirmLabel = 'Sim, Excluir',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#1A1816] border border-red-900/50 rounded-2xl shadow-2xl p-6 text-stone-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 p-1.5 rounded-full hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-red-950/80 border border-red-800 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold font-serif text-white">
            {title}
          </h3>
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider transition"
          >
            {cancelLabel}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 shadow-lg disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Excluindo...' : confirmLabel}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
