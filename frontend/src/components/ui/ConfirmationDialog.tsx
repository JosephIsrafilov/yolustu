'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
}: ConfirmationDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const headerColors = {
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-amber-100 text-amber-600',
    info: 'bg-blue-100 text-blue-600',
  };

  const iconName = {
    danger: 'alert-triangle' as const,
    warning: 'alert-triangle' as const,
    info: 'info' as const,
  };

  const confirmBtnStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const dialogContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#001f24]/30 p-4 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click */}
      <button 
        type="button" 
        className="absolute inset-0 cursor-default" 
        onClick={onClose} 
        aria-label="Close dialog"
      />

      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200 rounded-3xl bg-white p-6 shadow-[0_18px_50px_rgba(0,31,36,0.18)] border border-border">
        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${headerColors[variant]}`}>
            <Icon name={iconName[variant]} size={24} />
          </div>

          <h3 className="text-lg font-bold text-navy mb-2">{title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">{description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="rounded-2xl h-11"
          >
            {cancelLabel}
          </Button>
          <button 
            type="button"
            onClick={handleConfirm}
            className={`h-11 rounded-2xl text-sm font-bold shadow-md transition-all active:scale-[0.98] ${confirmBtnStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(dialogContent, document.body) : null;
}
