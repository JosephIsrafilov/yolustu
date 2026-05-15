'use client';

import React from 'react';
import BottomNav from './BottomNav';
import TopBar from './TopBar';

interface MobileShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  showNav?: boolean;
  rightAction?: React.ReactNode;
}

export default function MobileShell({
  children,
  title,
  showBack = false,
  showNav = true,
  rightAction,
}: MobileShellProps) {
  return (
    <div className="mx-auto max-w-md min-h-screen bg-surface-dim flex flex-col relative">
      {title && <TopBar title={title} showBack={showBack} rightAction={rightAction} />}
      <main className={`flex-1 overflow-y-auto ${showNav ? 'pb-20' : 'pb-6'} ${title ? 'pt-0' : ''}`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
