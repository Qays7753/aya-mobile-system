import { NextResponse } from "next/server";
import {
  authorizeRequest,
  getApiErrorMeta,
  handleRouteError,
  internalErrorResponse,
  parseAndValidate
} from "@/lib/api/common";
import { getCancelInvoiceErrorMeta } from "@/lib/api/invoices";
import type { StandardEnvelope } from "@/lib/pos/types";
import { cancelInvoiceSchema } from "@/lib/validations/invoices";

type CancelInvoiceResponseData = {
  success: boolean;
  reversed_entries_count: number;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, cancelInvoiceSchema, getApiErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const payload = validation.data;
    const { data, error: rpcError } = await authorization.supabase.rpc("cancel_invoice", {
      p_invoice_id: payload.invoice_id,
      p_cancel_reason: payload.cancel_reason,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    if (!data || typeof data !== "object") {
      return internalErrorResponse(new Error("ERR_API_CONTRACT_INVALID"), {
        context: "invoices.cancel.response-shape"
      });
    }

    return NextResponse.json<StandardEnvelope<CancelInvoiceResponseData>>(
      {
        success: true,
        data: {
          success: Boolean(data.success ?? true),
          reversed_entries_count: typeof data.reversed_entries_count === "number" ? data.reversed_entries_count : 0
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getCancelInvoiceErrorMeta);
  }
}
