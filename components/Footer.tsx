import Link from "next/link";

// Placeholder contact + social destinations — confirm real handles/links with the client before launch.
const CONTACT_EMAIL = "hello@mustafamazyad.com";

const SOCIAL_LINKS = [
  { label: "Instagram", href: "#" },
  { label: "Behance", href: "#" },
  { label: "Reel (Vimeo)", href: "#" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[1800px] px-5 py-14 sm:px-8 lg:px-16">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link
              href="/"
              className="font-display text-xl tracking-tight text-ink transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm"
            >
              Mustafa Mazyad
            </Link>
            <p className="mt-4 text-sm text-muted">
              A cinematic eye, five industries, one consistent frame.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:items-end">
            <Link
              href="/contact"
              className="text-sm font-medium text-ink transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm"
            >
              Get in Touch
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="-mt-3 text-sm text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm"
            >
              {CONTACT_EMAIL}
            </a>

            <nav aria-label="Social links" className="flex flex-wrap gap-x-6 gap-y-2">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-sm"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-xs text-muted">
            &copy; {year} Mustafa Mazyad. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
