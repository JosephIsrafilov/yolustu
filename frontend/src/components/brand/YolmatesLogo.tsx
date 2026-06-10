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
    mark: 'h-6',
    text: 'text-lg',
  },
  md: {
    mark: 'h-8',
    text: 'text-xl',
  },
  lg: {
    mark: 'h-10',
    text: 'text-2xl',
  },
} as const;

function Mark({ size }: { size: YolmatesLogoProps['size'] }) {
  const s = sizeClass[size ?? 'md'];

  return (
    <span className={cn('relative flex shrink-0 items-center justify-center', s.mark)}>
      <svg
        viewBox="314 282 397 322"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
        className="h-full w-auto"
      >
        <g id="yolmates-symbol">
          {/* Left navy Y-arm */}
          <path fill="#05265c" d="M314 283 H369 L453 417 L425 452 Z" />
          {/* Center teal Y-arm / road base structure */}
          <path fill="#007c78" d="M402 283 H457 L585 481 L501 604 H447 L529 481 Z" />
          {/* Right foam Y-arm */}
          <path fill="#b9eee6" d="M656 283 H711 L583 481 H529 L630 283 Z" />
          {/* Main upward arrow / road direction */}
          <path fill="#05265c" d="M360 604 H414 L570 363 L596 381 L596 282 L507 324 L533 343 Z" />
        </g>
      </svg>
    </span>
  );
}

function LogoContent({ size = 'md', showText = true }: Pick<YolmatesLogoProps, 'size' | 'showText'>) {
  return (
    <>
      <Mark size={size} />
      {showText && (
        <span className={cn('font-heading font-semibold uppercase tracking-[0.22em] text-[#007c78] ml-2 hidden min-[380px]:inline', sizeClass[size].text)}>
          Yolmates
        </span>
      )}
    </>
  );
}

export default function YolmatesLogo({ href = '/', size = 'md', showText = true, className }: YolmatesLogoProps) {
  const classes = cn('inline-flex items-center transition-opacity hover:opacity-80 active:scale-[0.98]', className);

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
