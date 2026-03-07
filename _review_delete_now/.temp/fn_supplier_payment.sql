SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT create_supplier_payment('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',10,'pay supplier','90000000-0000-0000-0000-000000000003'::uuid);
RESET "request.jwt.claim.sub";
RESET ROLE;