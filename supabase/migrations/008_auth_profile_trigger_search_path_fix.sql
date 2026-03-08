-- ============================================================
-- PX-03 blocker fix: auth.users -> profiles trigger must not
-- depend on caller search_path.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', '')::public.user_role,
      'pos_staff'::public.user_role
    )
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_handle_new_user() IS
  'ينشئ سجل public.profiles تلقائيا عند تسجيل مستخدم جديد في auth.users دون الاعتماد على search_path الخاص بالمستدعي.';
