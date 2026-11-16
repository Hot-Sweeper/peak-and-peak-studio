import { createShare, errorResponse } from "@/lib/share/server-store";

export const runtime = "nodejs";

/** Starts a share: registers the song list and returns the code plus a private upload token. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    return Response.json(await createShare(body), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
