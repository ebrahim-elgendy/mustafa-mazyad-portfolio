import type { Metadata } from "next";
import { Bodoni_Moda, Hanken_Grotesk } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

const displayFont = Bodoni_Moda({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const sansFont = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mostafa Mazyad — Photographer & Filmmaker",
  description:
    "Mostafa Mazyad is a UAE-based photographer and filmmaker working across automotive, corporate, events, F&B, medical, real estate, sports, weddings, and content creation.",
};

const THEME_INIT_SCRIPT = `
  try {
    var theme = localStorage.getItem("theme");
    if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  } catch (e) {}
`;

// See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md —
// a bare <script> triggers a dev-mode React warning that this Next.js version treats as
// a hard render error; the text/plain-on-client swap sidesteps it.
function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before hydration so a returning light-mode visitor never sees a flash of dark. */}
        <InlineScript html={THEME_INIT_SCRIPT} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <Nav />
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
