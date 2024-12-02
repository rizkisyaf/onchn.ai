import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
}

function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-primary text-white': variant === 'default',
          'bg-white text-primary': variant === 'secondary',
          'bg-accent text-white': variant === 'destructive',
          'bg-green-500/10 text-green-500': variant === 'success',
          'border border-white/10 bg-white/5 text-white backdrop-blur-sm': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge } 