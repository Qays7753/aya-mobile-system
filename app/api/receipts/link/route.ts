import { NextResponse } from "next/server";
import { authorizeRequest, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { buildReceiptUrl, getReceiptLinkErrorMeta } from "@/lib/api/communication";
import type { StandardEnvelope } from "@/lib/pos/types";
import { issueReceiptLinkSchema, revokeReceiptLinkSchema } from "@/lib/validations/communication";

type IssueReceiptLinkResponse = {
  token_id: string;
  receipt_url: string;
  expires_at: string;
  is_reissued: boolean;
};

type RevokeReceiptLinkResponse = {
  token_id: string;
  invoice_id: string;
  revoked: boolean;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, issueReceiptLinkSchema, getReceiptLinkErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const { data, error: rpcError } = await authorization.supabase.rpc("issue_receipt_link", {
      p_invoice_id: validation.data.invoice_id,
      p_channel: validation.data.channel,
      p_expires_in_hours: validation.data.expires_in_hours,
      p_force_reissue: validation.data.force_reissue,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    const origin = new URL(request.url).origin;

    return NextResponse.json<StandardEnvelope<IssueReceiptLinkResponse>>(
      {
        success: true,
        data: {
          token_id: data.token_id,
          receipt_url: buildReceiptUrl(origin, data.token),
          expires_at: data.expires_at,
          is_reissued: data.is_reissued
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getReceiptLinkErrorMeta);
  }
}

export async function PATCH(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, revokeReceiptLinkSchema, getReceiptLinkErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const { data, error: rpcError } = await authorization.supabase.rpc("revoke_receipt_link", {
      p_token_id: validation.data.token_id ?? null,
      p_invoice_id: validation.data.invoice_id ?? null,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json<StandardEnvelope<RevokeReceiptLinkResponse>>(
      {
        success: true,
        data: {
          token_id: data.token_id,
          invoice_id: data.invoice_id,
          revoked: data.revoked
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getReceiptLinkErrorMeta);
  }
}
