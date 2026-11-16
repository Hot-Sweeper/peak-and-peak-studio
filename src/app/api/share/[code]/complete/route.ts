import { bearerToken, completeShare, errorResponse } from "@/lib/share/server-store";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    await completeShare(code, bearerToken(request));
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
