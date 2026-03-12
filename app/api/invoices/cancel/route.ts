import { NextResponse } from "next/server";
import { authorizeRequest, errorResponse, extractErrorCode, getApiErrorMeta, internalErrorResponse } from "@/lib/api/common";
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const meta = getApiErrorMeta("ERR_API_VALIDATION_FAILED");
      return errorResponse("ERR_API_VALIDATION_FAILED", meta.message, meta.status, {
        body: ["تعذر قراءة JSON من الطلب."]
      });
    }

    const parsedBody = cancelInvoiceSchema.safeParse(body);
    if (!parsedBody.success) {
      const meta = getApiErrorMeta("ERR_API_VALIDATION_FAILED");
      return errorResponse("ERR_API_VALIDATION_FAILED", meta.message, meta.status, {
        field_errors: parsedBody.error.flatten().fieldErrors
      });
    }

    const payload = parsedBody.data;
    const { data, error: rpcError } = await authorization.supabase.rpc("cancel_invoice", {
      p_invoice_id: payload.invoice_id,
      p_cancel_reason: payload.cancel_reason,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      const code = extractErrorCode(rpcError.message);
      const meta = getCancelInvoiceErrorMeta(code);
      return errorResponse(code, meta.message, meta.status);
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
    return internalErrorResponse(error, { context: "invoices.cancel.unhandled" });
  }
}
