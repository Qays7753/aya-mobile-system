SET ROLE authenticated;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
UPDATE accounts SET current_balance=current_balance+1 WHERE id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';