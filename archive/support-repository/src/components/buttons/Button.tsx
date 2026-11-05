import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-[#5EEAD4] text-[#0B0F14] hover:bg-[#7FF3E0] focus-visible:ring-[#5EEAD4]",
  secondary:
    "bg-[#121821] text-[#E6EDF3] border border-[#1F2733] hover:border-[#5EEAD4]/50 focus-visible:ring-[#5EEAD4]",
  danger: "bg-[#F87171] text-[#0B0F14] hover:bg-[#FF8A8A] focus-visible:ring-[#F87171]",
  ghost: "bg-transparent text-[#8B98A5] hover:text-[#E6EDF3] focus-visible:ring-[#5EEAD4]",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-tight
        transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        focus-visible:ring-offset-[#0B0F14] disabled:cursor-not-allowed disabled:opacity-50
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
