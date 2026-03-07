SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT reconcile_account('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',1200,'qa reconcile');
RESET "request.jwt.claim.sub";
RESET ROLE;