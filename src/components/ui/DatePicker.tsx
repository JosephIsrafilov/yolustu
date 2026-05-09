'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

type DatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: Date;
  className?: string;
};

const WEEKDAYS = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'];
const MONTHS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'İyun',
  'İyul',
  'Avqust',
  'Sentyabr',
  'Oktyabr',
  'Noyabr',
  'Dekabr',
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseISODate(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateLabel(value?: string) {
  const selected = parseISODate(value);
  if (!selected) return '';

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const selectedISO = toISODate(selected);
  if (selectedISO === toISODate(today)) return 'Bu gün';
  if (selectedISO === toISODate(tomorrow)) return 'Sabah';

  return `${selected.getDate()} ${MONTHS[selected.getMonth()]} ${selected.getFullYear()}`;
}

function getCalendarDays(viewDate: Date) {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  return [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1)),
  ];
}

export default function DatePicker({
  value,
  onChange,
  label = 'Tarix',
  placeholder = 'Tarix seçin',
  minDate,
  className,
}: DatePickerProps) {
  const minimumDate = useMemo(() => startOfDay(minDate ?? new Date()), [minDate]);
  const selectedDate = parseISODate(value);
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value ?? '');
  const [viewDate, setViewDate] = useState(selectedDate ?? minimumDate);

  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const selectedLabel = formatDateLabel(value);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const changeMonth = (offset: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const openPicker = () => {
    setDraftValue(value ?? '');
    setViewDate(parseISODate(value) ?? minimumDate);
    setOpen(true);
  };

  const confirm = () => {
    if (draftValue) onChange(draftValue);
    setOpen(false);
  };

  const calendarDialog = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#001f24]/20 px-3 pb-3 pt-14 backdrop-blur-[1px] animate-fade-in md:items-center md:bg-[#001f24]/15 md:p-6">
      <button
        type="button"
        aria-label="Bağla"
        className="absolute inset-0 cursor-default"
        onClick={() => setOpen(false)}
      />

      <div className="animate-slide-up relative flex max-h-[85dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-[28px] bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_18px_50px_rgba(0,31,36,0.20)] transition-all duration-200 ease-out md:max-h-[80vh] md:max-w-[440px] md:rounded-[24px] md:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">Tarix</p>
            <h2 className="text-lg font-bold text-text">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-2 text-text-muted transition-all duration-200 ease-out hover:bg-surface-muted active:scale-[0.96]"
            aria-label="Bağla"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="rounded-full border border-border bg-white p-2 text-text transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-surface-muted active:translate-y-0 active:scale-[0.96]"
            aria-label="Əvvəlki ay"
          >
            <Icon name="arrow-left" size={18} />
          </button>
          <div className="min-w-0 truncate rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-text-secondary">
            {formatDateLabel(draftValue) || placeholder}
          </div>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="rounded-full border border-border bg-white p-2 text-text transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-surface-muted active:translate-y-0 active:scale-[0.96]"
            aria-label="Növbəti ay"
          >
            <Icon name="arrow-right" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center md:gap-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1.5 text-[11px] font-bold uppercase text-text-muted md:py-1">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} />;

            const iso = toISODate(day);
            const disabled = startOfDay(day) < minimumDate;
            const selected = draftValue === iso;
            const today = iso === toISODate(new Date());

            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => setDraftValue(iso)}
                className={cn(
                  'mx-auto flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-200 ease-out md:h-9 md:w-9 md:rounded-xl',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500',
                  selected && 'bg-brand-600 text-white shadow-md',
                  !selected && !disabled && 'text-text hover:-translate-y-0.5 hover:bg-surface-muted active:translate-y-0 active:scale-[0.96]',
                  today && !selected && !disabled && 'border border-brand-200 text-brand-700',
                  disabled && 'cursor-not-allowed text-text-muted/35',
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        <div className="sticky bottom-0 -mx-4 mt-4 grid grid-cols-2 gap-3 bg-white px-4 pt-3 pb-[env(safe-area-inset-bottom)] md:static md:mx-0 md:mt-4 md:p-0">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-11 rounded-2xl border border-border bg-white text-sm font-bold text-text transition-all duration-200 ease-out hover:bg-surface-muted active:scale-[0.98] md:h-10"
          >
            Bağla
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!draftValue}
            className="h-11 rounded-2xl bg-brand-600 text-sm font-bold text-white shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:h-10"
          >
            Təsdiqlə
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}

      <button
        type="button"
        onClick={openPicker}
        className="relative flex h-12 w-full items-center rounded-2xl border border-border bg-white pl-10 pr-4 text-left text-sm text-text shadow-sm transition-all duration-200 ease-out hover:border-border-strong hover:bg-surface-muted/40 focus:outline-none focus:ring-2 focus:ring-brand-500 active:scale-[0.99]"
      >
        <Icon name="calendar" size={18} className="absolute left-3 text-text-muted" />
        <span className={selectedLabel ? 'text-text' : 'text-text-muted'}>
          {selectedLabel || placeholder}
        </span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(calendarDialog, document.body)}
    </div>
  );
}
