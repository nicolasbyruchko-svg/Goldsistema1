import { type LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ children, required, style, ...props }: LabelProps) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--gray-700)",
        marginBottom: "6px",
        ...style,
      }}
      {...props}
    >
      {children}
      {required && (
        <span
          style={{ color: "#ef4444", marginLeft: "3px" }}
          aria-hidden="true"
        >
          *
        </span>
      )}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      style={{
        fontSize: "12px",
        color: "#ef4444",
        marginTop: "5px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        animation: "fadeIn 0.15s ease-out",
      }}
      role="alert"
    >
      {message}
    </p>
  );
}
