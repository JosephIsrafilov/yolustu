import React from 'react';
import Image from 'next/image';

interface BadgeProps {
  code: string;
  name: string;
  description: string;
  icon_url?: string;
  isUnlocked: boolean;
  awardedAt?: string;
}

export const BadgeComponent: React.FC<BadgeProps> = ({
  code,
  name,
  description,
  icon_url,
  isUnlocked,
  awardedAt,
}) => {
  const imageSrc = icon_url || `/badges/badge_${code}.png`;

  return (
    <div
      className={`relative group flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 ${
        isUnlocked
          ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-800 hover:-translate-y-1'
          : 'bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500'
      }`}
    >
      <div className="relative w-20 h-20 mb-3 drop-shadow-md">
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-contain"
          sizes="80px"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.svg';
          }}
        />
        {isUnlocked && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      <h4 className="text-sm font-bold text-gray-900 dark:text-white text-center mb-1">
        {name}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight line-clamp-2">
        {description}
      </p>

      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-10 pointer-events-none shadow-xl border border-gray-700/50">
        <div className="font-semibold mb-0.5">{name}</div>
        <div className="text-gray-300 font-normal">{description}</div>
        {isUnlocked && awardedAt && (
          <div className="mt-1 text-emerald-400 text-[10px] font-medium border-t border-gray-700 pt-1">
            Unlocked: {new Date(awardedAt).toLocaleDateString()}
          </div>
        )}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 dark:bg-gray-800 border-r border-b border-gray-700/50"></div>
      </div>
    </div>
  );
};
