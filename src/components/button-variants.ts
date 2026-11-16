import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        'quiz-result':
          "pointer-events-auto relative z-10 text-success-on-scrim data-[result=incorrect]:text-destructive-on-scrim [&_svg:not([class*='size-'])]:size-14",
        'quiz-card':
          "rounded-xl text-primary hover:bg-primary/5 focus-visible:ring-inset aria-disabled:hover:bg-transparent dark:hover:bg-primary/5 dark:aria-disabled:hover:bg-transparent data-[result]:text-primary/20 [&_svg:not([class*='size-'])]:size-8",
        thumbnail:
          'relative block aspect-square overflow-hidden border border-input bg-background p-0 data-[selection-mode]:opacity-60 data-[selection-mode]:aria-pressed:opacity-100 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-ring',
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        'quiz-result': 'size-20 p-2',
        'quiz-card': 'absolute inset-0 z-20 size-full items-start justify-start p-6',
        thumbnail: 'size-full min-h-11 p-0',
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
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
