import { expect, test } from "@playwright/test";
import {
  createFixtureUser,
  createServiceRoleClient,
  expectNoHorizontalOverflow,
  login,
  type FixtureUser
} from "./helpers/local-runtime";

test.describe.configure({ timeout: 120_000 });

type Px22Seed = {
  admin: FixtureUser;
  pos: FixtureUser;
};

let seed: Px22Seed;

test.describe.serial("PX-22 transactional UX", () => {
  test.beforeAll(async () => {
    const supabase = createServiceRoleClient();
    seed = {
      admin: await createFixtureUser(supabase, "admin", "px22-admin"),
      pos: await createFixtureUser(supabase, "pos_staff", "px22-pos")
    };
  });

  test("phone POS gets a touch-friendly product and checkout flow", async ({ page }) => {
    await login(page, seed.pos.email, seed.pos.password);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/pos", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "نقطة البيع السريعة" })).toBeVisible();
    await expect(page.getByPlaceholder("ابحث باسم المنتج أو SKU")).toBeVisible();
    await expect(page.getByRole("button", { name: "الكل" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "سلة الطلب الحالية" })).toBeVisible();
    await expect(page.getByRole("button", { name: "تأكيد البيع" })).toBeVisible();
    await expect(page.getByText("حساب الدفع", { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("desktop admin gets invoice actions grouped by section without clutter", async ({ page }) => {
    await login(page, seed.admin.email, seed.admin.password);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/invoices", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "الفواتير والإيصالات والمرتجعات" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "قائمة الفواتير" })).toBeVisible();
    await expect(page.getByRole("button", { name: "الملخص والإيصال" })).toBeVisible();
    await expect(page.getByRole("button", { name: "المرتجع" })).toBeVisible();
    await expect(page.getByRole("button", { name: "الإجراء الإداري" })).toBeVisible();
    await expect(page.getByText("تفاصيل الفاتورة")).toBeVisible();

    await page.getByRole("button", { name: "المرتجع" }).click();
    await expect(page.getByRole("button", { name: "المرتجع" })).toBeVisible();

    await page.getByRole("button", { name: "الإجراء الإداري" }).click();
    await expect(page.getByRole("button", { name: "الإجراء الإداري" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("tablet admin gets clearer debt summary and payment flow", async ({ page }) => {
    await login(page, seed.admin.email, seed.admin.password);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/debts", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "الديون والتسديد" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "العملاء والرصيد المفتوح" })).toBeVisible();
    await expect(page.getByRole("button", { name: "العملاء والقيود" })).toBeVisible();
    await expect(page.getByRole("button", { name: "دين يدوي" })).toBeVisible();
    await expect(page.getByRole("button", { name: "التسديد" })).toBeVisible();

    await page.getByRole("button", { name: "التسديد" }).click();
    await expect(page.getByText("الرصيد المفتوح", { exact: true })).toBeVisible();
    await expect(page.getByText("العميل الحالي", { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
