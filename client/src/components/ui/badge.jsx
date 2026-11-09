import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200',
        destructive: 'border-transparent bg-red-600 text-white hover:bg-red-700',
        outline: 'text-slate-950 border-slate-300',
        success: 'border-transparent bg-emerald-100 text-emerald-800'
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

