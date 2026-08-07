"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 64;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[var(--z-nav)] transition-colors duration-300 ${
        scrolled
          ? "bg-bg/90 backdrop-blur border-b border-border"
          : "bg-gradient-to-b from-black/55 via-black/20 to-transparent border-b border-transparent"
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8"
      >
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-ink transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-sm"
        >
          Mustafa Mazyad
        </Link>

        <Link
          href="/contact"
          className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Book a Call
        </Link>
      </nav>
    </header>
  );
}
