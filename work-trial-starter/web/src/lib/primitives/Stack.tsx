// Layout primitives: the only flex containers in the app.
// gap is a token index (gap={3} -> var(--space-3)) so spacing stays on-system.
import type { CSSProperties, ReactNode } from "react";

type StackProps = {
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
};

const make =
  (flexDirection: "row" | "column") =>
  ({ gap = 3, align, justify, children, style, className }: StackProps) => (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection,
        gap: `var(--space-${gap})`,
        alignItems: align,
        justifyContent: justify,
        ...style,
      }}
    >
      {children}
    </div>
  );

export const XStack = make("row");
export const YStack = make("column");
