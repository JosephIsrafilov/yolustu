'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { I18N } from '@/lib/i18n';

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

export default function TimePicker({
  value,
  onChange,
  label = 'Vaxt',
  placeholder = 'Vaxt seçin',
  className,
  error,
}: TimePickerProps) {
  const { language } = useAppStore();
  const t = I18N[language].createTrip.timePicker || {
    presets: 'Sürətli seçimlər',
    hour: 'Saat',
    minute: 'Dəqiqə',
    now: 'İndi',
    morning: 'Səhər (08:00)',
    afternoon: 'Günorta (13:00)',
    evening: 'Axşam (18:00)',
    night: 'Gecə (21:00)',
    confirm: 'Təsdiqlə',
    selectTime: 'Vaxt seçin',
  };

  const [open, setOpen] = useState(false);
  const [draftHour, setDraftHour] = useState(12);
  const [draftMinute, setDraftMinute] = useState(0);

  const hoursContainerRef = useRef<HTMLDivElement>(null);
  const minutesContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutHRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutMRef = useRef<NodeJS.Timeout | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Open handler
  const openPicker = () => {
    let h = 12, m = 0;
    if (value && value.includes(':')) {
      const parts = value.split(':').map(Number);
      if (!isNaN(parts[0]) && !isNaN(parts[1])) {
        h = parts[0];
        m = parts[1];
      }
    } else {
      const now = new Date();
      h = now.getHours();
      m = Math.round(now.getMinutes() / 5) * 5;
      if (m >= 60) {
        h = (h + 1) % 24;
        m = 0;
      }
    }
    setDraftHour(h);
    setDraftMinute(m);
    setOpen(true);
  };

  // Scroll to initial positions when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (hoursContainerRef.current) {
          const el = hoursContainerRef.current.querySelector(`[data-val="${draftHour}"]`);
          if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
        }
        if (minutesContainerRef.current) {
          const el = minutesContainerRef.current.querySelector(`[data-val="${draftMinute}"]`);
          if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
        }
      }, 50); // slight delay to allow render
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Scroll Event Handlers to sync state (debounced)
  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, setter: (v: number) => void) => {
    if (!ref.current) return;
    const container = ref.current;
    const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2;
    
    let closestItem: Element | null = null;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child) => {
      const rect = child.getBoundingClientRect();
      const childCenter = rect.top + rect.height / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestItem = child;
      }
    });

    if (closestItem) {
      const val = (closestItem as HTMLElement).dataset.val;
      if (val !== undefined) {
        setter(Number(val));
      }
    }
  };

  const onHoursScroll = () => {
    if (scrollTimeoutHRef.current) clearTimeout(scrollTimeoutHRef.current);
    scrollTimeoutHRef.current = setTimeout(() => handleScroll(hoursContainerRef, setDraftHour), 100);
  };

  const onMinutesScroll = () => {
    if (scrollTimeoutMRef.current) clearTimeout(scrollTimeoutMRef.current);
    scrollTimeoutMRef.current = setTimeout(() => handleScroll(minutesContainerRef, setDraftMinute), 100);
  };

  const confirm = () => {
    const formatted = `${String(draftHour).padStart(2, '0')}:${String(draftMinute).padStart(2, '0')}`;
    onChange(formatted);
    setOpen(false);
  };

  const setPreset = (time: string) => {
    let h = 12, m = 0;
    if (time === 'now') {
      const now = new Date();
      h = now.getHours();
      m = Math.round(now.getMinutes() / 5) * 5;
      if (m >= 60) {
        h = (h + 1) % 24;
        m = 0;
      }
    } else {
      const parts = time.split(':').map(Number);
      h = parts[0];
      m = parts[1];
    }
    setDraftHour(h);
    setDraftMinute(m);
    
    // Animate scroll
    if (hoursContainerRef.current) {
      const el = hoursContainerRef.current.querySelector(`[data-val="${h}"]`);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    if (minutesContainerRef.current) {
      const el = minutesContainerRef.current.querySelector(`[data-val="${m}"]`);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };

  const hoursList = Array.from({ length: 24 }, (_, i) => i);
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const timePickerDialog = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#001f24]/30 backdrop-blur-sm animate-in fade-in duration-200 md:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={() => setOpen(false)}
      />

      <div className="animate-in slide-in-from-bottom-full duration-300 relative flex w-full max-w-sm flex-col rounded-t-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(0,31,36,0.20)] md:rounded-[28px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">{t.selectTime}</p>
            <h2 className="text-2xl font-black text-text">
              {String(draftHour).padStart(2, '0')}:{String(draftMinute).padStart(2, '0')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-text-muted transition-all hover:bg-surface-muted-strong active:scale-95"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Scroll Picker */}
        <div className="relative mb-6 flex h-48 justify-center overflow-hidden rounded-2xl bg-surface-muted/30 p-2 border border-border">
          {/* Highlight Selection Box */}
          <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 bg-white/60 shadow-sm border-y border-border pointer-events-none" />
          
          <div className="flex w-full max-w-[200px] justify-between px-6">
            {/* Hours Column */}
            <div 
              ref={hoursContainerRef}
              onScroll={onHoursScroll}
              className="no-scrollbar h-full w-16 overflow-y-scroll snap-y snap-mandatory scroll-smooth"
            >
              <div className="h-[72px]" /> {/* Top padding */}
              {hoursList.map((h) => (
                <div 
                  key={h} 
                  data-val={h}
                  className={cn(
                    "flex h-12 items-center justify-center snap-center text-2xl transition-all duration-200 cursor-pointer select-none",
                    draftHour === h ? "font-bold text-brand-600 scale-110" : "font-medium text-text-muted/60 hover:text-text"
                  )}
                  onClick={() => {
                    setDraftHour(h);
                    if (hoursContainerRef.current) {
                      const el = hoursContainerRef.current.querySelector(`[data-val="${h}"]`);
                      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                  }}
                >
                  {String(h).padStart(2, '0')}
                </div>
              ))}
              <div className="h-[72px]" /> {/* Bottom padding */}
            </div>

            <div className="flex h-full items-center justify-center text-2xl font-black text-text/30 pb-1">:</div>

            {/* Minutes Column */}
            <div 
              ref={minutesContainerRef}
              onScroll={onMinutesScroll}
              className="no-scrollbar h-full w-16 overflow-y-scroll snap-y snap-mandatory scroll-smooth"
            >
              <div className="h-[72px]" /> {/* Top padding */}
              {minutesList.map((m) => (
                <div 
                  key={m} 
                  data-val={m}
                  className={cn(
                    "flex h-12 items-center justify-center snap-center text-2xl transition-all duration-200 cursor-pointer select-none",
                    draftMinute === m ? "font-bold text-brand-600 scale-110" : "font-medium text-text-muted/60 hover:text-text"
                  )}
                  onClick={() => {
                    setDraftMinute(m);
                    if (minutesContainerRef.current) {
                      const el = minutesContainerRef.current.querySelector(`[data-val="${m}"]`);
                      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                  }}
                >
                  {String(m).padStart(2, '0')}
                </div>
              ))}
              <div className="h-[72px]" /> {/* Bottom padding */}
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setPreset('now')} className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-muted transition-colors active:scale-95 flex items-center gap-1.5 shadow-sm">
              <Icon name="clock" size={14} className="text-brand-600" /> {t.now}
            </button>
            <button type="button" onClick={() => setPreset('08:00')} className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-muted transition-colors active:scale-95 shadow-sm">
              {t.morning}
            </button>
            <button type="button" onClick={() => setPreset('13:00')} className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-muted transition-colors active:scale-95 shadow-sm">
              {t.afternoon}
            </button>
            <button type="button" onClick={() => setPreset('18:00')} className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-muted transition-colors active:scale-95 shadow-sm">
              {t.evening}
            </button>
            <button type="button" onClick={() => setPreset('21:00')} className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-muted transition-colors active:scale-95 shadow-sm">
              {t.night}
            </button>
          </div>
        </div>

        {/* Action */}
        <button
          type="button"
          onClick={confirm}
          className="h-12 w-full rounded-2xl bg-brand-600 text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(40,167,69,0.3)] transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-[0_6px_20px_rgba(40,167,69,0.4)] active:translate-y-0 active:scale-[0.98]"
        >
          {t.confirm}
        </button>
      </div>
    </div>
  );

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}

      <button
        type="button"
        onClick={openPicker}
        className={cn(
          'relative flex h-[46px] w-full items-center rounded-xl border bg-white pl-10 pr-4 text-left text-sm text-text shadow-sm transition-all focus:outline-none focus:ring-2 active:scale-[0.99]',
          error
            ? 'border-danger-500 focus:ring-danger-500'
            : 'border-border hover:border-border-strong focus:ring-brand-500'
        )}
      >
        <Icon name="clock" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <span className={value ? 'text-text font-medium' : 'text-text-muted'}>
          {value || placeholder}
        </span>
      </button>

      {error && <p className="text-xs text-danger-500">{error}</p>}

      {open && typeof document !== 'undefined' && createPortal(timePickerDialog, document.body)}
    </div>
  );
}
