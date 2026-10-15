import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cek cepat: tanpa cookie sesi langsung ke /login. Verifikasi sebenarnya (token + user aktif
// + role) tetap dilakukan di server lewat requireUser() / requireOwner().
export function proxy(request: NextRequest) {
  if (!request.cookies.get("clars_session")) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
