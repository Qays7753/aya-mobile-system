SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT create_purchase(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
  '[{"product_id":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","quantity":2,"unit_cost":6}]'::jsonb,
  true,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'purchase qa',
  '20000000-0000-0000-0000-000000000002'::uuid
);
RESET "request.jwt.claim.sub";
RESET ROLE;