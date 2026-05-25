'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import Icon, { type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[] | readonly string[] | string[] | number[];
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  icon?: IconName;
  ariaLabel?: string;
}

export default function Select({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select option',
  error,
  disabled = false,
  searchable = false,
  icon,
  ariaLabel,
}: SelectProps) {
  const { language } = useAppStore();
  const searchPlaceholder = language === 'az' ? 'Axtar...' : language === 'ru' ? 'Поиск...' : 'Search...';
  const notFoundText = language === 'az' ? 'Nəticə tapılmadı' : language === 'ru' ? 'Ничего не найдено' : 'No results found';
  
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [placement, setPlacement] = useState<'down' | 'up'>('down');
  const [animationState, setAnimationState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    left: -9999,
    top: -9999,
  });
  const listboxId = useId();

  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const openRafRef1 = useRef<number | null>(null);
  const openRafRef2 = useRef<number | null>(null);

  const openDropdown = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setShouldRender(true);
    setAnimationState('closed');
    setIsOpen(true);
    setSearch('');
  };

  const closeDropdown = () => {
    if (openRafRef1.current) {
      cancelAnimationFrame(openRafRef1.current);
      openRafRef1.current = null;
    }
    if (openRafRef2.current) {
      cancelAnimationFrame(openRafRef2.current);
      openRafRef2.current = null;
    }
    setAnimationState('closing');
    setIsOpen(false);
  };

  const normalizedOptions = React.useMemo((): SelectOption[] => {
    return options.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        const o = opt as SelectOption;
        return { value: o.value, label: o.label };
      }
      return { value: opt as string | number, label: String(opt) };
    });
  }, [options]);

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (openRafRef1.current) cancelAnimationFrame(openRafRef1.current);
      if (openRafRef2.current) cancelAnimationFrame(openRafRef2.current);
    };
  }, []);

  // Manage shouldRender for transition-out
  useEffect(() => {
    if (isOpen || !shouldRender) return;
    closeTimerRef.current = setTimeout(() => {
      setShouldRender(false);
      setIsPositioned(false);
      setAnimationState('closed');
    }, 200);
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen, shouldRender]);

  // Transition from closed to open once positioned
  useEffect(() => {
    if (isPositioned && isOpen && animationState === 'closed') {
      openRafRef1.current = requestAnimationFrame(() => {
        setAnimationState('opening');
        openRafRef2.current = requestAnimationFrame(() => {
          setAnimationState('open');
        });
      });
    }
  }, [isPositioned, isOpen, animationState]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideTrigger = containerRef.current?.contains(target);
      const clickedInsideDropdown = dropdownRef.current?.contains(target);
      if (!clickedInsideTrigger && !clickedInsideDropdown) {
        closeDropdown();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!shouldRender) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      const dropdownEl = dropdownRef.current;
      if (!rect) return;

      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        closeDropdown();
        return;
      }

      const viewportPadding = 8;
      const dropdownHeight = dropdownEl?.offsetHeight || 240;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;
      setPlacement(openUpward ? 'up' : 'down');

      const width = Math.max(rect.width, 180);
      const maxLeft = window.innerWidth - width - viewportPadding;
      const left = Math.min(Math.max(viewportPadding, rect.left), Math.max(viewportPadding, maxLeft));
      const top = openUpward ? Math.max(viewportPadding, rect.top - dropdownHeight - 4) : rect.bottom + 4;
      const maxHeight = Math.max(140, Math.min(240, openUpward ? spaceAbove - 4 : spaceBelow - 4));

      setDropdownStyle({
        position: 'fixed',
        left,
        top,
        width,
        maxHeight,
        zIndex: 9999,
      });
      setIsPositioned(true);
    };

    updatePosition();
    const rafId = requestAnimationFrame(() => {
      updatePosition();
    });

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updatePosition();
      });
      if (triggerRef.current) resizeObserver.observe(triggerRef.current);
      if (dropdownRef.current) resizeObserver.observe(dropdownRef.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [shouldRender]);

  const filteredOptions = normalizedOptions.filter(option => 
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  return (
    <div className={cn("relative flex flex-col gap-1.5 w-full", isOpen ? "z-[9999]" : "z-10")} ref={containerRef}>
      {label && <label className="text-sm font-semibold text-text-secondary">{label}</label>}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            closeDropdown();
          } else {
            openDropdown();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') closeDropdown();
        }}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={cn(
          'relative flex h-[46px] w-full items-center justify-between rounded-xl border bg-white pr-4 text-left text-sm text-text shadow-sm transition-all focus:outline-none focus:ring-2',
          icon ? 'pl-10' : 'pl-4',
          disabled
            ? 'opacity-50 bg-gray-50 cursor-not-allowed border-border'
            : error
              ? 'border-danger-500 focus:ring-danger-500'
              : 'border-border hover:border-border-strong focus:ring-brand-500 cursor-pointer'
        )}
      >
        {icon && (
          <Icon
            name={icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
        )}
        <span className={cn('truncate', !selectedOption && 'text-text-muted')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon 
          name="chevron-down" 
          size={16} 
          className={cn("text-text-muted transition-transform duration-200 shrink-0 ml-2", isOpen && "rotate-180")} 
        />
      </button>

      {error && <p className="text-xs text-danger-500">{error}</p>}

      {shouldRender && createPortal(
        <div
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          style={dropdownStyle}
          className={cn(
            "flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-lg",
            "transition-all duration-200 ease-out transform-gpu will-change-transform motion-reduce:transition-none motion-reduce:transform-none",
            placement === 'down' ? 'origin-top' : 'origin-bottom',
            animationState === 'open'
              ? "opacity-100 scale-100 translate-y-0"
              : cn(
                  "opacity-0 scale-95 pointer-events-none",
                  placement === 'down' ? "-translate-y-2" : "translate-y-2"
                )
          )}
        >
          {searchable && (
            <div className="border-b border-border p-2">
              <div className="relative flex items-center">
                <Icon name="search" size={14} className="absolute left-3 text-text-muted" />
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg bg-surface-muted py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-text-muted">
                {notFoundText}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    closeDropdown();
                  }}
                  role="option"
                  aria-selected={value === option.value}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200 cursor-pointer",
                    value === option.value
                      ? "font-semibold text-brand-700 bg-brand-50/70 shadow-sm ring-1 ring-brand-100/50"
                      : "text-text hover:bg-surface-muted hover:text-brand-800 hover:pl-4"
                  )}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {value === option.value && <Icon name="check" size={14} className="text-brand-600 animate-in zoom-in-50 duration-200" />}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
