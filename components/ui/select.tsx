import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, style, children, ...props }, ref) => {
    return (
      <div style={{ position: "relative", width: "100%" }}>
        <select
          ref={ref}
          style={{
            width: "100%",
            padding: "10px 40px 10px 14px",
            fontSize: "14px",
            fontFamily: "inherit",
            color: "var(--gray-900)",
            backgroundColor: error ? "#fff8f8" : "#ffffff",
            border: `1.5px solid ${error ? "#ef4444" : "var(--gray-200)"}`,
            borderRadius: "8px",
            outline: "none",
            appearance: "none",
            cursor: "pointer",
            transition: "border-color 0.15s, box-shadow 0.15s",
            boxSizing: "border-box",
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error
              ? "#ef4444"
              : "var(--navy-800)";
            e.currentTarget.style.boxShadow = error
              ? "0 0 0 3px rgba(239,68,68,0.12)"
              : "0 0 0 3px rgba(25,55,109,0.1)";
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "#ef4444"
              : "var(--gray-200)";
            e.currentTarget.style.boxShadow = "none";
            props.onBlur?.(e);
          }}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--gray-400)",
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }
);
Select.displayName = "Select";
