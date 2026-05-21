'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  label?: string;
  placeholder?: string;
  error?: string;
}

export default function CitySelect({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select city',
  error,
}: CitySelectProps) {
  const { language } = useAppStore();
  const searchPlaceholder = language === 'az' ? 'Axtar...' : language === 'ru' ? 'Поиск...' : 'Search...';
  const notFoundText = language === 'az' ? 'Nəticə tapılmadı' : language === 'ru' ? 'Ничего не найдено' : 'No results found';
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Close when clicking outside
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

  // Filter options
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("relative flex flex-col gap-1.5", isOpen ? "z-[9999]" : "z-10")} ref={containerRef}>
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}

      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch(''); // Reset search when opening
        }}
        className={cn(
          'relative flex h-[46px] w-full items-center justify-between rounded-xl border bg-white px-3 text-left text-sm text-text shadow-sm transition-all focus:outline-none focus:ring-2',
          error
            ? 'border-danger-500 focus:ring-danger-500'
            : 'border-border hover:border-border-strong focus:ring-brand-500'
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Icon name="map-pin" size={16} className="text-text-muted shrink-0" />
          <span className={cn('truncate', !value && 'text-text-muted')}>
            {value || placeholder}
          </span>
        </div>
        <Icon 
          name="chevron-down" 
          size={16} 
          className={cn("text-text-muted transition-transform duration-200", isOpen && "rotate-180")} 
        />
      </button>

      {error && <p className="text-xs text-danger-500">{error}</p>}

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] z-50 flex max-h-60 w-full flex-col overflow-hidden rounded-xl border border-border bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
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
          <div className="flex-1 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-text-muted">
                {notFoundText}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-muted",
                    value === option ? "font-semibold text-brand-600 bg-brand-50" : "text-text"
                  )}
                >
                  <span className="flex-1 truncate">{option}</span>
                  {value === option && <Icon name="check" size={14} className="text-brand-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
