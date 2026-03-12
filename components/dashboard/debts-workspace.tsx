"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, ReceiptText, Search, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBanner } from "@/components/ui/status-banner";
import type { AccountOption, DebtCustomerOption, DebtEntryOption } from "@/lib/api/dashboard";
import type { StandardEnvelope } from "@/lib/pos/types";
import { formatCompactNumber, formatCurrency, formatDate } from "@/lib/utils/formatters";

type ManualDebtResponse = {
  debt_entry_id: string;
};

type DebtPaymentResponse = {
  payment_id: string;
  receipt_number: string;
  remaining_balance: number;
  allocations: Array<{
    debt_entry_id: string;
    allocated_amount: number;
  }>;
};

type DebtsWorkspaceProps = {
  role: "admin" | "pos_staff";
  customers: DebtCustomerOption[];
  entries: DebtEntryOption[];
  accounts: AccountOption[];
};

type DebtSection = "ledger" | "manual" | "payment";
type DebtsRetryAction = "manual-debt" | "debt-payment";

function createUuid() {
  return crypto.randomUUID();
}

export function DebtsWorkspace({ role, customers, entries, accounts }: DebtsWorkspaceProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? "");
  const [manualAmount, setManualAmount] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id ?? "");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentEntryId, setPaymentEntryId] = useState("");
  const [paymentKey, setPaymentKey] = useState("");
  const [manualResult, setManualResult] = useState<ManualDebtResponse | null>(null);
  const [paymentResult, setPaymentResult] = useState<DebtPaymentResponse | null>(null);
  const [activeSection, setActiveSection] = useState<DebtSection>("ledger");
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<DebtsRetryAction | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredCustomers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return customers;
    }

    return customers.filter((customer) => {
      const haystack = `${customer.name} ${customer.phone ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [customers, searchTerm]);

  const selectedCustomer =
    filteredCustomers.find((customer) => customer.id === selectedCustomerId) ??
    customers.find((customer) => customer.id === selectedCustomerId) ??
    null;
  const customerEntries = entries.filter((entry) => entry.debt_customer_id === selectedCustomerId);
  const totalOutstanding = customerEntries.reduce((sum, entry) => sum + entry.remaining_amount, 0);

  useEffect(() => {
    if (!manualKey) {
      setManualKey(createUuid());
    }

    if (!paymentKey) {
      setPaymentKey(createUuid());
    }
  }, [manualKey, paymentKey]);

  useEffect(() => {
    setPaymentEntryId("");
    setManualResult(null);
    setPaymentResult(null);
  }, [selectedCustomerId]);

  function clearActionFeedback() {
    setActionErrorMessage(null);
    setRetryAction(null);
  }

  function failAction(message: string, action: DebtsRetryAction) {
    setActionErrorMessage(message);
    setRetryAction(action);
    toast.error(message);
  }

  function submitManualDebt() {
    clearActionFeedback();
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/debts/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            debt_customer_id: selectedCustomerId,
            amount: Number(manualAmount),
            description: manualDescription || undefined,
            idempotency_key: manualKey
          })
        });

        const envelope = (await response.json()) as StandardEnvelope<ManualDebtResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          failAction(envelope.error?.message ?? "ØªØ¹Ø°Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯ÙŠÙ† Ø§Ù„ÙŠØ¯ÙˆÙŠ.", "manual-debt");
          return;
        }

        setManualResult(envelope.data);
        setManualAmount("");
        setManualDescription("");
        setManualKey(createUuid());
        clearActionFeedback();
        toast.success("ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¯ÙŠÙ† Ø§Ù„ÙŠØ¯ÙˆÙŠ.");
        router.refresh();
      })();
    });
  }

  function submitDebtPayment() {
    clearActionFeedback();
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/payments/debt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            debt_customer_id: selectedCustomerId,
            amount: Number(paymentAmount),
            account_id: paymentAccountId,
            notes: paymentNotes || undefined,
            idempotency_key: paymentKey,
            debt_entry_id: paymentEntryId || undefined
          })
        });

        const envelope = (await response.json()) as StandardEnvelope<DebtPaymentResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          failAction(envelope.error?.message ?? "ØªØ¹Ø°Ø± ØªØ³Ø¬ÙŠÙ„ ØªØ³Ø¯ÙŠØ¯ Ø§Ù„Ø¯ÙŠÙ†.", "debt-payment");
          return;
        }

        setPaymentResult(envelope.data);
        setPaymentAmount("");
        setPaymentNotes("");
        setPaymentEntryId("");
        setPaymentKey(createUuid());
        clearActionFeedback();
        toast.success(`ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¥ÙŠØµØ§Ù„ ${envelope.data.receipt_number}.`);
        router.refresh();
      })();
    });
  }

  function retryLastAction() {
    switch (retryAction) {
      case "manual-debt":
        submitManualDebt();
        break;
      case "debt-payment":
        submitDebtPayment();
        break;
      default:
        break;
    }
  }

  return (
    <section className="workspace-stack">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">Ø§Ù„Ø¯ÙŠÙˆÙ†</p>
          <h1>Ø§Ù„Ø¯ÙŠÙˆÙ† ÙˆØ§Ù„ØªØ³Ø¯ÙŠØ¯</h1>
          <p className="workspace-lead">
            ØªØ§Ø¨Ø¹ Ø£Ø±ØµØ¯Ø© Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ØŒ Ø±Ø§Ø¬Ø¹ Ø§Ù„Ù‚ÙŠÙˆØ¯ Ø§Ù„Ù…ÙØªÙˆØ­Ø©ØŒ ÙˆØ³Ø¬Ù„ Ø§Ù„Ø¯ÙŠÙ† Ø§Ù„ÙŠØ¯ÙˆÙŠ Ø£Ùˆ Ø§Ù„ØªØ³Ø¯ÙŠØ¯ Ù…Ù† Ù…Ø³Ø§Ø±Ø§Øª Ø£ÙˆØ¶Ø­ ØªÙ†Ø§Ø³Ø¨ Ø§Ù„Ø¯ÙˆØ± Ø§Ù„Ø­Ø§Ù„ÙŠ.
          </p>
        </div>
      </div>

      <div className="chip-row" aria-label="Ø£Ù‚Ø³Ø§Ù… Ø´Ø§Ø´Ø© Ø§Ù„Ø¯ÙŠÙˆÙ†">
        <button
          type="button"
          className={activeSection === "ledger" ? "chip-button is-selected" : "chip-button"}
          onClick={() => setActiveSection("ledger")}
        >
          Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ ÙˆØ§Ù„Ù‚ÙŠÙˆØ¯
        </button>
        {role === "admin" ? (
          <button
            type="button"
            className={activeSection === "manual" ? "chip-button is-selected" : "chip-button"}
            onClick={() => setActiveSection("manual")}
          >
            Ø¯ÙŠÙ† ÙŠØ¯ÙˆÙŠ
          </button>
        ) : null}
        <button
          type="button"
          className={activeSection === "payment" ? "chip-button is-selected" : "chip-button"}
          onClick={() => setActiveSection("payment")}
        >
          Ø§Ù„ØªØ³Ø¯ÙŠØ¯
        </button>
      </div>

      {isPending ? (
        <StatusBanner
          variant="info"
          title="Ø¬Ø§Ø±ÙŠ ØªÙ†ÙÙŠØ° Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡"
          message="Ø§Ù†ØªØ¸Ø± Ø­ØªÙ‰ ÙŠÙƒØªÙ…Ù„ ØªØ­Ø¯ÙŠØ« Ø³Ø¬Ù„ Ø§Ù„Ø¯ÙŠÙˆÙ† Ø§Ù„Ø­Ø§Ù„ÙŠ Ù‚Ø¨Ù„ Ø¨Ø¯Ø¡ Ø¥Ø¬Ø±Ø§Ø¡ Ø¬Ø¯ÙŠØ¯."
        />
      ) : null}

      {actionErrorMessage ? (
        <StatusBanner
          variant="danger"
          title="ØªØ¹Ø°Ø± Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡"
          message={actionErrorMessage}
          actionLabel={retryAction ? "Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©" : undefined}
          onAction={retryAction ? retryLastAction : undefined}
          onDismiss={clearActionFeedback}
        />
      ) : null}

      <div className="detail-grid">
        <section className="workspace-panel">
          <div className="workspace-toolbar">
            <label className="workspace-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Ø§Ø¨Ø­Ø« Ø¨Ø§Ø³Ù… Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
          </div>

          <div className="stack-list">
            {filteredCustomers.map((customer) => {
              const isSelected = customer.id === selectedCustomerId;

              return (
                <button
                  key={customer.id}
                  type="button"
                  className={isSelected ? "list-card list-card--interactive is-selected" : "list-card list-card--interactive"}
                  onClick={() => setSelectedCustomerId(customer.id)}
                >
                  <div className="list-card__header">
                    <strong>{customer.name}</strong>
                    <span>{formatCurrency(customer.current_balance)}</span>
                  </div>
                  <p>{customer.phone ?? "Ø¨Ø¯ÙˆÙ† Ù‡Ø§ØªÙ"}</p>
                  {role === "admin" && customer.credit_limit !== undefined ? (
                    <p className="workspace-footnote">Ø§Ù„Ø­Ø¯: {formatCurrency(customer.credit_limit ?? 0)}</p>
                  ) : customer.due_date_days ? (
                    <p className="workspace-footnote">Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ: {customer.due_date_days} ÙŠÙˆÙ…</p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="workspace-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ù…Ù„Ø®Øµ Ø§Ù„Ø¹Ù…ÙŠÙ„</p>
              <h2>{selectedCustomer?.name ?? "Ø§Ø®ØªØ± Ø¹Ù…ÙŠÙ„Ù‹Ø§"}</h2>
            </div>
          </div>

          {selectedCustomer ? (
            <>
              <div className="summary-grid">
                <article className="workspace-panel">
                  <p className="eyebrow">Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ø­Ø§Ù„ÙŠ</p>
                  <h2>{formatCurrency(selectedCustomer.current_balance)}</h2>
                  <p className="workspace-footnote">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ù…ÙØªÙˆØ­ Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¹Ù…ÙŠÙ„.</p>
                </article>

                <article className="workspace-panel">
                  <p className="eyebrow">Ø§Ù„Ù‚ÙŠÙˆØ¯ Ø§Ù„Ù…ÙØªÙˆØ­Ø©</p>
                  <h2>{formatCompactNumber(customerEntries.length)}</h2>
                  <p className="workspace-footnote">Ø¹Ø¯Ø¯ Ø§Ù„ÙÙˆØ§ØªÙŠØ± ÙˆØ§Ù„Ù‚ÙŠÙˆØ¯ ØºÙŠØ± Ø§Ù„Ù…Ø³Ø¯Ø¯Ø©.</p>
                </article>

                <article className="workspace-panel">
                  <p className="eyebrow">Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ù…ÙØªÙˆØ­</p>
                  <h2>{formatCurrency(totalOutstanding)}</h2>
                  <p className="workspace-footnote">Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù‚ÙŠÙˆØ¯ Ø§Ù„Ø­Ø§Ù„ÙŠØ©.</p>
                </article>
              </div>

              <div className="info-strip">
                <span>Ø§Ù„Ù‡Ø§ØªÙ: {selectedCustomer.phone ?? "ØºÙŠØ± Ù…ØªÙˆÙØ±"}</span>
                {selectedCustomer.due_date_days ? <span>Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚ Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ: {selectedCustomer.due_date_days} ÙŠÙˆÙ…</span> : null}
              </div>

              {activeSection === "ledger" ? (
                <div className="stack-list">
                  {customerEntries.length > 0 ? (
                    customerEntries.map((entry) => (
                      <article key={entry.id} className="list-card">
                        <div className="list-card__header">
                          <strong>{entry.entry_type === "manual" ? "Ø¯ÙŠÙ† ÙŠØ¯ÙˆÙŠ" : "ÙØ§ØªÙˆØ±Ø© Ø¯ÙŠÙ†"}</strong>
                          <span>{formatCurrency(entry.remaining_amount)}</span>
                        </div>
                        <p>Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚: {formatDate(entry.due_date)}</p>
                        <p className="workspace-footnote">{entry.description ?? "Ø¨Ø¯ÙˆÙ† ÙˆØµÙ Ø¥Ø¶Ø§ÙÙŠ"}</p>
                      </article>
                    ))
                  ) : (
                    <div className="empty-panel">
                      <p>Ù„Ø§ ØªÙˆØ¬Ø¯ Ù‚ÙŠÙˆØ¯ Ø¯ÙŠÙ† Ù…ÙØªÙˆØ­Ø© Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¹Ù…ÙŠÙ„. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ø¥Ù„Ù‰ Ù‚Ø³Ù… Ø§Ù„ØªØ³Ø¯ÙŠØ¯ Ø£Ùˆ Ø¥Ù†Ø´Ø§Ø¡ Ø¯ÙŠÙ† ÙŠØ¯ÙˆÙŠ Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø§Ø¬Ø©.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="info-strip">
                  <span>
                    {activeSection === "manual"
                      ? "Ø§Ù†ØªÙ‚Ù„ Ù‡Ù†Ø§ ÙÙ‚Ø· Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø§Ø¬Ø© Ø¥Ù„Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø¯ÙŠÙ† ÙŠØ¯ÙˆÙŠ Ø®Ø§Ø±Ø¬ Ù…Ø³Ø§Ø± Ø§Ù„Ø¨ÙŠØ¹ Ø§Ù„Ù…Ø¹ØªØ§Ø¯."
                      : "ÙŠÙ…ÙƒÙ†Ùƒ ØªØ­Ø¯ÙŠØ¯ Ù‚ÙŠØ¯ Ø¨Ø¹ÙŠÙ†Ù‡ Ø£Ùˆ ØªØ±Ùƒ Ø§Ù„Ù†Ø¸Ø§Ù… ÙŠÙˆØ²Ø¹ Ø§Ù„Ù…Ø¨Ù„Øº ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ Ø¹Ù„Ù‰ Ø£Ù‚Ø¯Ù… Ø¯ÙŠÙ† Ù…ØªØ§Ø­."}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="empty-panel">
              <p>Ø§Ø®ØªØ± Ø¹Ù…ÙŠÙ„Ù‹Ø§ Ù…Ù† Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ù„Ø¹Ø±Ø¶ Ø§Ù„ØªÙØ§ØµÙŠÙ„.</p>
            </div>
          )}
        </section>
      </div>

      {role === "admin" && activeSection === "manual" ? (
        <div className="detail-grid">
          <section className="workspace-panel">
            <p className="eyebrow">Ø¯ÙŠÙ† ÙŠØ¯ÙˆÙŠ</p>
            <h2>ØªØ³Ø¬ÙŠÙ„ Ø¯ÙŠÙ† ÙŠØ¯ÙˆÙŠ</h2>

            <div className="stack-form">
              <label className="stack-field">
                <span>Ø§Ù„Ù…Ø¨Ù„Øº</span>
                <input
                  type="number"
                  min={0.001}
                  step="0.001"
                  value={manualAmount}
                  onChange={(event) => setManualAmount(event.target.value)}
                  placeholder="0.000"
                />
              </label>

              <label className="stack-field">
                <span>Ø§Ù„ÙˆØµÙ</span>
                <textarea
                  rows={3}
                  maxLength={255}
                  value={manualDescription}
                  onChange={(event) => setManualDescription(event.target.value)}
                  placeholder="Ø³Ø¨Ø¨ Ø§Ù„Ø¯ÙŠÙ† Ø§Ù„ÙŠØ¯ÙˆÙŠ"
                />
              </label>

              <div className="info-strip">
                <span>ÙŠØªÙ… Ø­Ù…Ø§ÙŠØ© Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¯ÙŠÙ† Ø§Ù„ÙŠØ¯ÙˆÙŠ Ù…Ù† Ø§Ù„ØªÙƒØ±Ø§Ø± ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§.</span>
              </div>

              <button
                type="button"
                className="primary-button"
                disabled={isPending || !selectedCustomerId || !manualAmount || !manualKey}
                onClick={submitManualDebt}
              >
                {isPending ? <Loader2 className="spin" size={16} /> : <Wallet size={16} />}
                Ø­ÙØ¸ Ø§Ù„Ø¯ÙŠÙ† Ø§Ù„ÙŠØ¯ÙˆÙŠ
              </button>
            </div>

            {manualResult ? (
              <div className="result-card">
                <h3>ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¯ÙŠÙ† Ø§Ù„ÙŠØ¯ÙˆÙŠ</h3>
                <p>Ø£ØµØ¨Ø­ Ø§Ù„Ù‚ÙŠØ¯ Ø¬Ø§Ù‡Ø²Ù‹Ø§ Ø¶Ù…Ù† Ø³Ø¬Ù„ Ø§Ù„Ø¯ÙŠÙˆÙ† Ø§Ù„Ù…ÙØªÙˆØ­Ø© Ù„Ù„Ø¹Ù…ÙŠÙ„ Ø§Ù„Ø­Ø§Ù„ÙŠ.</p>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {selectedCustomer && activeSection === "payment" ? (
        <div className="detail-grid">
          <section className="workspace-panel">
            <p className="eyebrow">ØªØ³Ø¯ÙŠØ¯ Ø§Ù„Ø¯ÙŠÙ†</p>
            <h2>ØªØ³Ø¬ÙŠÙ„ Ø¯ÙØ¹Ø©</h2>

            <div className="stack-form">
              <label className="stack-field">
                <span>Ø§Ù„Ù…Ø¨Ù„Øº</span>
                <input
                  type="number"
                  min={0.001}
                  step="0.001"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="0.000"
                />
              </label>

              <label className="stack-field">
                <span>Ø­Ø³Ø§Ø¨ Ø§Ù„Ø¯ÙØ¹</span>
                <select value={paymentAccountId} onChange={(event) => setPaymentAccountId(event.target.value)}>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>

              {customerEntries.length > 0 ? (
                <label className="stack-field">
                  <span>Ù‚ÙŠØ¯ Ù…Ø­Ø¯Ø¯ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)</span>
                  <select value={paymentEntryId} onChange={(event) => setPaymentEntryId(event.target.value)}>
                    <option value="">Ø§ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºÙ‹Ø§ Ù„ØªÙØ¹ÙŠÙ„ FIFO</option>
                    {customerEntries.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.entry_type} - {formatDate(entry.due_date)} - {formatCurrency(entry.remaining_amount)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="info-strip">
                  <span>Ù„Ø§ ØªÙˆØ¬Ø¯ Ù‚ÙŠÙˆØ¯ Ù…ÙØªÙˆØ­Ø© Ø­Ø§Ù„ÙŠÙ‹Ø§ Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¹Ù…ÙŠÙ„ØŒ Ù„Ø°Ù„Ùƒ Ù„Ù† ÙŠØ¸Ù‡Ø± Ø§Ø®ØªÙŠØ§Ø± Ù‚ÙŠØ¯ Ù…Ø­Ø¯Ø¯.</span>
                </div>
              )}

              <label className="stack-field">
                <span>Ù…Ù„Ø§Ø­Ø¸Ø§Øª</span>
                <textarea
                  rows={3}
                  maxLength={255}
                  value={paymentNotes}
                  onChange={(event) => setPaymentNotes(event.target.value)}
                  placeholder="Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ø®ØªÙŠØ§Ø±ÙŠØ©"
                />
              </label>

              <div className="info-strip">
                <span>ÙŠØªÙ… Ø­Ù…Ø§ÙŠØ© ØªØ³Ø¬ÙŠÙ„ Ø§Ù„ØªØ³Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„ØªÙƒØ±Ø§Ø± ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§.</span>
              </div>

              <button
                type="button"
                className="primary-button"
                disabled={
                  isPending || !selectedCustomerId || !paymentAmount || !paymentAccountId || !paymentKey || customerEntries.length === 0
                }
                onClick={submitDebtPayment}
              >
                {isPending ? <Loader2 className="spin" size={16} /> : <ReceiptText size={16} />}
                ØªØ£ÙƒÙŠØ¯ Ø§Ù„ØªØ³Ø¯ÙŠØ¯
              </button>
            </div>

            {paymentResult ? (
              <div className="result-card">
                <h3>{paymentResult.receipt_number}</h3>
                <p>Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ: {formatCurrency(paymentResult.remaining_balance)}</p>
                <p>Ø§Ù„ØªÙˆØ²ÙŠØ¹Ø§Øª: {paymentResult.allocations.map((entry) => formatCurrency(entry.allocated_amount)).join(" / ")}</p>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
