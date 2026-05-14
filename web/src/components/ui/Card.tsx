'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

const cardVariants = cva('rounded-xl bg-white shadow-sm border border-gray-200', {
  variants: {
    variant: {
      hoverable: '',
      regular: '',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'regular',
    padding: 'md',
  },
});

interface CardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, keyof HTMLMotionProps<'div'>>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    const cardClassName = cn(cardVariants({ variant, padding }), className);

    if (variant === 'hoverable') {
      return (
        <motion.div
          ref={ref}
          className={cardClassName}
          whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
          transition={{ duration: 0.2 }}
          {...props}
        />
      );
    }

    return <div ref={ref} className={cardClassName} {...props} />;
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />;
  }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return <h3 ref={ref} className={cn('text-lg font-semibold text-gray-900', className)} {...props} />;
  }
);

CardTitle.displayName = 'CardTitle';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('pt-0', className)} {...props} />;
  }
);

CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent, cardVariants };
export type { CardProps };
