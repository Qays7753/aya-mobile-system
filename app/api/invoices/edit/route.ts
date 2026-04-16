import { NextResponse } from "next/server";
import { authorizeRequest, getApiErrorMeta, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { convertDiscountAmountsToLegacyPercentages } from "@/lib/api/discount-amounts";
import { getEditInvoiceErrorMeta } from "@/lib/api/invoices";
import type { StandardEnvelope } from "@/lib/pos/types";
import { editInvoiceSchema } from "@/lib/validations/invoices";

type EditInvoiceResponseData = {
  invoice_id: string;
  invoice_number: string;
  total: number;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, editInvoiceSchema, getApiErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const payload = validation.data;
    const productIds = Array.from(new Set(payload.items.map((item) => item.product_id)));
    const { data: products, error: productsError } = await authorization.supabase
      .from("products")
      .select("id, sale_price")
      .in("id", productIds)
      .returns<Array<{ id: string; sale_price: number }>>();

    if (productsError) {
      throw productsError;
    }

    const priceByProductId = new Map(
      (products ?? []).map((product) => [product.id, product.sale_price])
    );
    const { items: legacyDiscountItems } = convertDiscountAmountsToLegacyPercentages({
      items: payload.items,
      maxDiscountAmount: authorization.maxDiscountAmount,
      priceByProductId
    });

    const { data, error: rpcError } = await authorization.supabase.rpc("edit_invoice", {
      p_invoice_id: payload.invoice_id,
      p_items: legacyDiscountItems,
      p_payments: payload.payments,
      p_debt_customer_id: payload.customer_id ?? null,
      p_edit_reason: payload.edit_reason,
      p_idempotency_key: payload.idempotency_key,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json<StandardEnvelope<EditInvoiceResponseData>>(
      {
        success: true,
        data: {
          invoice_id: data.invoice_id,
          invoice_number: data.invoice_number,
          total: data.total
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getEditInvoiceErrorMeta);
  }
}
