import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'text-foreground',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
};


export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  unit,
  variant = 'default',
  icon,
  className
}) => {
  return (
    <Card className={cn('h-full', className)}>
      <CardContent className="p-2 flex flex-col justify-center h-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-none">
            {title}
          </span>
          {icon && (
            <div className="text-muted-foreground [&>svg]:w-3 [&>svg]:h-3">
              {icon}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className={cn(
              'text-sm font-bold leading-none',
              variantStyles[variant]
            )}>
              {value}
            </span>
            {unit && (
              <span className="text-xs text-muted-foreground leading-none">
                {unit}
              </span>
            )}
          </div>
          
          {variant !== 'default' && (
            <div className={cn(
              'w-2 h-2 rounded-full',
              variant === 'success' && 'bg-green-500',
              variant === 'warning' && 'bg-yellow-500',
              variant === 'error' && 'bg-red-500'
            )} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};