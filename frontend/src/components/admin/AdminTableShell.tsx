import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type AdminTableShellProps = {
  children: ReactNode;
  className?: string;
};

export default function AdminTableShell({
  children,
  className,
}: AdminTableShellProps) {
  return (
    <div className={cn('w-full max-w-full rounded-2xl border border-border bg-white shadow-sm', className)}>
      <div className="w-full overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
