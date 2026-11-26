import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg';
type LogoVariant = 'default' | 'light' | 'dark' | 'muted';

const sizeClass: Record<LogoSize, string> = {
  sm: 'h-5',
  md: 'h-7',
  lg: 'h-9',
};

const variantClass: Record<LogoVariant, string> = {
  default: 'text-foreground',
  light: 'text-white',
  dark: 'text-black',
  muted: 'text-muted-foreground',
};

export function Logo({
  size = 'md',
  variant = 'default',
  className,
  ariaLabel = 'HyperScan AI',
}: {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <svg
      viewBox="0 0 180 36"
      role="img"
      aria-label={ariaLabel}
      className={cn(sizeClass[size], 'w-auto', variantClass[variant], className)}
    >
      <title>{ariaLabel}</title>
      <text
        x="0"
        y="28"
        fontFamily="General Sans, ui-sans-serif, system-ui, sans-serif"
        fontSize="28"
        fontWeight="700"
        letterSpacing="-0.02em"
      >
        <tspan fill="currentColor">Hyper</tspan>
        <tspan fill="var(--primary, #C1F36B)">Scan</tspan>
        <tspan fill="currentColor"> AI</tspan>
      </text>
    </svg>
  );
}

const markSize: Record<LogoSize, number> = {
  sm: 20,
  md: 28,
  lg: 36,
};

export function LogoMark({
  size = 'md',
  variant = 'default',
  className,
  ariaLabel = 'HyperScan AI',
}: {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  ariaLabel?: string;
}) {
  const px = markSize[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      role="img"
      aria-label={ariaLabel}
      className={cn(variantClass[variant], className)}
    >
      <title>{ariaLabel}</title>
      <rect x="5" y="4" width="6" height="24" rx="2" fill="currentColor" />
      <rect x="21" y="4" width="6" height="24" rx="2" fill="currentColor" />
      <path d="M8 16 C12 9 20 9 24 16 C20 23 12 23 8 16 Z" fill="var(--primary, #C1F36B)" />
      <path
        d="M8 16 H24"
        stroke="var(--background, #101210)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
