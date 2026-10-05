import QRCode from "qrcode";

import { getPublicSiteUrl } from "@/config/site";
import { getAdminAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// The printable QR code of one branch: /admin/locations/<id>/qr?format=svg|png
// It holds the branch's permanent address and nothing else, so the same print
// keeps working however the menu, the languages or the design change.
export async function GET(
  request: Request,
  { params }: RouteContext<"/admin/locations/[id]/qr">,
) {
  const access = await getAdminAccess();
  if (access.status !== "ok") {
    return new Response("Forbidden", { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response("Not found", { status: 404 });
  }

  const supabase = await createClient();
  const { data: location } = await supabase
    .from("locations")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (!location) {
    return new Response("Not found", { status: 404 });
  }

  const url = `${getPublicSiteUrl()}/${location.slug}`;
  const search = new URL(request.url).searchParams;
  const options = {
    // Survives a scratched or slightly covered print.
    errorCorrectionLevel: "Q" as const,
    margin: 3,
    color: { dark: "#2a1003", light: "#ffffff" },
  };
  const disposition = search.has("download")
    ? `attachment; filename="caramel-${location.slug}-qr`
    : null;

  if (search.get("format") === "png") {
    const png = await QRCode.toBuffer(url, { ...options, width: 1600 });
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        ...(disposition
          ? { "Content-Disposition": `${disposition}.png"` }
          : {}),
      },
    });
  }

  const svg = await QRCode.toString(url, { ...options, type: "svg" });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store",
      ...(disposition ? { "Content-Disposition": `${disposition}.svg"` } : {}),
    },
  });
}
