// src/middleware.ts
import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

// Only keep the session in sync; gating/redirects happen in server components
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only run this for your protected app area (dashboard)
  matcher: ["/dashboard/:path*"],
};
