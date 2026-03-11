import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const useExistingServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === "1";
const webServerPort = new URL(baseURL).port || "3000";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        }
      : undefined,
  },
  webServer: useExistingServer
    ? undefined
    : {
        command: `npm run build && PORT=${webServerPort} npm run start`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 240_000,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? "/",
        },
      },
});
