SET ROLE service_role;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT create_return(
  '98e145c5-5384-46d0-9725-5b366a3650bf'::uuid,
  '[{"invoice_item_id":"de887fcb-a655-4a1b-be09-6d2caa3c49c2","quantity":1}]'::jsonb,
  NULL,
  'debt full return',
  '20000000-0000-0000-0000-000000000004'::uuid
);
RESET "request.jwt.claim.sub";
RESET ROLE;