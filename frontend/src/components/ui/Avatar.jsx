import { useState } from 'react';

export default function Avatar({ src, name = '', size = 'md', online, className = '' }) {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  };

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const avatarSize = sizes[size] || sizes.md;

  return (
    <div className={`relative inline-flex rounded-full shrink-0 select-none ${avatarSize} ${className}`}>
      {src && !imageError ? (
        <img
          src={src}
          alt={name || 'User Avatar'}
          onError={() => setImageError(true)}
          className="w-full h-full rounded-full object-cover shadow-sm"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold tracking-tight shadow-sm">
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size] || 'w-2.5 h-2.5'} rounded-full ring-2 ring-white dark:ring-dark-900 ${
            online ? 'bg-emerald-500' : 'bg-gray-400'
          }`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
