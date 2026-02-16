"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";
import { useMounted } from "../hooks/useMounted";
import { useScrollLock } from "../hooks/useScrollLock";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useCloseAnimation } from "../hooks/useCloseAnimation";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

export default function Modal({
  open,
  onClose,
  children,
  ariaLabel,
  className,
}: ModalProps) {
  const mounted = useMounted();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { closing, handleClose } = useCloseAnimation(onClose);

  useScrollLock(open);
  useEscapeKey(handleClose, open);

  // Focus management
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    // Focus the content area on open
    contentRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const content = contentRef.current;
    if (!content) return;

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = content!.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={handleClose}
    >
      <div
        ref={contentRef}
        data-neko-block="true"
        className={`${styles.content} texture-paper ${closing ? styles.contentClosing : ""} ${className || ""}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.close}
          onClick={handleClose}
          aria-label="Close"
          type="button"
        >
          ×
        </button>
        <div className={styles.scroll}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
