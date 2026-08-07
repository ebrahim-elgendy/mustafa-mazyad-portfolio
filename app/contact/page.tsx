import type { Metadata } from "next";
import ContactContent from "@/components/ContactContent";

export const metadata: Metadata = {
  title: "Contact — Mustafa Mazyad",
  description:
    "Get in touch with Mustafa Mazyad to talk through a photography or video project.",
};

export default function ContactPage() {
  return <ContactContent />;
}
