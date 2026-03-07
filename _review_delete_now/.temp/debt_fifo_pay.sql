SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT create_debt_payment('cccccccc-cccc-cccc-cccc-cccccccccccc',60,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','FIFO pay','10000000-0000-0000-0000-000000000003'::uuid,NULL);
RESET "request.jwt.claim.sub";
RESET ROLE;