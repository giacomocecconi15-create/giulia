"use client";

import { trackInstagram } from "./track";

export default function InstagramLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => trackInstagram("profilo")} className={className}>
      {children}
    </a>
  );
}
