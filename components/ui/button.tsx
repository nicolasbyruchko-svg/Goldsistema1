import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--yellow-primary)",
    color: "var(--navy-900)",
    border: "none",
    boxShadow: "0 2px 8px rgba(255,217,61,0.35)",
  },
  outline: {
    backgroundColor: "transparent",
    color: "var(--navy-800)",
    border: "1.5px solid var(--navy-800)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--gray-600)",
    border: "1.5px solid var(--gray-200)",
  },
  destructive: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: "12px", borderRadius: "6px" },
  md: { padding: "10px 20px", fontSize: "14px", borderRadius: "8px" },
  lg: { padding: "12px 28px", fontSize: "15px", borderRadius: "8px" },
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontFamily: "inherit",
          fontWeight: 600,
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.6 : 1,
          transition: "background-color 0.15s, box-shadow 0.15s, transform 0.1s, opacity 0.15s",
          whiteSpace: "nowrap",
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        onMouseEnter={(e) => {
          if (isDisabled) return;
          const el = e.currentTarget;
          if (variant === "primary") {
            el.style.backgroundColor = "var(--yellow-hover)";
            el.style.transform = "translateY(-1px)";
            el.style.boxShadow = "0 4px 14px rgba(255,217,61,0.45)";
          } else if (variant === "outline") {
            el.style.backgroundColor = "rgba(25,55,109,0.06)";
          } else if (variant === "ghost") {
            el.style.backgroundColor = "var(--gray-100)";
          } else if (variant === "destructive") {
            el.style.backgroundColor = "#dc2626";
          }
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (isDisabled) return;
          const el = e.currentTarget;
          Object.assign(el.style, variantStyles[variant]);
          el.style.transform = "translateY(0)";
          props.onMouseLeave?.(e);
        }}
        {...props}
      >
        {loading && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="animate-spin"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
