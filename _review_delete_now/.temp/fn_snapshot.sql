SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT create_daily_snapshot(CURRENT_DATE,'qa snap','90000000-0000-0000-0000-000000000006'::uuid);
RESET "request.jwt.claim.sub";
RESET ROLE;