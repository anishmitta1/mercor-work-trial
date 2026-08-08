// Button primitive. Variants cover real usage:
//   default  — bordered actions (Edit toggle; `active` for the on state)
//   dashed   — the "+ Add widget" affordance
//   unstyled — bare clickable content (icon buttons, clickable rows)
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "dashed" | "unstyled";

export function Button({
  variant = "default",
  active = false,
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  active?: boolean;
}) {
  const variantStyle = {
    default: {
      fontSize: "var(--fs-sm)",
      color: active ? "var(--accent)" : "var(--text-muted)",
      background: active ? "var(--accent-weak)" : "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
      padding: "var(--space-1) var(--space-3)",
    },
    dashed: {
      fontSize: "var(--fs-sm)",
      color: "var(--text-subtle)",
      background: "none",
      border: "1px dashed var(--border-strong)",
      borderRadius: "var(--radius)",
      padding: "var(--space-3)",
    },
    unstyled: {
      background: "none",
      border: "none",
      padding: 0,
      color: "inherit",
    },
  }[variant];

  return (
    <button
      style={{ font: "inherit", cursor: "pointer", ...variantStyle, ...style }}
      {...props}
    />
  );
}
