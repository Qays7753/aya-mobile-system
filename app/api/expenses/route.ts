import { NextResponse } from "next/server";
import { authorizeRequest, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { getCreateExpenseErrorMeta } from "@/lib/api/expenses";
import type { StandardEnvelope } from "@/lib/pos/types";
import { createExpenseSchema } from "@/lib/validations/expenses";

type ExpenseResponseData = {
  expense_id: string;
  expense_number: string;
  ledger_entry_id: string;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"], {
      requiredPermissions: ["expenses.create"]
    });
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, createExpenseSchema, getCreateExpenseErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const { data, error: rpcError } = await authorization.supabase.rpc("create_expense", {
      p_amount: validation.data.amount,
      p_account_id: validation.data.account_id,
      p_category_id: validation.data.expense_category_id,
      p_description: validation.data.description,
      p_notes: validation.data.notes ?? null,
      p_idempotency_key: validation.data.idempotency_key,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json<StandardEnvelope<ExpenseResponseData>>(
      {
        success: true,
        data: {
          expense_id: data.expense_id,
          expense_number: data.expense_number,
          ledger_entry_id: data.ledger_entry_id
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getCreateExpenseErrorMeta);
  }
}
