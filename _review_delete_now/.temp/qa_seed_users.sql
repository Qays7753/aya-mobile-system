INSERT INTO auth.users (id, raw_user_meta_data) VALUES
('11111111-1111-1111-1111-111111111111', '{"full_name":"Admin QA","role":"admin"}'::jsonb),
('22222222-2222-2222-2222-222222222222', '{"full_name":"POS QA","role":"pos_staff"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

SELECT id, full_name, role FROM profiles
WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ORDER BY role;
