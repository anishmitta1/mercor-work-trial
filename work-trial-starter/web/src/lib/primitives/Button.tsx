// Button primitive. Variants cover real usage:
//   default  — bordered actions (Edit toggle; `active` for the on state)
//   dashed   — the "+ Add widget" affordance
//   unstyled — bare clickable content (icon buttons, clickable rows)
import type { ButtonHTMLAttributes, Ref } from "react";

type ButtonVariant = "primary" | "default" | "dashed" | "unstyled";

export function Button({
  variant = "default",
  active = false,
  disabled,
  style,
  ref,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  active?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  // one shared box; variants only change color treatment
  const variantStyle = {
    primary: {
      color: "var(--accent-fg)",
      background: "var(--accent)",
      border: "1px solid var(--accent)",
    },
    default: {
      color: active ? "var(--accent)" : "var(--text-muted)",
      background: active ? "var(--accent-weak)": "var(--surface)",
      border: "1px solid var(--border)",
    },
    dashed: {
      color: "var(--text-subtle)",
      background: "none",
      border: "1px dashed var(--border-strong)",
    },
    unstyled: {
      color: "inherit",
      background: "none",
      border: "none",
      padding: 0,
    },
  }[variant];

  return (
    <button
      ref={ref}
      disabled={disabled}
      style={{
        font: "inherit",
        fontSize: "var(--fs-sm)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--space-1) var(--space-3)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : undefined, // undefined -> CSS (hover reveal) owns opacity
        ...variantStyle,
        ...style,
      }}
      {...props}
    />
  );
}
