import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type WorkspaceAccessResult =
  | { state: "ok"; userId: string; role: "admin" | "pos_staff"; fullName: string | null }
  | { state: "unauthenticated" }
  | { state: "forbidden" };

type ProfileAccessRow = {
  full_name: string | null;
  role: "admin" | "pos_staff";
  is_active: boolean;
};

export async function getWorkspaceAccess(): Promise<WorkspaceAccessResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { state: "unauthenticated" };
  }

  const adminClient = getSupabaseAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle<ProfileAccessRow>();

  if (
    profileError ||
    !profile ||
    !profile.is_active ||
    !["admin", "pos_staff"].includes(profile.role)
  ) {
    return { state: "forbidden" };
  }

  return {
    state: "ok",
    userId: user.id,
    role: profile.role,
    fullName: profile.full_name
  };
}
