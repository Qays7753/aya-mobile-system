SET ROLE service_role;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT create_sale(
  '[{"product_id":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","quantity":2}]'::jsonb,
  '[{"account_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","amount":20}]'::jsonb,
  'WalkIn','0791111111',NULL,NULL,'POS-1','sale-idempotency-1','99999999-0000-0000-0000-000000000001'::uuid
);
RESET "request.jwt.claim.sub";
RESET ROLE;