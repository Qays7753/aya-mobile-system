SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT create_debt_manual('cccccccc-cccc-cccc-cccc-cccccccccccc',50,'Debt A','10000000-0000-0000-0000-000000000001'::uuid);
SELECT pg_sleep(0.01);
SELECT create_debt_manual('cccccccc-cccc-cccc-cccc-cccccccccccc',30,'Debt B','10000000-0000-0000-0000-000000000002'::uuid);
RESET "request.jwt.claim.sub";
RESET ROLE;