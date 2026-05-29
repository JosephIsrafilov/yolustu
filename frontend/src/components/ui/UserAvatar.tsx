import Image from 'next/image';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: number;
  className?: string;
  fallbackClassName?: string;
}

export default function UserAvatar({
  name,
  avatarUrl,
  size = 32,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className={cn(
          "rounded-full object-cover border border-border shrink-0 flex-none",
          className
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold shrink-0 flex-none",
        fallbackClassName,
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.4) }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
