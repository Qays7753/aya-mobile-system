SET ROLE service_role;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT create_return(
  '1c8073fa-cb95-4c75-b575-bb845110084d'::uuid,
  '[{"invoice_item_id":"6d1d71ea-d2dc-4948-a2e3-60e6a370e963","quantity":1}]'::jsonb,
  NULL,
  'debt return',
  '10000000-0000-0000-0000-000000000114'::uuid
);
RESET "request.jwt.claim.sub";
RESET ROLE;