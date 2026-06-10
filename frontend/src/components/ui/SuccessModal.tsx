'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  buttonLabel?: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  description,
  buttonLabel = 'OK',
}: SuccessModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#001f24]/30 p-4 backdrop-blur-sm animate-fade-in">
      <button 
        type="button" 
        className="absolute inset-0 cursor-default" 
        onClick={onClose} 
        aria-label="Close modal"
      />

      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 rounded-3xl bg-white p-6 text-center shadow-[0_18px_50px_rgba(0,31,36,0.18)] border border-border">
        {/* Animated Checkmark Wrapper */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce-short">
          <Icon name="check" size={32} />
        </div>

        <h3 className="text-xl font-bold text-navy mb-2">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-6">{description}</p>

        <Button 
          type="button" 
          onClick={onClose}
          className="w-full h-11 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
