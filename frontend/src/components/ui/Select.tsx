'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  onChange: (value: any) => void;
  options: SelectOption[] | readonly string[] | string[] | number[];
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
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
}: SelectProps) {
  const { language } = useAppStore();
  const searchPlaceholder = language === 'az' ? 'Axtar...' : language === 'ru' ? 'Поиск...' : 'Search...';
  const notFoundText = language === 'az' ? 'Nəticə tapılmadı' : language === 'ru' ? 'Ничего не найдено' : 'No results found';
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = React.useMemo((): SelectOption[] => {
    return options.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        const o = opt as any;
        return { value: o.value, label: o.label };
      }
      return { value: opt as any, label: String(opt) };
    });
  }, [options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = normalizedOptions.filter(option => 
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  return (
    <div className={cn("relative flex flex-col gap-1.5 w-full", isOpen ? "z-[9999]" : "z-10")} ref={containerRef}>
      {label && <label className="text-sm font-semibold text-text-secondary">{label}</label>}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch('');
        }}
        className={cn(
          'relative flex h-[46px] w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm text-text shadow-sm transition-all focus:outline-none focus:ring-2',
          disabled
            ? 'opacity-50 bg-gray-50 cursor-not-allowed border-border'
            : error
              ? 'border-danger-500 focus:ring-danger-500'
              : 'border-border hover:border-border-strong focus:ring-brand-500 cursor-pointer'
        )}
      >
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

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] z-50 flex max-h-60 w-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
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
                    setIsOpen(false);
                  }}
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
        </div>
      )}
    </div>
  );
}
