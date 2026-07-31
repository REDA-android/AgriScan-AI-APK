import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { LiquidCard, LiquidButton } from './LiquidGlass';

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
  isDestructive = true
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[7000]"
            onClick={onCancel}
          />
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[340px] z-[7001]"
          >
            <LiquidCard className="p-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-500/15 border border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'}`}>
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-2 tracking-tight">{title}</h3>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">{message}</p>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 rounded-2xl border border-white/15 text-slate-300 font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {cancelText}
                </button>
                <LiquidButton
                  onClick={onConfirm}
                  primary={!isDestructive}
                  className={`flex-1 !py-3 !text-sm ${
                    isDestructive 
                    ? '!bg-red-500/20 !text-red-300 !border-red-500/40 hover:!bg-red-500 hover:!text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                    : ''
                  }`}
                >
                  {confirmText}
                </LiquidButton>
              </div>
            </LiquidCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
