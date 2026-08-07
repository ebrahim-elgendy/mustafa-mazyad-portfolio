"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { EASE_OUT_EXPO } from "@/lib/motion";
import type { WorkItem } from "@/lib/data/work";

interface PhotoLightboxProps {
  items: WorkItem[];
  openIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function PhotoLightbox({
  items,
  openIndex,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  const prefersReducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const isOpen = openIndex !== null;
  const item = openIndex !== null ? items[openIndex] : null;
  const prevIndex =
    openIndex !== null ? (openIndex - 1 + items.length) % items.length : 0;
  const nextIndex = openIndex !== null ? (openIndex + 1) % items.length : 0;

  // Lock body scroll, move focus into the dialog, and restore it on close.
  useEffect(() => {
    if (!isOpen) return;

    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      lastFocusedRef.current?.focus();
    };
  }, [isOpen]);

  // Esc / arrow-key navigation and a focus trap while the dialog is open.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNavigate(nextIndex);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNavigate(prevIndex);
      } else if (e.key === "Tab") {
        const container = dialogRef.current;
        if (!container) return;
        const focusables = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, prevIndex, nextIndex, onClose, onNavigate]);

  const overlayVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: prefersReducedMotion ? 0.15 : 0.35, ease: EASE_OUT_EXPO },
    },
  };

  const contentVariants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.15 } } }
    : {
        hidden: { opacity: 0, scale: 0.96 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
      };

  return (
    <AnimatePresence>
      {isOpen && item && (
        <motion.div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-bg/95 p-4 sm:p-8"
          variants={overlayVariants}
          initial="hidden"
          animate="show"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${item.title}, ${item.year}`}
            variants={contentVariants}
            className="relative flex max-h-full w-full max-w-5xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close lightbox"
              className="absolute -top-14 right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:-top-16 sm:-right-2"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="relative flex max-h-[70vh] w-full items-center justify-center">
              <Image
                key={item.id}
                src={item.imageUrl}
                alt={item.title}
                width={item.imageWidth}
                height={item.imageHeight}
                sizes="90vw"
                priority
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="mt-6 flex w-full items-center justify-center gap-6 sm:gap-10">
              <button
                type="button"
                onClick={() => onNavigate(prevIndex)}
                aria-label="Previous image"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-strong text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" width="14" height="14" fill="none">
                  <path
                    d="M12.5 4L7 10l5.5 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="min-w-0 text-center">
                <p className="truncate font-display text-lg text-ink sm:text-xl">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-muted sm:text-sm">{item.year}</p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate(nextIndex)}
                aria-label="Next image"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-strong text-ink transition-colors hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" width="14" height="14" fill="none">
                  <path
                    d="M7.5 4L13 10l-5.5 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
