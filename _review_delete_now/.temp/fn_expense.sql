SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT create_expense(5,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','edededed-eded-eded-eded-edededededed','pen','note','90000000-0000-0000-0000-000000000002'::uuid);
RESET "request.jwt.claim.sub";
RESET ROLE;