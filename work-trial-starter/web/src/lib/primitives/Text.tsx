// Typography primitive: the only way text gets styled.
// variant = a named, token-backed style; use `as` for semantics (h1/h3/p...).
import type { CSSProperties, ElementType, ReactNode } from "react";

const variants = {
  title: { fontSize: "var(--fs-xl)", color: "var(--text)", fontWeight: 600 },
  cardTitle: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  body: { fontSize: "var(--fs-md)", color: "var(--text)" },
  muted: { fontSize: "var(--fs-sm)", color: "var(--text-muted)" },
  subtle: { fontSize: "var(--fs-sm)", color: "var(--text-subtle)" },
  stat: {
    fontSize: "var(--fs-2xl)",
    color: "var(--text)",
    fontVariantNumeric: "tabular-nums",
  },
  warn: { fontSize: "var(--fs-sm)", color: "var(--warn)" },
  error: { fontSize: "var(--fs-sm)", color: "var(--danger)" },
} satisfies Record<string, CSSProperties>;

export type TextVariant = keyof typeof variants;

export function Text({
  variant = "body",
  as: Tag = "span",
  children,
  style,
}: {
  variant?: TextVariant;
  as?: ElementType;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <Tag style={{ margin: 0, ...variants[variant], ...style }}>{children}</Tag>;
}
