import { whatsappLink } from "@/lib/site";

export default function WhatsAppButton() {
  const href = whatsappLink("Ciao Giulia, vorrei un'informazione.");
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 z-40 flex min-h-12 items-center border border-ink bg-ink px-4 text-sm font-semibold text-bg transition-colors hover:bg-blue hover:text-ink md:right-8 md:bottom-8"
    >
      Scrivici su WhatsApp
    </a>
  );
}
