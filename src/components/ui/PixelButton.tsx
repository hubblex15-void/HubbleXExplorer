import React from 'react';

export type PixelButtonVariant =
  | 'primary'
  | 'moss'
  | 'honey'
  | 'oak'
  | 'berry'
  | 'parchment'
  | 'diamond'
  | 'grass'
  | 'stone'
  | 'dirt'
  | 'danger';

export interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PixelButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * PixelButton: Raised block with light top-left edge and dark bottom edge.
 * On press it moves down 4px (snapped to 4px grid) and loses its bottom edge.
 * Uses ONLY semantic tokens.
 */
export const PixelButton: React.FC<PixelButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...rest
}) => {
  const sizeClasses = {
    sm: 'min-h-[38px] sm:min-h-[44px] px-3 py-1.5 text-sm',
    md: 'min-h-[44px] px-4 py-2 text-base',
    lg: 'min-h-[50px] px-6 py-3 text-lg',
  }[size];

  // Resolve aliases
  const resolvedVariant: 'moss' | 'honey' | 'oak' | 'berry' = (() => {
    if (variant === 'honey') return 'honey';
    if (variant === 'berry' || variant === 'danger') return 'berry';
    if (variant === 'oak' || variant === 'parchment' || variant === 'dirt' || variant === 'stone') return 'oak';
    return 'moss'; // default primary / grass / moss / diamond
  })();

  const variantStyles = {
    moss: {
      bg: 'bg-moss text-cocoa',
      borders: 'border-t-cream-deep border-l-cream-deep border-r-moss-dark border-b-moss-dark',
      shadow: 'shadow-[0_4px_0_var(--moss-dark)]',
      hover: 'hover:brightness-105',
    },
    honey: {
      bg: 'bg-honey text-cocoa font-bold',
      borders: 'border-t-cream border-l-cream border-r-honey-dark border-b-honey-dark',
      shadow: 'shadow-[0_4px_0_var(--honey-dark)]',
      hover: 'hover:brightness-105',
    },
    oak: {
      bg: 'bg-cream-deep text-cocoa',
      borders: 'border-t-cream border-l-cream border-r-oak-dark border-b-oak-dark',
      shadow: 'shadow-[0_4px_0_var(--oak-dark)]',
      hover: 'hover:bg-cream',
    },
    berry: {
      bg: 'bg-berry text-cream font-bold',
      borders: 'border-t-cream-deep border-l-cream-deep border-r-cocoa border-b-cocoa',
      shadow: 'shadow-[0_4px_0_var(--cocoa)]',
      hover: 'hover:brightness-110',
    },
  }[resolvedVariant];

  return (
    <button
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center gap-2
        font-pixel-heading tracking-wide select-none
        border-[3px] border-solid
        ${variantStyles.bg}
        ${variantStyles.borders}
        ${sizeClasses}
        ${fullWidth ? 'w-full' : ''}
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed filter grayscale'
            : `cursor-pointer ${variantStyles.shadow} active:translate-y-1 active:shadow-none transition-transform duration-75 ${variantStyles.hover}`
        }
        focus-visible:outline-3 focus-visible:outline-honey focus-visible:outline-offset-2
        ${className}
      `}
      {...rest}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="whitespace-nowrap leading-none">{children}</span>
    </button>
  );
};
