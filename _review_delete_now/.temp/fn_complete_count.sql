SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT complete_inventory_count(
  '99990000-0000-0000-0000-000000000001'::uuid,
  '[{"product_id":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee","actual_quantity":9,"reason":"qa adjust"}]'::jsonb
);
RESET "request.jwt.claim.sub";
RESET ROLE;