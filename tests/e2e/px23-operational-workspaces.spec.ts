import { expect, test } from "@playwright/test";
import {
  createFixtureUser,
  createServiceRoleClient,
  expectNoHorizontalOverflow,
  login,
  type FixtureUser
} from "./helpers/local-runtime";

test.describe.configure({ timeout: 120_000 });

type Px23Seed = {
  admin: FixtureUser;
  pos: FixtureUser;
};

let seed: Px23Seed;

test.describe.serial("PX-23 operational workspaces", () => {
  test.beforeAll(async () => {
    const supabase = createServiceRoleClient();
    seed = {
      admin: await createFixtureUser(supabase, "admin", "px23-admin"),
      pos: await createFixtureUser(supabase, "pos_staff", "px23-pos")
    };
  });

  test("phone POS gets a clearer products catalog without horizontal overflow", async ({ page }) => {
    await login(page, seed.pos.email, seed.pos.password, "/products");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/products", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "المنتجات الجاهزة للبيع" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ابدأ من المنتج أو التصنيف" })).toBeVisible();
    await expect(page.getByPlaceholder("ابحث باسم المنتج أو SKU")).toBeVisible();
    await expect(page.getByRole("button", { name: "الكل" })).toBeVisible();
    await expect(
      page
        .getByRole("heading", { name: "بطاقات المنتجات" })
        .or(page.getByRole("heading", { name: "لم نصل إلى منتجات مطابقة" }))
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("tablet admin gets notifications inbox, alerts, and search in a clearer structure", async ({ page }) => {
    await login(page, seed.admin.email, seed.admin.password, "/notifications");
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "مركز التنبيهات والمتابعة" })).toBeVisible();
    const sectionNav = page.getByLabel("أقسام مركز الإشعارات");

    await expect(sectionNav.getByRole("button", { name: "صندوق الإشعارات" })).toBeVisible();
    await expect(sectionNav.getByRole("button", { name: "الملخصات والتنبيهات" })).toBeVisible();
    await expect(sectionNav.getByRole("button", { name: "البحث الشامل" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "الإشعارات الحالية" })).toBeVisible();

    await sectionNav.getByRole("button", { name: "البحث الشامل" }).click();
    await expect(page.getByRole("heading", { name: "نتائج البحث الحالية" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("desktop admin gets calmer operational IA across inventory, suppliers, expenses, operations, and maintenance", async ({
    page
  }) => {
    await login(page, seed.admin.email, seed.admin.password, "/inventory");
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto("/inventory", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "الجرد والتسوية المحسنة" })).toBeVisible();
    await expect(page.getByRole("button", { name: "الجرد المفتوح" })).toBeVisible();
    await expect(page.getByRole("button", { name: "آخر النتائج" })).toBeVisible();

    await page.goto("/suppliers", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "الموردون والمشتريات" })).toBeVisible();
    const suppliersSections = page.getByLabel("أقسام الموردين والمشتريات");
    await expect(suppliersSections.getByRole("button", { name: "الدليل والتفاصيل" })).toBeVisible();
    await expect(suppliersSections.getByRole("button", { name: "أوامر الشراء" })).toBeVisible();
    await expect(suppliersSections.getByRole("button", { name: "التسديدات" })).toBeVisible();

    await page.goto("/expenses", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "المصروفات ومركز الفئات" })).toBeVisible();
    const expensesSections = page.getByLabel("أقسام شاشة المصروفات");
    await expect(expensesSections.getByRole("button", { name: "تسجيل المصروف" })).toBeVisible();

    await page.goto("/operations", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("main").getByRole("heading", { name: "الشحن والتحويلات" })).toBeVisible();
    const operationsSections = page.getByLabel("أقسام شاشة العمليات");
    await expect(operationsSections.getByRole("button", { name: "تحويل داخلي" })).toBeVisible();

    await page.goto("/maintenance", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "الصيانة الأساسية" })).toBeVisible();
    await expect(page.getByRole("button", { name: "أوامر الصيانة" })).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
});
