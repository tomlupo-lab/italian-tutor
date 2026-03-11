import type { FullConfig } from "@playwright/test";

const ROUTES_TO_WARM = ["/patterns", "/", "/missions"];

async function waitForRoute(baseURL: string, path: string) {
  const url = new URL(path, baseURL).toString();
  const deadline = Date.now() + 60_000;
  let lastError = "route never became ready";

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { cache: "no-store", redirect: "follow" });
      if (response.ok) {
        return;
      }
      lastError = `status=${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error(`Route warmup failed for ${url}: ${lastError}`);
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (typeof baseURL !== "string" || baseURL.length === 0) {
    throw new Error("Playwright baseURL is required for route warmup.");
  }

  for (const path of ROUTES_TO_WARM) {
    await waitForRoute(baseURL, path);
  }
}
