import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  "control-focus inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        'quiz-result':
          "pointer-events-auto relative z-10 text-success-on-scrim data-[result=incorrect]:text-destructive-on-scrim [&_svg:not([class*='size-'])]:size-14",
        'quiz-card':
          'control-focus-inset rounded-(--quiz-inner-radius) hover:bg-primary/5 aria-disabled:hover:bg-transparent dark:hover:bg-primary/5 dark:aria-disabled:hover:bg-transparent',
        thumbnail:
          'control-focus-media relative block aspect-square overflow-hidden rounded-md border border-input bg-background p-0 select-none [-webkit-touch-callout:none] data-[selection-mode]:opacity-60 data-[selection-mode]:focus-visible:opacity-100 data-[selection-mode]:aria-pressed:opacity-100 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-ring',
        default:
          'bg-primary text-primary-foreground shadow-[inset_0_1px_0_#ffffff38] hover:bg-primary-hover',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input/70 bg-white/5 shadow-xs hover:bg-secondary hover:text-secondary-foreground disabled:shadow-none aria-disabled:shadow-none',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        'quiz-result': 'size-20 p-2',
        'quiz-card': 'absolute inset-0 z-20 size-full p-0',
        thumbnail: 'size-full min-h-11 p-0',
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-full px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-full px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-full px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-full [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export { buttonVariants };
