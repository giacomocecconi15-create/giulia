import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Agenda", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/admin" className="font-display text-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-level-up.svg" alt="Level Up" width={72} height={36} className="inline h-8 w-auto align-middle" />{" "}
            <span className="align-middle text-sm text-ink-3">agenda</span>
          </Link>
          <Link href="/account" className="text-sm text-ink-3 underline underline-offset-4">
            {admin.name}
          </Link>
        </div>
        <div className="hidden md:block">
          <AdminNav />
        </div>
      </header>
      <main id="contenuto" className="mx-auto max-w-3xl px-4 py-6">
        {children}
      </main>
      <div className="md:hidden">
        <AdminNav />
      </div>
    </div>
  );
}
