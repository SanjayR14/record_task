import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export const PrimaryButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'default',
  size = 'lg',
  className = '',
  fullWidth = true,
  icon: Icon,
  iconPosition = 'right',
  type = 'button',
  ...props
}) => {
  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        'font-medium text-sm sm:text-base transition-all select-none active:scale-[0.99] min-h-[46px] rounded-xl shadow-sm',
        fullWidth ? 'w-full' : '',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
        </span>
      )}
    </Button>
  );
};

export default PrimaryButton;

