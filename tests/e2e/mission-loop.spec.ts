import { expect, test } from "@playwright/test";

test.describe("core launchpad flows", () => {
  test("fresh reset opens the launchpad with primary CTAs", async ({ page }) => {
    await page.goto("/patterns");
    await expect(page.getByRole("heading", { name: "Choose the pattern lane to train next" })).toBeVisible();
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Start here" })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Best next step")).toBeVisible();
    await expect(page.getByRole("link", { name: "Patterns", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Missions", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review", exact: true })).toBeVisible();
  });

  test("legacy skills route redirects to patterns", async ({ page }) => {
    await page.goto("/skills");
    await page.waitForURL(/\/patterns$/);

    await expect(page.getByText("Learn patterns")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Choose the pattern lane to train next" })).toBeVisible();
  });

  test("patterns page launches pattern-focused drills", async ({ page }) => {
    await page.goto("/patterns");

    await expect(page.getByRole("heading", { name: "Choose the pattern lane to train next" })).toBeVisible();
    await page.getByRole("button", { name: "B1" }).click();
    await page.getByRole("button", { name: /Past events/i }).click();
    await page.getByRole("link", { name: "Start pattern practice" }).click();

    await page.waitForURL(/\/drills\?focus=pattern&level=B1&pattern=past_events$/);
    await expect(page.locator("body")).toContainText(/Generating drills|Pattern set|1\/5|B1 Past events/);
  });
});

test.describe("missions flow", () => {
  test("missions page can set an active mission and open the current mission hub", async ({ page }) => {
    await page.goto("/missions");

    const setActive = page.getByRole("button", { name: "Set active" }).first();
    await expect(setActive).toBeVisible();
    await setActive.click();

    await expect(page.getByText("Current mission")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open mission" })).toBeVisible();

    await page.getByRole("link", { name: "Open mission" }).click();
    await page.waitForURL(/\/missions\/current$/);

    await expect(page.getByText("Mission progress")).toBeVisible();
    await expect(page.getByRole("link", { name: /Review words/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Do drills/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Practice conversation/i })).toBeVisible();
  });
});
