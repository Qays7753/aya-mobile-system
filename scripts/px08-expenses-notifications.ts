import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getNotificationsPageBaseline } from "@/lib/api/notifications";
import { getReportBaseline } from "@/lib/api/reports";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function extractStatusJson(rawOutput: string) {
  const start = rawOutput.indexOf("{");
  const end = rawOutput.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Failed to parse `supabase status -o json` output.");
  }

  return rawOutput.slice(start, end + 1);
}

function getLocalSupabaseEnv() {
  const raw = execSync("npx supabase status -o json", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  return JSON.parse(extractStatusJson(raw)) as {
    API_URL: string;
    SERVICE_ROLE_KEY: string;
  };
}

function nowEmail(prefix: string) {
  return `${prefix}-${Date.now()}@local.test`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return Number(value ?? 0);
}

async function createUser(
  supabase: any,
  options: {
    email: string;
    password: string;
    fullName: string;
    role: "admin" | "pos_staff";
  }
) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: options.email,
    password: options.password,
    email_confirm: true,
    user_metadata: {
      full_name: options.fullName,
      role: options.role
    }
  });

  if (error || !data.user) {
    throw new Error(`Failed to create auth user ${options.email}: ${error?.message ?? "unknown error"}`);
  }

  return data.user.id;
}

async function maybeSingleOrThrow<T>(
  query: PromiseLike<{ data: T | null; error: { message: string } | null }>,
  label: string
) {
  const { data, error } = await query;

  if (error || !data) {
    throw new Error(`${label}: ${error?.message ?? "record not found"}`);
  }

  return data;
}

async function runRpc<T>(
  supabase: any,
  fnName: string,
  params: Record<string, unknown>
) {
  const { data, error } = await (supabase as any).rpc(fnName, params as any);

  if (error) {
    throw new Error(`${fnName}: ${error.message}`);
  }

  return data as T;
}

