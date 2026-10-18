import { expect, test } from "@playwright/test";

test("theme follows system changes until a preference is chosen", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/about");
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(
    page.getByRole("button", { name: "Switch to light mode", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("rateupv-theme")),
  ).toBeNull();

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass("light");
  await expect(
    page.getByRole("button", { name: "Switch to dark mode", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("rateupv-theme")),
  ).toBeNull();
});

test("icon button remembers a keyboard choice across pages, reloads and tabs", async ({
  page,
  context,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/about");
  const button = page.getByRole("button", {
    name: "Switch to dark mode",
    exact: true,
  });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveClass("dark");
  expect(await page.evaluate(() => localStorage.getItem("rateupv-theme"))).toBe(
    "dark",
  );
  await expect(
    page.getByRole("button", { name: "Switch to light mode", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${info.project.name}-dark-theme.png`,
  });

  await page
    .getByRole("navigation", { name: "Footer", exact: true })
    .getByRole("link", { name: "Privacy", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Privacy at RateUPV",
  );
  await expect(page.locator("html")).toHaveClass("dark");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.emulateMedia({ colorScheme: "dark" });

  const otherTab = await context.newPage();
  try {
    await otherTab.goto("/about");
    await expect(otherTab.locator("html")).toHaveClass("dark");
    await otherTab
      .getByRole("button", { name: "Switch to light mode", exact: true })
      .click();
    await expect(otherTab.locator("html")).toHaveClass("light");
    await expect(page.locator("html")).toHaveClass("light");
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(255, 247, 240)",
    );
  } finally {
    await otherTab.close();
  }
  expect(errors).toEqual([]);
});

test("system theme and correct icon apply before React hydration", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/about");
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(24, 18, 23)",
  );
  const button = page.getByRole("button", {
    name: "Switch to light mode",
    exact: true,
  });
  await expect(button).toBeVisible();
  await expect(button.locator("svg").first()).not.toBeVisible();
  await expect(button.locator("svg").last()).toBeVisible();
});

test("theme still switches when browser storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/about");
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  await expect(page.locator("html")).toHaveClass("light");
});
