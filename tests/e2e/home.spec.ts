import { expect, test } from "@playwright/test";

test("opens the Steam search panel from the mode selection", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /點燃火柴/ }).click();
  await expect(page.getByRole("button", { name: /回答問題/ })).toBeVisible();
  await expect(page.getByTestId("steam-search-input")).toBeVisible();
});

test("renders mocked Steam search results", async ({ page }) => {
  await page.route("**/api/steam/search?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        source: "steam-store",
        query: "Hades",
        total: 1,
        games: [{
          appId: 1145360,
          name: "Hades",
          description: "",
          genres: ["動作"],
          modes: ["單人"],
          platforms: ["PC"],
          priceType: "paid",
          priceRange: "NT$ 408",
          languages: ["英文"],
          coverUrl: "",
          headerImage: "",
          steamUrl: "https://store.steampowered.com/app/1145360/",
          releaseDate: "2020",
          metacriticScore: 93,
        }],
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /點燃火柴/ }).click();
  const input = page.getByTestId("steam-search-input");
  await input.fill("Hades");
  await page.getByTestId("steam-search-submit").click();
  await expect(page.getByTestId("steam-results")).toContainText("Hades");
  await expect(page.getByTestId("steam-results")).toContainText("NT$ 408");
});

test("renders the my games page for an unauthenticated visitor", async ({ page }) => {
  await page.goto("/my-games");
  await expect(page.locator(".my-games-frame")).toBeVisible();
  await expect(page.locator(".music-player")).toBeVisible();
  await expect(page.getByRole("heading", { name: /你的遊戲/ })).toBeVisible();
  await expect(page.getByText(/登入後查看你的遊戲|尚未連接雲端資料庫/)).toBeVisible();
});
