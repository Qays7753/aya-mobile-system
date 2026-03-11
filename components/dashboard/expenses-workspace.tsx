"use client";

import { useState, useTransition } from "react";
import { BellRing, Loader2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  ExpenseAccountOption,
  ExpenseCategoryOption,
  ExpenseEntryOption,
  ExpenseSummary
} from "@/lib/api/expenses";
import type { StandardEnvelope } from "@/lib/pos/types";
import { formatCompactNumber, formatCurrency, formatDateTime } from "@/lib/utils/formatters";

type ExpensesWorkspaceProps = {
  role: "admin" | "pos_staff";
  categories: ExpenseCategoryOption[];
  accounts: ExpenseAccountOption[];
  recentExpenses: ExpenseEntryOption[];
  summary: ExpenseSummary;
};

type CreateExpenseResponse = {
  expense_id: string;
  expense_number: string;
  ledger_entry_id: string;
};

type ExpenseCategoryResponse = ExpenseCategoryOption;

type CategoryDraftState = Record<
  string,
  {
    name: string;
    type: "fixed" | "variable";
    description: string;
    is_active: boolean;
    sort_order: string;
  }
>;

function getApiErrorMessage<T>(envelope: StandardEnvelope<T>) {
  return envelope.error?.message ?? "تعذر إتمام العملية.";
}

function formatBalanceLabel(account: ExpenseAccountOption) {
  if (account.current_balance == null) {
    return "الرصيد مخفي لهذا الدور";
  }

  return `الرصيد الحالي: ${formatCurrency(account.current_balance)}`;
}

