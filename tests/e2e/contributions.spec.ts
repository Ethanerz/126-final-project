// UI write-path tests use a deliberately fake session and intercepted REST calls.
// They never create real accounts or publish fixtures to the live database.
// Real database authorization is checked separately by verify-live-rls.sql.
import { test, expect, type Page } from "@playwright/test";
const userId = "99999999-9999-4999-8999-999999999999";
const library = "163f2330-9a0d-4a07-bb0e-4a8bac5e1db1";
async function session(page: Page, role = "student") {
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: expiry,
      role: "authenticated",
      aud: "authenticated",
    }),
  ).toString("base64url");
  const user = {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    email: "fixture@up.edu.ph",
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
  };
  await page.addInitScript(
    ({ user, expiry, payload }) => {
      localStorage.setItem(
        "sb-pfdxjuruayiekxfzkdmc-auth-token",
        JSON.stringify({
          access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.test-only-signature`,
          refresh_token: "test-only-refresh",
          token_type: "bearer",
          expires_at: expiry,
          expires_in: 3600,
          user,
        }),
      );
    },
    { user, expiry, payload },
  );
  await page.route("https://*.supabase.co/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/auth/v1/user"))
      return route.fulfill({ json: user });
    if (url.pathname.includes("/rest/v1/user_profiles"))
      return route.fulfill({ json: { role } });
    if (
      url.pathname.includes("/rest/v1/reviews") &&
      route.request().method() === "GET"
    )
      return route.fulfill({ json: null });
    // Every other browser request is blocked unless a test explicitly intercepts
    // it. The fake session cannot be sent to the actual project.
    return route.fulfill({
      status: 503,
      json: { message: "Unhandled fixture request" },
    });
  });
}
test("a review survives a failed write and retries with validated ownership", async ({
  page,
}) => {
  await session(page);
  let attempts = 0;
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/rest/v1/reviews*", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: null });
    expect(route.request().method()).toBe("POST");
    submitted = route.request().postDataJSON();
    attempts++;
    return attempts === 1
      ? route.fulfill({
          status: 503,
          json: { message: "Temporary unavailable" },
        })
      : route.fulfill({ json: { id: "test-review" } });
  });
  await page.goto(`/places/${library}`);
  await expect(page.getByRole("link", { name: /Your account/ })).toBeVisible();
  await page.getByRole("button", { name: "Share an experience" }).click();
  await page.getByRole("radio", { name: "4 out of 5 stars" }).click();
  await page.getByLabel("When did you visit?").fill("2026-09");
  await page.getByLabel("Public display name").fill("Campus reader");
  await page.getByLabel("One-line takeaway").fill("Useful firsthand context");
  const text =
    "I used this campus place recently and have useful firsthand details.";
  await page.getByLabel("Your firsthand experience").fill(text);
  await page
    .getByRole("button", { name: "Share experience", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Your review wasn’t saved",
  );
  await expect(page.getByLabel("Your firsthand experience")).toHaveValue(text);
  await page
    .getByRole("button", { name: "Share experience", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(submitted).toMatchObject({
    user_id: userId,
    entity_id: library,
    display_name: "Campus reader",
    visited_on: "2026-09-01",
    rating: 4,
    review_text: text,
  });
});
test("an author can edit a hidden review without republishing it", async ({
  page,
}) => {
  await session(page);
  let patch: Record<string, unknown> | undefined;
  const review = {
    id: "hidden-review",
    entity_id: library,
    user_id: userId,
    rating: 3,
    title: "A balanced visit",
    review_text:
      "This is the author’s existing firsthand experience with useful details.",
    display_name: "Campus reader",
    visited_on: "2026-09-01",
    moderation_status: "hidden",
    created_at: "2026-09-01",
    updated_at: "2026-09-01",
    upvote_count: 0,
    downvote_count: 0,
  };
  await page.route("**/rest/v1/reviews*", (route) => {
    if (route.request().method() === "PATCH") {
      patch = route.request().postDataJSON();
      return route.fulfill({ json: { id: review.id } });
    }
    return route.fulfill({ json: review });
  });
  await page.goto(`/places/${library}`);
  await expect(
    page.getByText("Hidden by a moderator", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit your experience", exact: true })
    .click();
  await page
    .getByLabel("One-line takeaway")
    .fill("A clearer firsthand takeaway");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(patch).toMatchObject({ title: "A clearer firsthand takeaway" });
  expect(patch).not.toHaveProperty("moderation_status");
});
test("a private correction reports success only after storage accepts it", async ({
  page,
}) => {
  await session(page);
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/rest/v1/submissions*", async (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ status: 201, body: "" });
  });
  await page.goto(`/places/${library}`);
  await expect(page.getByRole("link", { name: /Your account/ })).toBeVisible();
  await page
    .getByRole("button", { name: "Suggest a correction", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Details" })
    .fill("Please check this place against the official university source.");
  await page.getByRole("button", { name: "Submit privately" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Your submission is saved",
  );
  expect(submitted).toMatchObject({
    kind: "correction",
    user_id: userId,
    entity_id: library,
  });
  expect(submitted).not.toHaveProperty("status");
});
test("a moderator can record a decision and hide a reported review", async ({
  page,
}) => {
  await session(page, "admin");
  const changes: Record<string, unknown>[] = [];
  const item = {
    id: "report-fixture",
    user_id: userId,
    entity_id: library,
    review_id: "review-fixture",
    kind: "report",
    details: "A private report to review for community guideline concerns.",
    status: "open",
    moderator_note: null,
    created_at: new Date().toISOString(),
  };
  await page.route("**/rest/v1/entities*", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/rest/v1/submissions*", (route) => {
    if (route.request().method() === "PATCH") {
      const patch = route.request().postDataJSON();
      changes.push(patch);
      Object.assign(item, patch);
      return route.fulfill({ json: { id: item.id } });
    }
    return route.fulfill({ json: [item] });
  });
  await page.route("**/rest/v1/reviews*", (route) => {
    changes.push(route.request().postDataJSON());
    return route.fulfill({ json: { id: "review-fixture" } });
  });
  await page.goto("/manage");
  await expect(
    page.getByRole("heading", { name: "Campus guide workspace" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Moderator response (visible to submitter)" })
    .fill("Checking this against the community rules.");
  await page.getByRole("combobox", { name: "Submission status" }).click();
  await page.getByRole("option", { name: "reviewing", exact: true }).click();
  await page.getByRole("button", { name: "Save response" }).click();
  await expect.poll(() => changes.length).toBe(1);
  await page.getByRole("button", { name: "Hide reported review" }).click();
  await expect.poll(() => changes.length).toBe(2);
  expect(changes).toEqual([
    {
      status: "reviewing",
      moderator_note: "Checking this against the community rules.",
    },
    { moderation_status: "hidden" },
  ]);
});
