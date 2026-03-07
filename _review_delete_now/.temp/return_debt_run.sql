SET ROLE service_role;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT create_return(
  '44444444-4444-4444-4444-444444444444'::uuid,
  '[{"invoice_item_id":"55555555-5555-5555-5555-555555555555","quantity":4}]'::jsonb,
  NULL,
  'partial debt return',
  '77777777-7777-7777-7777-777777777777'::uuid
);
RESET "request.jwt.claim.sub";
RESET ROLE;