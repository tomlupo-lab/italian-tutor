const RAW_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/tutor";

export const APP_BASE_PATH =
  RAW_BASE_PATH === "/"
    ? ""
    : RAW_BASE_PATH.replace(/\/+$/, "");

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const needsManualPrefix =
    normalized === "/manifest.json" ||
    normalized.startsWith("/api/") ||
    normalized.startsWith("/icons/");
  if (!needsManualPrefix) return normalized;
  if (!APP_BASE_PATH) return normalized;
  if (normalized === APP_BASE_PATH) return normalized;
  if (normalized.startsWith(`${APP_BASE_PATH}/`)) return normalized;
  return `${APP_BASE_PATH}${normalized}`;
}

export function apiPath(route: string): string {
  const normalized = route.startsWith("/api/")
    ? route
    : `/api/${route.replace(/^\/+/, "")}`;
  return withBasePath(normalized);
}
