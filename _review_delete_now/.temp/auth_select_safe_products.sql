SET ROLE authenticated;
SET LOCAL "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
SELECT count(*) FROM products;
RESET ROLE;