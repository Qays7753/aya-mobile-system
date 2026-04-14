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

const POS_TITLE = "نقطة البيع";
const PRODUCT_PLACEHOLDER = "ابحث بالاسم أو رمز المنتج...";
const CURRENT_CART_TITLE = "السلة";
const EMPTY_CART_MESSAGE = "ابدأ بإضافة منتج";
const INVOICES_TITLE = "الفواتير";
const INVOICE_LIST_TITLE = "السجل";
const INVOICE_DETAIL_TITLE = "تفاصيل الفاتورة";
const INVOICE_SUMMARY_TAB = "الملخص والإيصال";
const INVOICE_RETURN_TAB = "المرتجع";
const INVOICE_ADMIN_TAB = "الإجراء الإداري";
const DEBTS_TITLE = "الديون";

let seed: Px22Seed;

test.describe.serial("PX-22 transactional UX", () => {
  test.beforeAll(async () => {
    const supabase = createServiceRoleClient();
    seed = {
      admin: await createFixtureUser(supabase, "admin", "px22-admin"),
      pos: await createFixtureUser(supabase, "pos_staff", "px22-pos")
    };
  });

  test("phone POS gets product-first browsing with a collapsible cart sheet", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await login(page, seed.pos.email, seed.pos.password, "/pos");

    await expect(page.locator(".dashboard-topbar .dashboard-header-title")).toContainText(POS_TITLE);
    await expect(page.getByPlaceholder(PRODUCT_PLACEHOLDER)).toBeVisible();
    await expect(page.getByRole("button", { name: "الكل" }).first()).toBeVisible();
    await expect(page.locator(".pos-cart-sheet__summary")).toBeVisible();

    await page.locator(".pos-cart-sheet__summary").click();
    await expect(page.locator(".pos-cart-card__title").filter({ hasText: CURRENT_CART_TITLE }).first()).toBeVisible();
    await expect(page.getByText(EMPTY_CART_MESSAGE, { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("desktop admin gets invoice actions grouped by section without clutter", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await login(page, seed.admin.email, seed.admin.password, "/invoices");

    await expect(
      page.getByRole("main").getByRole("heading", { name: INVOICES_TITLE, exact: true })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: INVOICE_LIST_TITLE, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /فتح الفاتورة/i }).first()).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/invoices\/.+/),
      page.getByRole("link", { name: /فتح الفاتورة/i }).first().click()
    ]);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(INVOICE_DETAIL_TITLE, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: INVOICE_SUMMARY_TAB })).toBeVisible();
    await expect(page.getByRole("button", { name: INVOICE_RETURN_TAB })).toBeVisible();
    await expect(page.getByRole("button", { name: INVOICE_ADMIN_TAB })).toBeVisible();
    await expect(page.getByRole("button", { name: "طباعة الإيصال" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("tablet admin keeps debt workspaces readable without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page, seed.admin.email, seed.admin.password, "/debts");

    await expect(
      page.getByRole("main").getByRole("heading", { name: DEBTS_TITLE, exact: true })
    ).toBeVisible();
    const debtSections = page.getByLabel("أقسام شاشة الديون");
    await expect(debtSections.getByRole("button", { name: "العملاء والقيود" })).toBeVisible();
    await expect(debtSections.getByRole("button", { name: "دين يدوي" })).toBeVisible();
    await expect(debtSections.getByRole("button", { name: "التسديد" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
