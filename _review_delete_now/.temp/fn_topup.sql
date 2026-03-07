SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT create_topup('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',30,3,'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','topup','90000000-0000-0000-0000-000000000004'::uuid);
RESET "request.jwt.claim.sub";
RESET ROLE;