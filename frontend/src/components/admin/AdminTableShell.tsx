import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type AdminTableShellProps = {
  children: ReactNode;
  className?: string;
  tableClassName?: string;
};

export default function AdminTableShell({
  children,
  className,
  tableClassName,
}: AdminTableShellProps) {
  return (
    <div className={cn('w-full max-w-full rounded-2xl border border-border bg-white shadow-sm', className)}>
      <div className="w-full overflow-x-auto lg:overflow-x-hidden">
        <table className={cn('w-full min-w-0 table-fixed text-sm', tableClassName)}>{children}</table>
      </div>
    </div>
  );
}