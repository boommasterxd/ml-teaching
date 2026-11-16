import { cva } from 'class-variance-authority';

/** Shared server-safe styles for buttons and navigation links. */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4',
  {
    variants: {
      variant: {
        brand:
          'font-display font-bold tracking-tight text-foreground [&_svg]:size-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md',
        primary:
          'bg-primary hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground rounded-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        secondary:
          'bg-secondary hover:bg-secondary-hover text-secondary-foreground rounded-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        destructive:
          'bg-destructive hover:bg-destructive-hover text-destructive-foreground rounded-xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2',
        'destructive-soft':
          'bg-destructive-soft hover:bg-destructive-soft-hover text-destructive-strong rounded-xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2',
        cta: 'bg-destructive hover:bg-destructive-hover text-destructive-foreground rounded-full font-semibold shadow-lg shadow-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2',
        ghost:
          'rounded-xl text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        navigation:
          'rounded text-muted-foreground hover:text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        gallery:
          'rounded text-[var(--class-on-surface)] font-bold hover:bg-secondary hover:text-foreground disabled:text-muted-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        thumbnail:
          'relative block aspect-square overflow-hidden rounded-lg border border-input hover:shadow-sm cursor-pointer data-[selection-mode]:opacity-60 data-[selection-mode]:aria-pressed:opacity-100 data-[selection-mode]:hover:opacity-100 aria-pressed:border-[var(--btn-color)] aria-pressed:ring-2 aria-pressed:ring-[var(--btn-color)] [&_svg]:size-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        outline:
          'rounded-xl bg-card border border-control text-secondary-foreground hover:bg-secondary font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed',
        'outline-destructive':
          'rounded-xl bg-card border border-control text-destructive hover:text-destructive-strong hover:bg-destructive-soft hover:border-destructive font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'ghost-destructive':
          'rounded-md text-muted-foreground hover:bg-destructive-soft hover:text-destructive-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2',
        'ghost-primary':
          'rounded-md text-muted-foreground hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        capture:
          'rounded-xl bg-[var(--btn-color)] text-white font-bold select-none touch-none shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--btn-color)] focus-visible:ring-offset-2',
        prediction:
          'rounded-full bg-card text-card-foreground font-bold shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        demonstration:
          'flex-col gap-4 rounded-2xl border-2 border-diagram-control-border bg-diagram-control/50 text-diagram-foreground font-medium [&_svg]:size-12 data-[active=false]:hover:border-diagram-control-border-hover data-[muted=true]:opacity-50 data-[signal=dog]:[&_svg]:text-signal-dog data-[signal=cat]:[&_svg]:text-signal-cat data-[signal=dog]:data-[active=true]:border-signal-dog-active data-[signal=dog]:data-[active=true]:bg-signal-dog-active/20 data-[signal=cat]:data-[active=true]:border-signal-cat-active data-[signal=cat]:data-[active=true]:bg-signal-cat-active/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-diagram-surface data-[signal=dog]:focus-visible:ring-signal-dog data-[signal=cat]:focus-visible:ring-signal-cat',
      },
      size: {
        brand: 'min-h-11 p-0 text-base',
        sm: 'py-2 px-3 text-sm',
        md: 'py-3 px-4 text-sm',
        lg: 'py-4 px-8 text-lg',
        xl: 'py-5 px-10 text-xl',
        icon: 'size-11 p-2',
        'icon-sm': 'size-9 p-2',
        toolbar: 'py-2 px-3 sm:px-4 text-sm',
        text: 'p-0 text-sm',
        gallery: 'min-h-11 min-w-11 py-1.5 px-3 text-[10px]',
        thumbnail: 'size-full min-h-11 p-0',
        demonstration: 'p-4 text-sm',
      },
    },
    compoundVariants: [
      { variant: 'cta', size: 'xl', className: 'font-bold shadow-xl shadow-destructive/20' },
    ],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
