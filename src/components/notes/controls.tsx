'use client';
import type { ComponentProps } from 'react';
import { Button as PrimitiveButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Button({ className, variant = 'default', ...props }: ComponentProps<typeof PrimitiveButton>) {
  return <PrimitiveButton {...props} variant={variant} className={cn(
    'min-h-11 h-auto gap-2 rounded px-4 py-2 text-sm font-medium whitespace-normal disabled:opacity-100 disabled:bg-background disabled:text-foreground disabled:border-border disabled:pointer-events-auto disabled:transition-none',
    variant === 'default' && 'hover:bg-[#1c469f] active:bg-[#163980]',
    variant === 'outline' && 'bg-white hover:bg-background',
    className,
  )} />;
}
