// Shared CORS handling for all edge functions.
//
// By default (no ALLOWED_ORIGINS secret configured) this keeps the previous
// permissive behavior ("*") so nothing breaks for existing deployments.
// Once you set the ALLOWED_ORIGINS secret in Supabase (comma-separated list
// of full origins, e.g. "https://app.example.com,https://staging.example.com"),
// only those origins get a matching Access-Control-Allow-Origin — every other
// origin still gets a response, but the browser will block the JS from reading
// it, which is what actually stops random third-party sites from calling your
// authenticated functions from a visitor's browser.
export function buildCorsHeaders(
  req: Request,
  allowedHeaders = "authorization, x-client-info, apikey, content-type",
  allowedMethods = "POST, OPTIONS",
): Record<string, string> {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const requestOrigin = req.headers.get("Origin") ?? req.headers.get("origin") ?? "";

  let allowOrigin = "*";
  if (configured.length > 0) {
    allowOrigin = configured.includes(requestOrigin) ? requestOrigin : configured[0];
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": allowedHeaders,
    "Access-Control-Allow-Methods": allowedMethods,
    "Vary": "Origin",
  };
}
