'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type YolmatesLogoProps = {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
};

const sizeClass = {
  sm: {
    mark: 'h-8 w-8',
    text: 'text-lg',
    svg: 32,
  },
  md: {
    mark: 'h-9 w-9',
    text: 'text-xl',
    svg: 36,
  },
  lg: {
    mark: 'h-11 w-11',
    text: 'text-2xl',
    svg: 44,
  },
} as const;

function Mark({ size }: { size: YolmatesLogoProps['size'] }) {
  const resolvedSize = sizeClass[size ?? 'md'];

  return (
    <span className={cn('relative flex shrink-0 items-center justify-center text-primary', resolvedSize.mark)}>
      <svg
        width={resolvedSize.svg}
        height={resolvedSize.svg}
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="yolmates-logo-gradient" x1="8" y1="7" x2="32" y2="33" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2B8A9A" />
            <stop offset="1" stopColor="#054752" />
          </linearGradient>
        </defs>
        <path
          d="M20 8c-4.9 3.7-7.5 7.7-7.5 12 0 4.8 3.4 8.8 7.5 12 4.1-3.2 7.5-7.2 7.5-12 0-4.3-2.6-8.3-7.5-12Z"
          fill="url(#yolmates-logo-gradient)"
          opacity="0.12"
        />
        <path
          d="M20 8c-4.9 3.7-7.5 7.7-7.5 12 0 4.8 3.4 8.8 7.5 12 4.1-3.2 7.5-7.2 7.5-12 0-4.3-2.6-8.3-7.5-12Z"
          fill="none"
          stroke="url(#yolmates-logo-gradient)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 13.5v7.1M20 20.6l-5.1-4.2M20 20.6l5.1-4.2"
          fill="none"
          stroke="#054752"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="13.5" r="2.2" fill="#2B8A9A" />
        <circle cx="14.9" cy="16.4" r="1.35" fill="#054752" />
        <circle cx="25.1" cy="16.4" r="1.35" fill="#054752" />
      </svg>
    </span>
  );
}

function LogoContent({ size = 'md', showText = true }: Pick<YolmatesLogoProps, 'size' | 'showText'>) {
  return (
    <>
      <Mark size={size} />
      {showText && (
        <span className={cn('font-heading font-extrabold tracking-tight text-[#002f37]', sizeClass[size].text)}>
          Yolmates
        </span>
      )}
    </>
  );
}

export default function YolmatesLogo({ href = '/', size = 'md', showText = true, className }: YolmatesLogoProps) {
  const classes = cn('inline-flex items-center gap-2 text-[#002f37] transition-colors hover:text-[#054752] active:scale-[0.98]', className);

  if (!href) {
    return (
      <div className={classes}>
        <LogoContent size={size} showText={showText} />
      </div>
    );
  }

  return (
    <Link href={href} className={classes}>
      <LogoContent size={size} showText={showText} />
    </Link>
  );
}
