import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getReportBaseline, parseSalesHistoryFilters } from "@/lib/api/reports";

type WorkspaceRole = "admin" | "pos_staff";
type SearchParamsInput = Record<string, string | string[] | undefined>;

export type WorkspaceUserOption = {
  id: string;
  full_name: string | null;
  role: WorkspaceRole;
};

export type SettingsAccount = {
  id: string;
  name: string;
  type: string;
  current_balance: number;
  module_scope: string;
};

export type SettingsSnapshot = {
  id: string;
  snapshot_date: string;
  net_sales: number;
  net_profit: number;
  invoice_count: number;
  created_at: string;
};

export type InventoryCountItemOption = {
  id: string;
  inventory_count_id: string;
  product_id: string;
  product_name: string;
  system_quantity: number;
  actual_quantity: number;
  difference: number;
  reason: string | null;
};

export type InventoryCountOption = {
  id: string;
  count_date: string;
  count_type: string;
  status: string;
  notes: string | null;
  items: InventoryCountItemOption[];
};

export type DebtCustomerOption = {
  id: string;
  name: string;
  phone: string | null;
  current_balance: number;
  due_date_days?: number | null;
  credit_limit?: number | null;
};

export type DebtEntryOption = {
  id: string;
  debt_customer_id: string;
  entry_type: string;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date: string;
  description: string | null;
};

export type AccountOption = {
  id: string;
  name: string;
  type: string;
  module_scope: string;
  fee_percentage: number;
};

export type InvoiceItemOption = {
  id: string;
  invoice_id: string;
  product_name_at_time: string;
  quantity: number;
  returned_quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
};

export type InvoiceOption = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number;
  status: string;
  pos_terminal_code: string | null;
  debt_amount: number;
  items: InvoiceItemOption[];
};

type InventoryCountRow = {
  id: string;
  count_date: string;
  count_type: string;
  status: string;
  notes: string | null;
};

type InventoryCountItemRow = {
  id: string;
  inventory_count_id: string;
  product_id: string;
  system_quantity: number;
  actual_quantity: number;
  difference: number;
  reason: string | null;
};

type ProductNameRow = {
  id: string;
  name: string;
};

type InvoiceRow = Omit<InvoiceOption, "items">;

function appendSearchParam(target: URLSearchParams, key: string, value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    for (const item of value) {
      target.append(key, item);
    }
    return;
  }

  if (value) {
    target.set(key, value);
  }
}

export function toUrlSearchParams(searchParams: SearchParamsInput) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    appendSearchParam(params, key, value);
  }

  return params;
}

export async function listActiveWorkspaceUsers(
  supabase: ReturnType<typeof getSupabaseAdminClient>
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "pos_staff"])
    .eq("is_active", true)
    .order("full_name", { ascending: true })
    .returns<WorkspaceUserOption[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listPosTerminalCodes(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  fromDate: string,
  toDate: string
) {
  const { data, error } = await supabase
    .from("invoices")
    .select("pos_terminal_code")
    .gte("invoice_date", fromDate)
    .lte("invoice_date", toDate)
    .not("pos_terminal_code", "is", null);

  if (error) {
    throw error;
  }

  return [...new Set((data ?? []).map((row) => row.pos_terminal_code).filter(Boolean))] as string[];
}

export async function getReportsPageBaseline(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  searchParams: SearchParamsInput
) {
  const filters = parseSalesHistoryFilters(toUrlSearchParams(searchParams));
  const [reportBaseline, users, terminals] = await Promise.all([
    getReportBaseline(supabase, filters, { role: "admin", userId: "" }),
    listActiveWorkspaceUsers(supabase),
    listPosTerminalCodes(supabase, filters.fromDate, filters.toDate)
  ]);

  return {
    filters,
    users,
    terminals,
    reportBaseline
  };
}

export async function getSettingsPageBaseline(
  supabase: ReturnType<typeof getSupabaseAdminClient>
) {
  const [accountsResult, snapshotsResult, countsResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, current_balance, module_scope")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .returns<SettingsAccount[]>(),
    supabase
      .from("daily_snapshots")
      .select("id, snapshot_date, net_sales, net_profit, invoice_count, created_at")
      .order("snapshot_date", { ascending: false })
      .limit(5)
      .returns<SettingsSnapshot[]>(),
    supabase
      .from("inventory_counts")
      .select("id, count_date, count_type, status, notes")
      .eq("status", "in_progress")
      .order("count_date", { ascending: false })
      .limit(5)
      .returns<InventoryCountRow[]>()
  ]);

  if (accountsResult.error) {
    throw accountsResult.error;
  }

  if (snapshotsResult.error) {
    throw snapshotsResult.error;
  }

  if (countsResult.error) {
    throw countsResult.error;
  }

  const countIds = (countsResult.data ?? []).map((count) => count.id);
  if (countIds.length === 0) {
    return {
      accounts: accountsResult.data ?? [],
      snapshots: snapshotsResult.data ?? [],
      inventoryCounts: [] as InventoryCountOption[]
    };
  }

  const itemsResult = await supabase
    .from("inventory_count_items")
    .select("id, inventory_count_id, product_id, system_quantity, actual_quantity, difference, reason")
    .in("inventory_count_id", countIds)
    .order("product_id", { ascending: true })
    .returns<InventoryCountItemRow[]>();

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  const productIds = [...new Set((itemsResult.data ?? []).map((item) => item.product_id))];
  const productsResult =
    productIds.length === 0
      ? { data: [] as ProductNameRow[], error: null }
      : await supabase
          .from("products")
          .select("id, name")
          .in("id", productIds)
          .returns<ProductNameRow[]>();

  if (productsResult.error) {
    throw productsResult.error;
  }

  const productNames = new Map((productsResult.data ?? []).map((product) => [product.id, product.name]));
  const itemsByCount = new Map<string, InventoryCountItemOption[]>();

  for (const item of itemsResult.data ?? []) {
    const list = itemsByCount.get(item.inventory_count_id) ?? [];
    list.push({
      ...item,
      product_name: productNames.get(item.product_id) ?? "منتج غير معروف"
    });
    itemsByCount.set(item.inventory_count_id, list);
  }

  return {
    accounts: accountsResult.data ?? [],
    snapshots: snapshotsResult.data ?? [],
    inventoryCounts: (countsResult.data ?? []).map((count) => ({
      ...count,
      items: itemsByCount.get(count.id) ?? []
    }))
  };
}

