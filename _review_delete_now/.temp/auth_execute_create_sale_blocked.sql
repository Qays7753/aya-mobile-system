SET ROLE authenticated;
SET LOCAL "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT create_sale(
  '[{"product_id":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","quantity":1}]'::jsonb,
  '[{"account_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","amount":10}]'::jsonb,
  NULL,NULL,NULL,NULL,'POS-1','auth-test','aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa'::uuid
);
RESET ROLE;