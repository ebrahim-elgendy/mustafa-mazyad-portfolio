import Link from "next/link";

const CONTACT_EMAIL = "mostafa.mazyad@gmail.com";

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/mostafa_mazyad_studio" },
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
              Mostafa Mazyad
            </Link>
            <p className="mt-4 text-sm text-muted">
              Photographer & Filmmaker based in the UAE.
              <br />
              Commercial stories, crafted frame by frame.
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
                  target="_blank"
                  rel="noopener noreferrer"
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
            &copy; {year} Mostafa Mazyad. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
