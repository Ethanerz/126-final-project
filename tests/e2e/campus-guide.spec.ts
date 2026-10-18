import { test, expect } from "@playwright/test";
const library = "163f2330-9a0d-4a07-bb0e-4a8bac5e1db1";
test("discover a place and see honest preparation and review evidence", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "KNOW YOUR CAMPUS",
  );
  await page
    .getByRole("textbox", { name: "Search campus places" })
    .fill("library");
  await expect(
    page.getByRole("link", { name: "UPV New Library", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("1 place");
  await page
    .getByRole("link", { name: "UPV New Library", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "UPV New Library",
  );
  await expect(page.getByText("Opening hours", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Open walking directions/ }),
  ).toHaveAttribute("href", /google\.com\/maps\/dir\/\?api=1/);
  await expect(
    page.getByRole("heading", { name: "Student experiences" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${info.project.name}-place.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("task shortcuts work after navigation and empty filters can recover", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Payments & documents/ }).click();
  await expect(
    page.getByRole("button", { name: "Documents & payments" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("link", { name: "New Admin Cash Office", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Search campus places" })
    .fill("a place that does not exist");
  await expect(
    page.getByRole("heading", { name: "No places found" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "UPV New Library", exact: true }),
  ).toBeVisible();
});
test("signed-out review drafts survive sign-in navigation", async ({
  page,
}) => {
  await page.goto(`/places/${library}`);
  await page.getByRole("button", { name: "Share an experience" }).click();
  await page.getByLabel("One-line takeaway").fill("My useful campus visit");
  await page
    .getByLabel("Your firsthand experience")
    .fill(
      "I used the library during a campus visit and have some useful context.",
    );
  await page.getByRole("link", { name: "Sign in to share" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await page.goto(`/places/${library}?review=1`);
  await expect(page.getByLabel("One-line takeaway")).toHaveValue(
    "My useful campus visit",
  );
});
test("corrections do not claim to submit while signed out", async ({
  page,
}) => {
  await page.goto(`/places/${library}`);
  await page
    .getByRole("button", { name: "Suggest a correction", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Sign in with your confirmed UP email",
  );
  await expect(
    page.getByRole("button", { name: "Submit privately" }),
  ).toHaveCount(0);
});
test("map is opt-in, places are selectable, and legacy URLs redirect", async ({
  page,
}) => {
  await page.goto("/mappreview");
  await expect(page).toHaveURL(/\/map/);
  await expect(page.locator("iframe")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Search map places" })
    .fill("library");
  await page.getByRole("button", { name: /UPV New Library/ }).click();
  await expect(page.getByRole("link", { name: "Place guide" })).toHaveAttribute(
    "href",
    `/places/${library}`,
  );
  await page.getByRole("button", { name: "Load campus map" }).click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    /www\.openstreetmap\.org\/export\/embed\.html.*marker=/,
  );
  await page.goto(`/rating/${library}`);
  await expect(page).toHaveURL(`/places/${library}`);
});
test("mobile and desktop layouts fit their viewport", async ({
  page,
}, info) => {
  for (const route of [
    "/",
    "/about",
    "/account",
    "/map",
    `/places/${library}`,
  ]) {
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible();
    expect(
      await page.evaluate(
        (viewportWidth) =>
          document.documentElement.scrollWidth <= viewportWidth + 1,
        page.viewportSize()!.width,
      ),
      route,
    ).toBe(true);
  }
  await page.goto("/");
  const lastPlace = page.getByRole("link", {
    name: "UP Visayas - Miagao Campus",
    exact: true,
  });
  await lastPlace.scrollIntoViewIfNeeded();
  await expect(lastPlace).toBeInViewport();
  await page
    .getByRole("heading", { name: "Explore campus", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/${info.project.name}-directory.png`,
  });
  await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/${info.project.name}-home.png`,
  });
});
