import { useState } from 'react';
import { getFirstNameInitial } from '../utils/nameUtils';

export { getFirstNameInitial };

interface TestimonialAvatarProps {
  name: string;
  avatar?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function TestimonialAvatar({
  name,
  avatar,
  size = 'md',
  className = '',
}: TestimonialAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Extract the first letter of their first name (skipping titles/honorifics)
  const initial = getFirstNameInitial(name);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs font-bold',
    md: 'w-12 h-12 text-base font-extrabold',
    lg: 'w-14 h-14 text-xl font-extrabold',
    xl: 'w-16 h-16 text-2xl font-black',
  }[size];

  const hasValidImage = Boolean(avatar && avatar.trim().length > 0 && !imageError);

  if (hasValidImage) {
    return (
      <img
        src={avatar!.trim()}
        alt={name}
        onError={() => setImageError(true)}
        className={`${sizeClasses} rounded-full object-cover border-2 border-teal-500/40 shadow-sm shrink-0 ${className}`}
      />
    );
  }

  // Teal background avatar with first letter of their name
  return (
    <div
      className={`${sizeClasses} rounded-full bg-teal-600 border-2 border-teal-400/50 text-white flex items-center justify-center shadow-md select-none shrink-0 font-['Outfit',sans-serif] tracking-wider uppercase ${className}`}
      title={name}
      aria-label={`${name} avatar`}
    >
      <span>{initial}</span>
    </div>
  );
}
