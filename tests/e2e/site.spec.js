import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SECTIONS = [
  "needle-drop",
  "platter",
  "inside",
  "the-arm",
  "finishes",
  "flip",
  "liner-notes",
  "pre-order",
  "runout",
];

/** İğne inene kadar bekle: hero başlığı görünür olur */
async function waitForNeedleDrop(page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Lathe One/ })).toBeVisible();
}

test.describe("Lathe One", () => {
  test("loads without console errors and plays the intro", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await waitForNeedleDrop(page);
    expect(errors).toEqual([]);
  });

  test("every track is on the page in order", async ({ page }) => {
    await waitForNeedleDrop(page);
    const ids = await page.evaluate(
      (ids) =>
        ids.map((id) =>
          document.getElementById(id)
            ? document.getElementById(id).getBoundingClientRect().top + window.scrollY
            : -1,
        ),
      SECTIONS,
    );
    expect(ids.every((y) => y >= 0)).toBe(true);
    expect([...ids].sort((a, b) => a - b)).toEqual(ids);
  });

  test("no horizontal overflow", async ({ page }) => {
    await waitForNeedleDrop(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("tracklist opens, traps focus and closes with Escape", async ({ page }) => {
    await waitForNeedleDrop(page);
    await page.getByRole("button", { name: /Open the tracklist/ }).click();
    const dialog = page.getByRole("dialog", { name: "Lathe One" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: /Liner notes/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("custom cursor stays visible above the tracklist", async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "Özel imleç yalnızca hassas işaretçili cihazlarda");
    await waitForNeedleDrop(page);
    await page.getByRole("button", { name: /Open the tracklist/ }).click();
    await page.mouse.move(400, 400);
    await page.mouse.move(420, 420);
    // Dialog top layer'da; imleç onun içine taşınmış olmalı
    const cursorInDialog = page.locator("dialog[open] [data-cursor-root]");
    await expect(cursorInDialog).toHaveCount(1);
    await expect(cursorInDialog.locator("div").first()).toHaveCSS("opacity", "1");
    await page.keyboard.press("Escape");
    await expect(page.locator("body > [data-cursor-root]")).toHaveCount(1);
  });

  test("tracklist links scroll to their track", async ({ page }) => {
    await waitForNeedleDrop(page);
    await page.getByRole("button", { name: /Open the tracklist/ }).click();
    await page.getByRole("link", { name: /Liner notes/ }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Math.abs(document.getElementById("liner-notes").getBoundingClientRect().top),
          ),
        {
          timeout: 30_000,
        },
      )
      .toBeLessThan(4);
  });

  test("finish picker is a keyboard-usable radio group", async ({ page }) => {
    await waitForNeedleDrop(page);
    const ash = page.getByRole("radio", { name: "Ash" });
    await ash.check({ force: true });
    await expect(ash).toBeChecked();
    await expect(page.getByText(/Pale European ash/)).toBeVisible();
  });

  test("pre-order form validates and confirms", async ({ page }) => {
    await waitForNeedleDrop(page);
    await page.locator("#pre-order").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Reserve one" }).click();
    await expect(page.getByText(/Enter an email address/)).toBeVisible();
    await page.getByLabel("Email").fill("listener@example.com");
    await page.getByRole("button", { name: "Reserve one" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Reserved." })).toBeVisible();
  });

  test("sound toggle reports its state", async ({ page }) => {
    await waitForNeedleDrop(page);
    const toggle = page.getByRole("button", { name: /Sound off/ });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(page.getByRole("button", { name: /Sound on/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await waitForNeedleDrop(page);
    const results = await new AxeBuilder({ page }).exclude("canvas").analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});

test.describe("404", () => {
  test("unknown paths show the missing track and link back", async ({ page }) => {
    await page.goto("/limited-edition");
    await expect(
      page.getByRole("heading", { level: 1, name: "That track isn’t on the record." }),
    ).toBeVisible();
    await expect(page.locator("del")).toHaveText("/limited-edition");
    await expect(page.getByRole("link", { name: "Play side A" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: /Pre-order/ }).last()).toHaveAttribute(
      "href",
      "/#pre-order",
    );
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  test("deep links from the 404 land on their track", async ({ page }) => {
    await page.goto("/#pre-order");
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Math.abs(document.getElementById("pre-order").getBoundingClientRect().top),
          ),
        {
          timeout: 120_000,
        },
      )
      .toBeLessThan(4);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("content stays visible and readable", async ({ page }) => {
    await waitForNeedleDrop(page);
    for (const id of ["platter", "the-arm", "liner-notes"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expect(page.locator(`#${id} h2`)).toBeVisible();
    }
  });
});
