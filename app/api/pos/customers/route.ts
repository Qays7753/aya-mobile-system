import { NextResponse } from "next/server";
import {
  authorizeRequest,
  getApiErrorMeta,
  handleRouteError
} from "@/lib/api/common";
import type { StandardEnvelope } from "@/lib/pos/types";
import type { CustomerSearchResult } from "@/hooks/use-customer-search";

type CustomersResponseData = {
  items: CustomerSearchResult[];
};

export async function GET(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"], {
      requiredPermissions: ["debts.read", "pos.use"]
    });

    if (!authorization.authorized) {
      return authorization.response;
    }

    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

    if (query.length < 2) {
      return NextResponse.json<StandardEnvelope<CustomersResponseData>>(
        {
          success: true,
          data: { items: [] }
        },
        { status: 200 }
      );
    }

    const pattern = `%${query}%`;
    const { data, error } = await authorization.supabase
      .from("debt_customers")
      .select("id, name, phone, current_balance")
      .eq("is_active", true)
      .or(`name.ilike.${pattern},phone.ilike.${pattern}`)
      .order("name", { ascending: true })
      .limit(8);

    if (error) {
      throw error;
    }

    return NextResponse.json<StandardEnvelope<CustomersResponseData>>(
      {
        success: true,
        data: {
          items: (data ?? []) as CustomerSearchResult[]
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getApiErrorMeta);
  }
}
