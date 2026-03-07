import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : "";

  if (!expected || authHeader !== expected) {
    return NextResponse.json(
      { success: false, error: "ERR_UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("fn_verify_balance_integrity");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
