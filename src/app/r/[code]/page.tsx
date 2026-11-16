import { redirect } from "next/navigation";
import { normalizeCode } from "@/lib/share/code";

/** Short share links (/r/K7MQ-2P9X) open the studio with the receive sheet. */
export default async function ShareLink({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = normalizeCode(decodeURIComponent(code));
  redirect(normalized ? `/studio?receive=${normalized}` : "/studio?receive=");
}
