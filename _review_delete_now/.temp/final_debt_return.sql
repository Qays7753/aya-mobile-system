SET ROLE service_role;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT create_return(
  '8bf57ec5-fbe0-4d92-9645-8e3f303afc03'::uuid,
  '[{"invoice_item_id":"12b8b79a-2d98-4810-b6e1-c5045ca9baa7","quantity":1}]'::jsonb,
  NULL,
  'final debt full return',
  '40000000-0000-0000-0000-000000000003'::uuid
);