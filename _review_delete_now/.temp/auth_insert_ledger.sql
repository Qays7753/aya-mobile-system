SET ROLE authenticated;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
INSERT INTO ledger_entries(account_id,entry_type,amount,description,created_by) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','income',1,'x','22222222-2222-2222-2222-222222222222');