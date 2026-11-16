import { bearerToken, errorResponse, openTrack, storeTrack } from "@/lib/share/server-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string; trackId: string }> };

/** Upload one song's audio. The body is the raw file. */
export async function PUT(request: Request, { params }: Params) {
  try {
    const { code, trackId } = await params;
    await storeTrack(code, trackId, bearerToken(request), request.body);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Download one song's audio. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { code, trackId } = await params;
    const { track, size, stream } = await openTrack(code, trackId);
    return new Response(stream, {
      headers: {
        "Content-Type": track.type || "application/octet-stream",
        "Content-Length": String(size),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
