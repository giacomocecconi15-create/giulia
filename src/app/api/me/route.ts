import { json } from "@/lib/api";
import { getCurrentCustomer } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const c = await getCurrentCustomer();
  return json({ customer: c ? { name: c.name, phone: c.phone } : null });
}
