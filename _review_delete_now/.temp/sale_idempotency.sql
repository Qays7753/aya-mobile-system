SET ROLE service_role;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT create_sale(
  '[{"product_id":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","quantity":1}]'::jsonb,
  '[{"account_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","amount":10}]'::jsonb,
  'Idem',NULL,NULL,NULL,'POS-1','idem','99999999-0000-0000-0000-000000000031'::uuid
);
SELECT create_sale(
  '[{"product_id":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","quantity":1}]'::jsonb,
  '[{"account_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","amount":10}]'::jsonb,
  'Idem',NULL,NULL,NULL,'POS-1','idem','99999999-0000-0000-0000-000000000031'::uuid
);