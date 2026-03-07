SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT create_maintenance_job('Cust A','phone','screen broken','0791234567',15,'note','90000000-0000-0000-0000-000000000005'::uuid);
RESET "request.jwt.claim.sub";
RESET ROLE;