export function ExpensesWorkspace({
  role,
  categories,
  accounts,
  recentExpenses,
  summary
}: ExpensesWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [createResult, setCreateResult] = useState<CreateExpenseResponse | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"fixed" | "variable">("variable");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryIsActive, setNewCategoryIsActive] = useState(true);
  const [newCategorySortOrder, setNewCategorySortOrder] = useState("0");
  const [categoryResult, setCategoryResult] = useState<ExpenseCategoryResponse | null>(null);
  const [categoryDrafts, setCategoryDrafts] = useState<CategoryDraftState>(() =>
    Object.fromEntries(
      categories.map((category) => [
        category.id,
        {
          name: category.name,
          type: category.type,
          description: category.description ?? "",
          is_active: category.is_active,
          sort_order: String(category.sort_order)
        }
      ])
    )
  );

  async function handleCreateExpense() {
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(amount),
            account_id: accountId,
            expense_category_id: categoryId,
            description,
            notes: notes || undefined,
            idempotency_key: crypto.randomUUID()
          })
        });

        const envelope = (await response.json()) as StandardEnvelope<CreateExpenseResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          toast.error(getApiErrorMessage(envelope));
          return;
        }

        setCreateResult(envelope.data);
        setAmount("");
        setDescription("");
        setNotes("");
        toast.success("تم تسجيل المصروف بنجاح.");
        router.refresh();
      })();
    });
  }

  async function handleCreateCategory() {
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/expense-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newCategoryName,
            type: newCategoryType,
            description: newCategoryDescription || undefined,
            is_active: newCategoryIsActive,
            sort_order: Number(newCategorySortOrder || "0")
          })
        });

        const envelope = (await response.json()) as StandardEnvelope<ExpenseCategoryResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          toast.error(getApiErrorMessage(envelope));
          return;
        }

        setCategoryResult(envelope.data);
        setNewCategoryName("");
        setNewCategoryDescription("");
        setNewCategoryType("variable");
        setNewCategoryIsActive(true);
        setNewCategorySortOrder("0");
        toast.success("تم إنشاء فئة المصروف بنجاح.");
        router.refresh();
      })();
    });
  }

  async function handleUpdateCategory(categoryIdToUpdate: string) {
    const draft = categoryDrafts[categoryIdToUpdate];
    if (!draft) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/expense-categories/${categoryIdToUpdate}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.name,
            type: draft.type,
            description: draft.description || null,
            is_active: draft.is_active,
            sort_order: Number(draft.sort_order || "0")
          })
        });

        const envelope = (await response.json()) as StandardEnvelope<ExpenseCategoryResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          toast.error(getApiErrorMessage(envelope));
          return;
        }

        setCategoryResult(envelope.data);
        toast.success(`تم تحديث فئة المصروف "${envelope.data.name}".`);
        router.refresh();
      })();
    });
  }

  return (
    <section className="workspace-stack">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">PX-08 / Expense Core</p>
          <h1>المصروفات ومركز الإشعارات</h1>
          <p className="workspace-lead">
            تسجيل مصروفات التشغيل عبر API-first مع ledger/audit صحيحين، وإدارة فئات المصروفات
            من نفس السطح قبل الانتقال إلى التقارير المتقدمة.
          </p>
        </div>
      </div>

      <section className="summary-grid">
        <article className="workspace-panel">
          <p className="eyebrow">Expense Summary</p>
          <h2>{formatCurrency(summary.total_expenses)}</h2>
          <p className="workspace-footnote">إجمالي المصروفات في الشهر الحالي.</p>
        </article>

        <article className="workspace-panel">
          <p className="eyebrow">Entries</p>
          <h2>{formatCompactNumber(summary.expense_count)}</h2>
          <p className="workspace-footnote">عدد المصروفات المسجلة خلال الشهر الحالي.</p>
        </article>

        <article className="workspace-panel">
          <p className="eyebrow">Active Categories</p>
          <h2>{formatCompactNumber(summary.active_category_count)}</h2>
          <p className="workspace-footnote">فئات المصروف النشطة المتاحة الآن للتشغيل.</p>
        </article>
      </section>

      <div className="detail-grid">
        <section className="workspace-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">New Expense</p>
              <h2>تسجيل مصروف جديد</h2>
            </div>
            <Wallet size={18} />
          </div>

          <div className="stack-form">
            <label className="stack-field">
              <span>الحساب</span>
              <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} — {formatBalanceLabel(account)}
                  </option>
                ))}
              </select>
            </label>

            <label className="stack-field">
              <span>فئة المصروف</span>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.type})
                  </option>
                ))}
              </select>
            </label>

            <label className="stack-field">
              <span>المبلغ</span>
              <input
                type="number"
                min={0.001}
                step="0.001"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>

            <label className="stack-field">
              <span>الوصف</span>
              <input value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>

            <label className="stack-field">
              <span>ملاحظات</span>
              <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>

            <button
              type="button"
              className="primary-button"
              disabled={isPending || !amount || !accountId || !categoryId || !description.trim()}
              onClick={() => void handleCreateExpense()}
            >
              {isPending ? <Loader2 className="spin" size={16} /> : "تسجيل المصروف"}
            </button>
          </div>

          {createResult ? (
            <div className="result-card">
              <h3>تم حفظ آخر مصروف</h3>
              <p>رقم المصروف: {createResult.expense_number}</p>
              <p>Ledger Entry: {createResult.ledger_entry_id}</p>
            </div>
          ) : null}
        </section>

        <section className="workspace-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recent Expenses</p>
              <h2>آخر المصروفات المسجلة</h2>
            </div>
            <BellRing size={18} />
          </div>

          <div className="stack-list">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => (
                <article key={expense.id} className="list-card">
                  <div className="list-card__header">
                    <strong>{expense.expense_number}</strong>
                    <span>{formatCurrency(expense.amount)}</span>
                  </div>
                  <p>{expense.description}</p>
                  <p className="workspace-footnote">
                    {expense.category_name} — {expense.account_name}
                  </p>
                  <p className="workspace-footnote">
                    {expense.created_by_name ?? "غير معروف"} — {formatDateTime(expense.created_at)}
                  </p>
                </article>
              ))
            ) : (
              <div className="empty-panel">
                <p>لا توجد مصروفات مسجلة حتى الآن.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {role === "admin" ? (
        <section className="workspace-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Expense Categories</p>
              <h2>إدارة فئات المصروفات</h2>
            </div>
            <Wallet size={18} />
          </div>

          <div className="detail-grid">
            <section className="workspace-panel">
              <div className="stack-form">
                <label className="stack-field">
                  <span>اسم الفئة</span>
                  <input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} />
                </label>

                <label className="stack-field">
                  <span>النوع</span>
                  <select
                    value={newCategoryType}
                    onChange={(event) => setNewCategoryType(event.target.value as "fixed" | "variable")}
                  >
                    <option value="fixed">fixed</option>
                    <option value="variable">variable</option>
                  </select>
                </label>

                <label className="stack-field">
                  <span>الترتيب</span>
                  <input
                    type="number"
                    step="1"
                    value={newCategorySortOrder}
                    onChange={(event) => setNewCategorySortOrder(event.target.value)}
                  />
                </label>

                <label className="stack-field">
                  <span>الوصف</span>
                  <textarea
                    rows={3}
                    value={newCategoryDescription}
                    onChange={(event) => setNewCategoryDescription(event.target.value)}
                  />
                </label>

                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={newCategoryIsActive}
                    onChange={(event) => setNewCategoryIsActive(event.target.checked)}
                  />
                  <span>الفئة مفعّلة</span>
                </label>

                <button
                  type="button"
                  className="primary-button"
                  disabled={isPending || !newCategoryName.trim()}
                  onClick={() => void handleCreateCategory()}
                >
                  {isPending ? <Loader2 className="spin" size={16} /> : "إنشاء فئة جديدة"}
                </button>
              </div>

              {categoryResult ? (
                <div className="result-card">
                  <h3>آخر تحديث على الفئات</h3>
                  <p>{categoryResult.name}</p>
                  <p>النوع: {categoryResult.type}</p>
                </div>
              ) : null}
            </section>

            <section className="workspace-panel">
              <div className="stack-list">
                {categories.map((category) => {
                  const draft = categoryDrafts[category.id];
                  const baseDraft = draft ?? {
                    name: category.name,
                    type: category.type,
                    description: category.description ?? "",
                    is_active: category.is_active,
                    sort_order: String(category.sort_order)
                  };

                  return (
                    <article key={category.id} className="list-card">
                      <div className="stack-form">
                        <label className="stack-field">
                          <span>الاسم</span>
                          <input
                            value={baseDraft.name}
                            onChange={(event) =>
                              setCategoryDrafts((current) => ({
                                ...current,
                                [category.id]: {
                                  ...baseDraft,
                                  name: event.target.value
                                }
                              }))
                            }
                          />
                        </label>

                        <label className="stack-field">
                          <span>النوع</span>
                          <select
                            value={baseDraft.type}
                            onChange={(event) =>
                              setCategoryDrafts((current) => ({
                                ...current,
                                [category.id]: {
                                  ...baseDraft,
                                  type: event.target.value as "fixed" | "variable"
                                }
                              }))
                            }
                          >
                            <option value="fixed">fixed</option>
                            <option value="variable">variable</option>
                          </select>
                        </label>

                        <label className="stack-field">
                          <span>الوصف</span>
                          <textarea
                            rows={2}
                            value={baseDraft.description}
                            onChange={(event) =>
                              setCategoryDrafts((current) => ({
                                ...current,
                                [category.id]: {
                                  ...baseDraft,
                                  description: event.target.value
                                }
                              }))
                            }
                          />
                        </label>

                        <label className="stack-field">
                          <span>الترتيب</span>
                          <input
                            type="number"
                            value={baseDraft.sort_order}
                            onChange={(event) =>
                              setCategoryDrafts((current) => ({
                                ...current,
                                [category.id]: {
                                  ...baseDraft,
                                  sort_order: event.target.value
                                }
                              }))
                            }
                          />
                        </label>

                        <label className="checkbox-field">
                          <input
                            type="checkbox"
                            checked={baseDraft.is_active}
                            onChange={(event) =>
                              setCategoryDrafts((current) => ({
                                ...current,
                                [category.id]: {
                                  ...baseDraft,
                                  is_active: event.target.checked
                                }
                              }))
                            }
                          />
                          <span>مفعّلة</span>
                        </label>

                        <button
                          type="button"
                          className="secondary-button"
                          disabled={isPending}
                          onClick={() => void handleUpdateCategory(category.id)}
                        >
                          حفظ التعديلات
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </section>
      ) : null}
    </section>
  );
}
