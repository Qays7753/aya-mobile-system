SET ROLE service_role;
SET "request.jwt.claim.sub"='33333333-3333-3333-3333-333333333333';
SELECT create_sale(
  '[{"product_id":"dddddddd-dddd-dddd-dddd-dddddddddddd","quantity":1}]'::jsonb,
  '[{"account_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","amount":100}]'::jsonb,
  'Race2',NULL,NULL,NULL,'POS-2','race-2','99999999-0000-0000-0000-000000000022'::uuid
);