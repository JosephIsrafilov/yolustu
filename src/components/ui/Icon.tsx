import React from 'react';

/**
 * Lightweight inline SVG icon component.
 * Replaces lucide-react with zero-dependency SVG paths.
 * All icons use stroke-based rendering at 24×24 viewBox.
 */

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  fill?: string;
}

export type IconName =
  | 'search' | 'search-x' | 'menu' | 'x' | 'log-out' | 'arrow-left' | 'arrow-right'
  | 'chevron-right' | 'map-pin' | 'calendar' | 'calendar-check' | 'users' | 'user'
  | 'user-circle' | 'clock' | 'star' | 'car' | 'shield' | 'shield-check' | 'shield-off'
  | 'banknote' | 'leaf' | 'check' | 'check-circle' | 'plus' | 'map' | 'inbox'
  | 'message-square' | 'alert-triangle' | 'settings' | 'loader-2' | 'mail' | 'lock'
  | 'phone' | 'trash-2' | 'layout-dashboard' | 'ban' | 'armchair' | 'cigarette-off'
  | 'dog';

// Each path value is [d-string, options?] — options: fill, fillRule, etc.
const PATHS: Record<IconName, string> = {
  'search': 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
  'search-x': 'M13.5 8.5L8.5 13.5M8.5 8.5l5 5M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
  'menu': 'M4 12h16M4 6h16M4 18h16',
  'x': 'M18 6L6 18M6 6l12 12',
  'log-out': 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  'chevron-right': 'M9 18l6-6-6-6',
  'map-pin': 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z',
  'calendar': 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  'calendar-check': 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM9 16l2 2 4-4',
  'users': 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  'user': 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  'user-circle': 'M18 20a6 6 0 00-12 0M12 14a4 4 0 100-8 4 4 0 000 8zM12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
  'clock': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  'star': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  'car': 'M16 8h1.58a2 2 0 011.42 1L21 12v6a1 1 0 01-1 1h-1a2 2 0 01-4 0H9a2 2 0 01-4 0H4a1 1 0 01-1-1v-6l2-3a2 2 0 011.42-1H8M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2',
  'shield': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  'shield-check': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  'shield-off': 'M19.69 14a6.9 6.9 0 00.31-2V5l-8-3-3.16 1.18M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 005.62-4.38M1 1l22 22',
  'banknote': 'M2 8.5h20M2 15.5h20M6 8.5V6a2 2 0 012-2h8a2 2 0 012 2v2.5M6 15.5V18a2 2 0 002 2h8a2 2 0 002-2v-2.5M12 14a2 2 0 100-4 2 2 0 000 4z',
  'leaf': 'M11 20A7 7 0 019.8 6.9C15.5 4.9 20 2 20 2s-2.9 4.5-4.9 10.1A7 7 0 0111 20zM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 12 13',
  'check': 'M20 6L9 17l-5-5',
  'check-circle': 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
  'plus': 'M12 5v14M5 12h14',
  'map': 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16',
  'inbox': 'M22 12h-6l-2 3H10l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
  'message-square': 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  'alert-triangle': 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  'settings': 'M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2zM12 15a3 3 0 100-6 3 3 0 000 6z',
  'loader-2': 'M21 12a9 9 0 11-6.219-8.56',
  'mail': 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  'lock': 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  'phone': 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  'trash-2': 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6',
  'layout-dashboard': 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  'ban': 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM4.93 4.93l14.14 14.14',
  'armchair': 'M19 9V6a2 2 0 00-2-2H7a2 2 0 00-2 2v3M3 11v5a2 2 0 002 2h14a2 2 0 002-2v-5a3 3 0 00-3-3H6a3 3 0 00-3 3zM5 18v2M19 18v2',
  'cigarette-off': 'M2 2l20 20M12 12H2v4h14M22 12v4M18 12h-.01M7 12v4M2 8a4 4 0 014-4M16 8a4 4 0 014-4',
  'dog': 'M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217.17 1.727 1.5 3 .426.408 1.143.884 2 1.33V19a2 2 0 002 2h8a2 2 0 002-2v-4.67c.857-.447 1.574-.922 2-1.33 1.33-1.273 1.363-1.783 1.5-3 .113-.994-1.177-6.53-4-7C15.577 2.679 14 3.782 14 5.172V6M12 6v3M12 13h.01',
};

export default function Icon({ name, size = 24, className = '', strokeWidth = 2, fill = 'none' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[name].split(' M').map((segment, i) => (
        <path key={i} d={i === 0 ? segment : `M${segment}`} />
      ))}
    </svg>
  );
}
