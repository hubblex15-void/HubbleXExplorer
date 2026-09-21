import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: 'oak' | 'honey' | 'moss' | 'berry';
  size?: 'sm' | 'md';
}

/**
 * Accessible 44px tap-target pixel icon button.
 * Raised block with light top-left edge and dark bottom edge.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  variant = 'oak',
  size = 'md',
  className = '',
  disabled,
  ...rest
}) => {
  const sizeClasses = size === 'sm' ? 'w-10 h-10 min-w-[40px]' : 'w-11 h-11 min-w-[44px] min-h-[44px]';

  const variantStyles = {
    oak: {
      bg: 'bg-cream-deep text-cocoa',
      borders: 'border-t-cream border-l-cream border-r-oak-dark border-b-oak-dark',
      shadow: 'shadow-[0_4px_0_var(--oak-dark)]',
    },
    honey: {
      bg: 'bg-honey text-cocoa',
      borders: 'border-t-cream border-l-cream border-r-honey-dark border-b-honey-dark',
      shadow: 'shadow-[0_4px_0_var(--honey-dark)]',
    },
    moss: {
      bg: 'bg-moss text-cocoa',
      borders: 'border-t-cream border-l-cream border-r-moss-dark border-b-moss-dark',
      shadow: 'shadow-[0_4px_0_var(--moss-dark)]',
    },
    berry: {
      bg: 'bg-berry text-cream',
      borders: 'border-t-cream-deep border-l-cream-deep border-r-cocoa border-b-cocoa',
      shadow: 'shadow-[0_4px_0_var(--cocoa)]',
    },
  }[variant];

  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center select-none
        border-[3px] border-solid ${sizeClasses}
        ${variantStyles.bg}
        ${variantStyles.borders}
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : `cursor-pointer ${variantStyles.shadow} active:translate-y-1 active:shadow-none hover:brightness-105`
        }
        focus-visible:outline-3 focus-visible:outline-honey focus-visible:outline-offset-2
        ${className}
      `}
      {...rest}
    >
      {icon}
    </button>
  );
};
