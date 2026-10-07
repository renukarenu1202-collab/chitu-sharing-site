import React from 'react';
import { AlertTriangle, Globe, Lock, CheckCircle2, X } from 'lucide-react';

export interface ConfirmationModalConfig {
  isOpen: boolean;
  type: 'make_public' | 'revoke_public';
  title: string;
  description: string;
  itemCount: number;
  itemNames?: string[];
  confirmButtonText: string;
  confirmButtonColor?: 'emerald' | 'amber' | 'rose' | 'blue';
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalConfig> = ({
  isOpen,
  type,
  title,
  description,
  itemCount,
  itemNames = [],
  confirmButtonText,
  confirmButtonColor = 'emerald',
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  const isMakePublic = type === 'make_public';

  const colorStyles = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 focus:ring-emerald-500',
    amber: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 focus:ring-amber-500',
    rose: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 focus:ring-rose-500',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 focus:ring-blue-500',
  }[confirmButtonColor];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className={`h-2 ${isMakePublic ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'}`} />

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isMakePublic
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isMakePublic ? (
                <Globe className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isProcessing}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {description}
              </p>

              {/* Items preview preview pills */}
              {itemNames.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>
                      Affected item{itemCount > 1 ? 's' : ''} ({itemCount}):
                    </span>
                  </div>
                  <ul className="space-y-1 max-h-32 overflow-y-auto pr-1 text-xs text-slate-700 dark:text-slate-300">
                    {itemNames.slice(0, 5).map((name, idx) => (
                      <li key={idx} className="truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span className="truncate">{name}</span>
                      </li>
                    ))}
                    {itemNames.length > 5 && (
                      <li className="text-slate-400 italic pt-1">
                        ...and {itemNames.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Security notice */}
              <div className="mt-4 flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <span>
                  {isMakePublic
                    ? 'Anyone with the link will be able to view this image without requiring a Google sign-in. You can revoke access at any time.'
                    : 'Revoking public access removes the public share link. Only you and explicitly authorized Google accounts will have access.'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={onConfirm}
              className={`px-5 py-2 text-sm font-semibold rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-offset-2 flex items-center gap-2 cursor-pointer disabled:opacity-50 ${colorStyles}`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{confirmButtonText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
