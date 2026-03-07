SET ROLE authenticated;
SET "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT cost_price FROM products LIMIT 1;
RESET "request.jwt.claim.sub";
RESET ROLE;