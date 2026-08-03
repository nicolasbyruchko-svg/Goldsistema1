import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        style={{
          width: "100%",
          padding: "10px 14px",
          fontSize: "14px",
          fontFamily: "inherit",
          color: "var(--gray-900)",
          backgroundColor: error ? "#fff8f8" : "#ffffff",
          border: `1.5px solid ${error ? "#ef4444" : "var(--gray-200)"}`,
          borderRadius: "8px",
          outline: "none",
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
      />
    );
  }
);
Input.displayName = "Input";
