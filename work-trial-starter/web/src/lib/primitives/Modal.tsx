// Modal primitive. Radix owns behavior (focus into dialog + return, Esc, scrim,
// scroll lock, aria); motion owns the shared-element morph via layoutId; tokens own the look.
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

const TRANSITION = { type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.45 } as const;

// screen-reader-only title (Radix requires one; the visible title lives in children)
const srOnly = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
} as const;

export function Modal({
  open,
  onOpenChange,
  layoutId,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layoutId: string; // shared with the triggering element for the morph
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={TRANSITION}
                style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 10 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.section
                layoutId={layoutId}
                transition={TRANSITION}
                style={{
                  position: "fixed",
                  top: "8vh",
                  left: 0,
                  right: 0,
                  marginInline: "auto",
                  width: "min(720px, 90vw)",
                  height: "74vh",
                  zIndex: 11,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "var(--space-5)",
                  boxSizing: "border-box",
                  overflow: "auto",
                  boxShadow: "var(--shadow)",
                }}
              >
                <Dialog.Title style={srOnly}>{title}</Dialog.Title>
                {children}
              </motion.section>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
