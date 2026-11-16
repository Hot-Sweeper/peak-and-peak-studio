import { bearerToken, deleteShare, errorResponse, getManifest } from "@/lib/share/server-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

/** Public manifest: song list, playlists and which songs have arrived so far. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { code } = await params;
    return Response.json(await getManifest(code), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Stop sharing. Only the device holding the upload token can do this. */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { code } = await params;
    await deleteShare(code, bearerToken(request));
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
