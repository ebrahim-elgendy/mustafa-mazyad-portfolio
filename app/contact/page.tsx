import type { Metadata } from "next";
import ContactContent from "@/components/ContactContent";

export const metadata: Metadata = {
  title: "Contact — Mostafa Mazyad",
  description:
    "Get in touch with Mostafa Mazyad to talk through a photography or video project.",
};

export default function ContactPage() {
  return <ContactContent />;
}
