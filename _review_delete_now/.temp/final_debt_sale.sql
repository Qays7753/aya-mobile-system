SET ROLE service_role;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT create_sale(
  '[{"product_id":"dddddddd-dddd-dddd-dddd-dddddddddddd","quantity":1}]'::jsonb,
  '[]'::jsonb,
  'Debt Sale',NULL,'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,NULL,'POS-1','final-debt-sale','40000000-0000-0000-0000-000000000002'::uuid
);