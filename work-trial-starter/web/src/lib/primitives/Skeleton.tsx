// Skeleton primitive: a placeholder block for loading/transitional states.
// Defaults to a text-line shape; pass width/height for blocks, `circle` for avatars.
export function Skeleton({
  width,
  height = 12,
  circle = false,
}: {
  width: number | string;
  height?: number;
  circle?: boolean;
}) {
  return (
    <div
      aria-hidden
      style={{
        width,
        height: circle ? width : height,
        background: "var(--surface-2)",
        borderRadius: circle ? "50%" : "var(--radius-sm)",
      }}
    />
  );
}