export async function getDebtsPageBaseline(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  viewer: { role: WorkspaceRole; userId: string }
) {
  const debtCustomersQuery =
    viewer.role === "admin"
      ? supabase
          .from("debt_customers")
          .select("id, name, phone, current_balance, due_date_days, credit_limit")
          .eq("is_active", true)
          .order("current_balance", { ascending: false })
      : supabase
          .from("v_pos_debt_customers")
          .select("id, name, phone, current_balance, due_date_days")
          .eq("is_active", true)
          .order("current_balance", { ascending: false });

  const accountsQuery =
    viewer.role === "admin"
      ? supabase
          .from("accounts")
          .select("id, name, type, module_scope, fee_percentage")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
      : supabase
          .from("v_pos_accounts")
          .select("id, name, type, module_scope, fee_percentage")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

  const [customersResult, entriesResult, accountsResult] = await Promise.all([
    debtCustomersQuery.returns<DebtCustomerOption[]>(),
    supabase
      .from("debt_entries")
      .select("id, debt_customer_id, entry_type, amount, paid_amount, remaining_amount, due_date, description")
      .eq("is_paid", false)
      .order("due_date", { ascending: true })
      .returns<DebtEntryOption[]>(),
    accountsQuery.returns<AccountOption[]>()
  ]);

  if (customersResult.error) {
    throw customersResult.error;
  }

  if (entriesResult.error) {
    throw entriesResult.error;
  }

  if (accountsResult.error) {
    throw accountsResult.error;
  }

  return {
    customers: customersResult.data ?? [],
    entries: entriesResult.data ?? [],
    accounts: accountsResult.data ?? []
  };
}

export async function getInvoicesPageBaseline(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  viewer: { role: WorkspaceRole; userId: string }
) {
  let invoicesQuery = supabase
    .from("invoices")
    .select(
      "id, invoice_number, invoice_date, created_at, customer_name, customer_phone, total_amount, status, pos_terminal_code, debt_amount, created_by"
    )
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);

  if (viewer.role === "pos_staff") {
    invoicesQuery = invoicesQuery.eq("created_by", viewer.userId);
  }

  const [invoicesResult, accountsResult] = await Promise.all([
    invoicesQuery.returns<(InvoiceRow & { created_by: string })[]>(),
    supabase
      .from("accounts")
      .select("id, name, type, module_scope, fee_percentage")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .returns<AccountOption[]>()
  ]);

  if (invoicesResult.error) {
    throw invoicesResult.error;
  }

  if (accountsResult.error) {
    throw accountsResult.error;
  }

  const invoices = invoicesResult.data ?? [];
  const invoiceIds = invoices.map((invoice) => invoice.id);

  const itemsResult =
    invoiceIds.length === 0
      ? { data: [] as InvoiceItemOption[], error: null }
      : await supabase
          .from("invoice_items")
          .select("id, invoice_id, product_name_at_time, quantity, returned_quantity, unit_price, discount_percentage, total_price")
          .in("invoice_id", invoiceIds)
          .order("invoice_id", { ascending: false })
          .returns<InvoiceItemOption[]>();

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  const itemsByInvoice = new Map<string, InvoiceItemOption[]>();
  for (const item of itemsResult.data ?? []) {
    const list = itemsByInvoice.get(item.invoice_id) ?? [];
    list.push(item);
    itemsByInvoice.set(item.invoice_id, list);
  }

  return {
    invoices: invoices.map(({ created_by: _createdBy, ...invoice }) => ({
      ...invoice,
      items: itemsByInvoice.get(invoice.id) ?? []
    })),
    accounts: accountsResult.data ?? []
  };
}
