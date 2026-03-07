import { NextRequest, NextResponse } from "next/server";

function isAllowedBrowser(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  const isChromeFamily = ua.includes("chrome") || ua.includes("crios") || ua.includes("chromium");
  const isEdge = ua.includes("edg/");
  const isFirefox = ua.includes("firefox") || ua.includes("fxios");
  const isSafari = ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium");
  const isLegacyIe = ua.includes("msie") || ua.includes("trident/");

  if (isLegacyIe) return false;
  return isChromeFamily || isEdge || isFirefox || isSafari;
}

function isKnownDeviceClass(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  const isPhone = ua.includes("mobile");
  const isTablet = ua.includes("tablet") || ua.includes("ipad");
  const isDesktopLike = ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux");
  return isPhone || isTablet || isDesktopLike;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname === "/unsupported-device") {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent) {
    return NextResponse.next();
  }

  if (!isAllowedBrowser(userAgent) || !isKnownDeviceClass(userAgent)) {
    const url = request.nextUrl.clone();
    url.pathname = "/unsupported-device";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("x-aya-device-policy", "enforced");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
