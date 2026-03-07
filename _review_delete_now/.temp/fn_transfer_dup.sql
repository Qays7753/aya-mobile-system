SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT create_transfer('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','abab0000-0000-0000-0000-000000000000',5,'dup test','90000000-0000-0000-0000-000000000010'::uuid);
SELECT create_transfer('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','abab0000-0000-0000-0000-000000000000',5,'dup test','90000000-0000-0000-0000-000000000010'::uuid);
RESET "request.jwt.claim.sub";
RESET ROLE;