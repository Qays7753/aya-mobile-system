SET ROLE service_role;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT create_return(
  '214e7f5e-5a64-493b-a4ed-68c82b57752f'::uuid,
  '[{"invoice_item_id":"751cad03-05dd-4133-8a5a-29295faa9d94","quantity":1}]'::jsonb,
  NULL,
  'debt full return',
  '60000000-0000-0000-0000-000000000002'::uuid
);