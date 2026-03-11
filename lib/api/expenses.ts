import { getApiErrorMeta } from "@/lib/api/common";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const CREATE_EXPENSE_ERROR_MAP = {
  ERR_EXPENSE_CATEGORY_NOT_FOUND: {
    status: 404,
    message: "فئة المصروف غير موجودة."
  },
  ERR_EXPENSE_CATEGORY_INACTIVE: {
    status: 400,
    message: "فئة المصروف غير مفعلة حاليًا."
  },
  ERR_ACCOUNT_NOT_FOUND: {
    status: 404,
    message: "الحساب المحدد غير موجود أو غير نشط."
  },
  ERR_IDEMPOTENCY: {
    status: 409,
    message: "تم تسجيل هذا المصروف مسبقًا."
  },
  ERR_VALIDATION_NEGATIVE_AMOUNT: {
    status: 400,
    message: "مبلغ المصروف يجب أن يكون أكبر من صفر."
  },
  ERR_API_VALIDATION_FAILED: {
    status: 400,
    message: "بيانات المصروف غير صالحة."
  },
  ERR_UNAUTHORIZED: {
    status: 403,
    message: "ليس لديك صلاحية لتسجيل هذا المصروف."
  }
} as const;

const EXPENSE_CATEGORY_ERROR_MAP = {
  ERR_EXPENSE_CATEGORY_NOT_FOUND: {
    status: 404,
    message: "فئة المصروف غير موجودة."
  },
  ERR_EXPENSE_CATEGORY_HAS_REFERENCES: {
    status: 409,
    message: "لا يمكن تغيير نوع الفئة لأنها مستخدمة في مصروفات مسجلة."
  },
  ERR_API_VALIDATION_FAILED: {
    status: 400,
    message: "بيانات فئة المصروف غير صالحة."
  },
  ERR_UNAUTHORIZED: {
    status: 403,
    message: "ليس لديك صلاحية لإدارة فئات المصروفات."
  }
} as const;

type CreateExpenseErrorCode = keyof typeof CREATE_EXPENSE_ERROR_MAP;
type ExpenseCategoryErrorCode = keyof typeof EXPENSE_CATEGORY_ERROR_MAP;

export function getCreateExpenseErrorMeta(code: string) {
  if (code in CREATE_EXPENSE_ERROR_MAP) {
    return CREATE_EXPENSE_ERROR_MAP[code as CreateExpenseErrorCode];
  }

  return getApiErrorMeta(code);
}

export function getExpenseCategoryErrorMeta(code: string) {
  if (code in EXPENSE_CATEGORY_ERROR_MAP) {
    return EXPENSE_CATEGORY_ERROR_MAP[code as ExpenseCategoryErrorCode];
  }

  return getApiErrorMeta(code);
}

type WorkspaceRole = "admin" | "pos_staff";

export type ExpenseCategoryOption = {
  id: string;
  name: string;
  type: "fixed" | "variable";
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

export type ExpenseAccountOption = {
  id: string;
  name: string;
  type: string;
  module_scope: string;
  current_balance: number | null;
};

export type ExpenseEntryOption = {
  id: string;
  expense_number: string;
  expense_date: string;
  amount: number;
  description: string;
  notes: string | null;
  category_name: string;
  account_name: string;
  created_by_name: string | null;
  created_at: string;
};

export type ExpenseSummary = {
  total_expenses: number;
  expense_count: number;
  active_category_count: number;
};

type ExpenseRow = {
  id: string;
  expense_number: string;
  expense_date: string;
  amount: number;
  description: string;
  notes: string | null;
  category_id: string;
  account_id: string;
  created_by: string;
  created_at: string;
};

type ExpenseCategoryRow = ExpenseCategoryOption;

type AccountRow = {
  id: string;
  name: string;
  type: string;
  module_scope: string;
  current_balance: number;
};

type PosAccountRow = {
  id: string;
  name: string;
  type: string;
  module_scope: string;
};

type ProfileNameRow = {
  id: string;
  full_name: string | null;
};

async function loadProfileNameMap(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  ids: string[]
) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const profileMap = new Map<string, string | null>();

  if (uniqueIds.length === 0) {
    return profileMap;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", uniqueIds)
    .returns<ProfileNameRow[]>();

  if (error) {
    throw error;
  }

  for (const profile of data ?? []) {
    profileMap.set(profile.id, profile.full_name);
  }

  return profileMap;
}

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function getExpensesPageBaseline(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  viewer: { role: WorkspaceRole; userId: string }
) {
  const categoryQuery =
    viewer.role === "admin"
      ? supabase
          .from("expense_categories")
          .select("id, name, type, description, is_active, sort_order")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true })
      : supabase
          .from("expense_categories")
          .select("id, name, type, description, is_active, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });

  const accountsQuery =
    viewer.role === "admin"
      ? supabase
          .from("accounts")
          .select("id, name, type, module_scope, current_balance")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
      : supabase
          .from("v_pos_accounts")
          .select("id, name, type, module_scope")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

  let expensesQuery = supabase
    .from("expenses")
    .select("id, expense_number, expense_date, amount, description, notes, category_id, account_id, created_by, created_at")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);

  let summaryQuery = supabase
    .from("expenses")
    .select("id, amount")
    .gte("expense_date", monthStartIso());

  if (viewer.role !== "admin") {
    expensesQuery = expensesQuery.eq("created_by", viewer.userId);
    summaryQuery = summaryQuery.eq("created_by", viewer.userId);
  }

  const [categoriesResult, accountsResult, expensesResult, summaryResult] = await Promise.all([
    categoryQuery.returns<ExpenseCategoryRow[]>(),
    viewer.role === "admin"
      ? accountsQuery.returns<AccountRow[]>()
      : accountsQuery.returns<PosAccountRow[]>(),
    expensesQuery.returns<ExpenseRow[]>(),
    summaryQuery.returns<Array<{ id: string; amount: number }>>()
  ]);

  if (categoriesResult.error) {
    throw categoriesResult.error;
  }

  if (accountsResult.error) {
    throw accountsResult.error;
  }

  if (expensesResult.error) {
    throw expensesResult.error;
  }

  if (summaryResult.error) {
    throw summaryResult.error;
  }

  const categories = categoriesResult.data ?? [];
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const accounts = (accountsResult.data ?? []).map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    module_scope: account.module_scope,
    current_balance: "current_balance" in account ? account.current_balance : null
  })) as ExpenseAccountOption[];
  const accountMap = new Map(accounts.map((account) => [account.id, account.name]));
  const expenses = expensesResult.data ?? [];
  const profileMap = await loadProfileNameMap(
    supabase,
    expenses.map((expense) => expense.created_by)
  );

  return {
    categories,
    accounts,
    recentExpenses: expenses.map((expense) => ({
      id: expense.id,
      expense_number: expense.expense_number,
      expense_date: expense.expense_date,
      amount: expense.amount,
      description: expense.description,
      notes: expense.notes,
      category_name: categoryMap.get(expense.category_id) ?? "فئة غير معروفة",
      account_name: accountMap.get(expense.account_id) ?? "حساب غير معروف",
      created_by_name: profileMap.get(expense.created_by) ?? null,
      created_at: expense.created_at
    })) satisfies ExpenseEntryOption[],
    summary: {
      total_expenses: (summaryResult.data ?? []).reduce((sum, row) => sum + row.amount, 0),
      expense_count: (summaryResult.data ?? []).length,
      active_category_count: categories.filter((category) => category.is_active).length
    } satisfies ExpenseSummary
  };
}
