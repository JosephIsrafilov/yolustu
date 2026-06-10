'use client';

import React, { useRef } from 'react';
import Icon from '@/components/ui/Icon';
import {
  extractAzerbaijaniNationalDigits,
  formatAzerbaijaniPhone,
  getAzerbaijaniPhoneCursorBoundary,
  getAzerbaijaniPhoneCursorFromDigits,
  normalizeAzerbaijaniPhone,
} from '@/lib/azerbaijani-phone';

interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
}

export default function PhoneInput({
  label,
  value,
  onChange,
  error,
  autoComplete = 'tel',
}: PhoneInputProps) {
  const inputId = React.useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const formattedValue = formatAzerbaijaniPhone(value);

  const setCursor = (position: number) => {
    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      const boundary = getAzerbaijaniPhoneCursorBoundary(input.value);
      const safePosition = Math.min(Math.max(position, boundary), input.value.length);
      input.setSelectionRange(safePosition, safePosition);
    });
  };

  const moveCursorToBoundaryIfNeeded = () => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const boundary = getAzerbaijaniPhoneCursorBoundary(input.value);
    const selectionStart = input.selectionStart ?? boundary;
    const selectionEnd = input.selectionEnd ?? boundary;

    if (selectionStart < boundary || selectionEnd < boundary) {
      setCursor(boundary);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const normalizedValue = normalizeAzerbaijaniPhone(rawValue);
    const nextFormattedValue = formatAzerbaijaniPhone(normalizedValue);
    const selectionStart = event.target.selectionStart ?? rawValue.length;
    const digitsBeforeCursor = extractAzerbaijaniNationalDigits(rawValue.slice(0, selectionStart)).length;

    onChange(normalizedValue);
    setCursor(getAzerbaijaniPhoneCursorFromDigits(nextFormattedValue, digitsBeforeCursor));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const boundary = getAzerbaijaniPhoneCursorBoundary(input.value);
    const selectionStart = input.selectionStart ?? boundary;
    const selectionEnd = input.selectionEnd ?? boundary;
    const isCollapsed = selectionStart === selectionEnd;

    if ((event.key === 'Backspace' || event.key === 'Delete') && selectionStart <= boundary) {
      event.preventDefault();
      setCursor(boundary);
      return;
    }

    if (event.key === 'ArrowLeft' && isCollapsed && selectionStart <= boundary) {
      event.preventDefault();
      setCursor(boundary);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setCursor(boundary);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedValue = event.clipboardData.getData('text');
    event.preventDefault();
    onChange(normalizeAzerbaijaniPhone(pastedValue));
    setCursor(formatAzerbaijaniPhone(pastedValue).length);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[14px] font-semibold text-[#011f23]">{label}</label>
      <div className="relative">
        <Icon name="phone" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
        <input
          id={inputId}
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          value={formattedValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={moveCursorToBoundaryIfNeeded}
          onClick={moveCursorToBoundaryIfNeeded}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all"
          aria-invalid={!!error}
        />
      </div>
      {error && <p className="text-[12px] text-[#ba1a1a]">{error}</p>}
    </div>
  );
}
