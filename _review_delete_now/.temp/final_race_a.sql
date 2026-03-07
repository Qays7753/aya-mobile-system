SET ROLE service_role;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT create_sale(
  '[{"product_id":"dddddddd-dddd-dddd-dddd-dddddddddddd","quantity":1}]'::jsonb,
  '[{"account_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","amount":100}]'::jsonb,
  'RaceA',NULL,NULL,NULL,'POS-1','raceA','50000000-0000-0000-0000-000000000001'::uuid
);