async function main() {
  const env = getLocalSupabaseEnv();
  const supabase = createClient(env.API_URL, env.SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const adminId = await createUser(supabase, {
    email: nowEmail("px08-admin"),
    password: "LocalPass123!",
    fullName: "PX08 Admin",
    role: "admin"
  });

  const posId = await createUser(supabase, {
    email: nowEmail("px08-pos"),
    password: "LocalPass123!",
    fullName: "PX08 POS",
    role: "pos_staff"
  });

  const category = await maybeSingleOrThrow(
    supabase
      .from("expense_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle<{ id: string; name: string }>(),
    "Active expense category fixture is missing"
  );

  const cashAccount = await maybeSingleOrThrow(
    supabase
      .from("accounts")
      .select("id, name, current_balance")
      .eq("type", "cash")
      .eq("module_scope", "core")
      .maybeSingle<{ id: string; name: string; current_balance: number }>(),
    "Core cash account not found"
  );

  const expenseAmount = 12;
  const expenseBeforeBalance = toNumber(cashAccount.current_balance);
  const expense = await runRpc<{
    expense_id: string;
    expense_number: string;
    ledger_entry_id: string;
  }>(supabase, "create_expense", {
    p_amount: expenseAmount,
    p_account_id: cashAccount.id,
    p_category_id: category.id,
    p_description: "PX08 expense proof",
    p_notes: "PX08 notification + snapshot proof",
    p_idempotency_key: randomUUID(),
    p_created_by: posId
  });

  const expenseRow = await maybeSingleOrThrow(
    supabase
      .from("expenses")
      .select("expense_number, amount, description, created_by")
      .eq("id", expense.expense_id)
      .maybeSingle<{
        expense_number: string;
        amount: number;
        description: string;
        created_by: string;
      }>(),
    "Created expense row not found"
  );

  const ledgerRow = await maybeSingleOrThrow(
    supabase
      .from("ledger_entries")
      .select("entry_type, amount, reference_type, reference_id")
      .eq("id", expense.ledger_entry_id)
      .maybeSingle<{
        entry_type: string;
        amount: number;
        reference_type: string;
        reference_id: string;
      }>(),
    "Expense ledger entry not found"
  );

  const accountAfterExpense = await maybeSingleOrThrow(
    supabase
      .from("accounts")
      .select("current_balance")
      .eq("id", cashAccount.id)
      .maybeSingle<{ current_balance: number }>(),
    "Cash account not found after expense"
  );

  assert(expenseRow.expense_number === expense.expense_number, "Expense number mismatch after create_expense.");
  assert(toNumber(expenseRow.amount) === expenseAmount, "Expense amount mismatch after create_expense.");
  assert(expenseRow.created_by === posId, "Expense created_by mismatch.");
  assert(ledgerRow.entry_type === "expense", "Expense ledger entry type mismatch.");
  assert(ledgerRow.reference_type === "expense", "Expense ledger reference type mismatch.");
  assert(ledgerRow.reference_id === expense.expense_id, "Expense ledger reference id mismatch.");
  assert(toNumber(ledgerRow.amount) === expenseAmount, "Expense ledger amount mismatch.");
  assert(
    toNumber(accountAfterExpense.current_balance) === expenseBeforeBalance - expenseAmount,
    "Expense should decrease the selected account balance."
  );

  const snapshot = await runRpc<{
    snapshot_id: string;
    snapshot_date: string;
    total_expenses: number;
    net_profit: number;
    is_replay?: boolean;
  }>(supabase, "create_daily_snapshot", {
    p_snapshot_date: todayIsoDate(),
    p_notes: "PX08 snapshot proof",
    p_created_by: adminId
  });

  const snapshotRow = await maybeSingleOrThrow(
    supabase
      .from("daily_snapshots")
      .select("snapshot_date, total_expenses, net_profit")
      .eq("id", snapshot.snapshot_id)
      .maybeSingle<{
        snapshot_date: string;
        total_expenses: number;
        net_profit: number;
      }>(),
    "Daily snapshot row not found"
  );

  assert(toNumber(snapshotRow.total_expenses) === expenseAmount, "Snapshot total_expenses should include the expense.");
  assert(toNumber(snapshotRow.net_profit) === -expenseAmount, "Snapshot net_profit should reflect the expense.");

  const reportBaseline = await getReportBaseline(
    supabase as never,
    {
      fromDate: todayIsoDate(),
      toDate: todayIsoDate(),
      page: 1,
      pageSize: 20
    },
    {
      role: "admin",
      userId: adminId
    }
  );

  assert(
    toNumber(reportBaseline.profitReport.expense_total) === expenseAmount,
    "Report baseline expense_total mismatch."
  );
  assert(
    toNumber(reportBaseline.profitReport.snapshot_net_profit) === -expenseAmount,
    "Report baseline snapshot net profit mismatch."
  );

  const adminNotificationTitle = `PX08 admin ${Date.now()}`;
  const posNotificationTitle = `PX08 pos ${Date.now()}`;

  const { error: notificationInsertError } = await supabase.from("notifications").insert([
    {
      user_id: adminId,
      type: "large_discount",
      title: adminNotificationTitle,
      body: "PX08 admin notification"
    },
    {
      user_id: posId,
      type: "retroactive_edit",
      title: posNotificationTitle,
      body: "PX08 pos notification"
    }
  ]);

  if (notificationInsertError) {
    throw new Error(`Failed to insert notification fixtures: ${notificationInsertError.message}`);
  }

  const adminNotifications = await getNotificationsPageBaseline(
    supabase as never,
    {
      role: "admin",
      userId: adminId
    },
    {}
  );

  const posNotifications = await getNotificationsPageBaseline(
    supabase as never,
    {
      role: "pos_staff",
      userId: posId
    },
    {}
  );

  assert(
    adminNotifications.notifications.some((notification) => notification.title === adminNotificationTitle),
    "Admin notification should be visible in the admin inbox."
  );
  assert(
    adminNotifications.notifications.some((notification) => notification.title === posNotificationTitle),
    "Admin inbox should include notifications from other operators."
  );
  assert(
    posNotifications.notifications.some((notification) => notification.title === posNotificationTitle),
    "POS inbox should include its own notification."
  );
  assert(
    !posNotifications.notifications.some((notification) => notification.title === adminNotificationTitle),
    "POS inbox must not include admin notifications."
  );

  const result = {
    fixtures: {
      admin_id: adminId,
      pos_id: posId,
      category_id: category.id,
      account_id: cashAccount.id
    },
    probes: {
      expense: {
        expense_number: expense.expense_number,
        amount: expenseAmount,
        balance_before: expenseBeforeBalance,
        balance_after: toNumber(accountAfterExpense.current_balance),
        ledger_entry_id: expense.ledger_entry_id
      },
      snapshot: {
        snapshot_id: snapshot.snapshot_id,
        snapshot_date: snapshotRow.snapshot_date,
        total_expenses: toNumber(snapshotRow.total_expenses),
        net_profit: toNumber(snapshotRow.net_profit)
      },
      report: {
        expense_total: toNumber(reportBaseline.profitReport.expense_total),
        snapshot_net_profit: toNumber(reportBaseline.profitReport.snapshot_net_profit)
      },
      notifications: {
        admin_total_count: adminNotifications.totalCount,
        admin_unread_count: adminNotifications.unreadCount,
        pos_total_count: posNotifications.totalCount,
        pos_unread_count: posNotifications.unreadCount
      }
    }
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
