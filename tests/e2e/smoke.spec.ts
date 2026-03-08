import { expect, test } from "@playwright/test";

const viewports = [
  { label: "phone", width: 360, height: 800 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "laptop", width: 1280, height: 900 }
] as const;

for (const viewport of viewports) {
  test(`home page renders the sales core launcher on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Aya Mobile" })).toBeVisible();
    await expect(page.getByText("PX-03 Sales Core Slice")).toBeVisible();
    await expect(page.getByRole("link", { name: "قائمة المنتجات الآمنة" })).toBeVisible();
    await expect(page.getByRole("link", { name: "شاشة نقطة البيع" })).toBeVisible();
    await expect(page.getByRole("button", { name: "تثبيت Aya Mobile" })).toBeVisible();
  });
}

test("health endpoint returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  const payload = await response.json();

  expect(response.ok()).toBeTruthy();
  expect(payload.success).toBe(true);
  expect(payload.data.status).toBe("ok");
});

test("manifest exposes installability metadata", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  const payload = await response.json();

  expect(response.ok()).toBeTruthy();
  expect(payload.display).toBe("standalone");
  expect(payload.start_url).toBe("/");
  expect(payload.icons).toHaveLength(2);
  expect(payload.categories).toContain("business");
});

test("products route shows access guard when there is no active session", async ({ page }) => {
  await page.goto("/products");

  await expect(page.getByRole("heading", { name: "يلزم تسجيل الدخول لقراءة المنتجات" })).toBeVisible();
  await expect(page.getByText("الوصول يتطلب جلسة صالحة")).toBeVisible();
});

test("pos route shows access guard when there is no active session", async ({ page }) => {
  await page.goto("/pos");

  await expect(page.getByRole("heading", { name: "يلزم تسجيل الدخول لفتح نقطة البيع" })).toBeVisible();
  await expect(page.getByText("الوصول يتطلب جلسة صالحة")).toBeVisible();
});
