SET ROLE authenticated;
SET LOCAL "request.jwt.claim.sub"='22222222-2222-2222-2222-222222222222';
INSERT INTO products(name,category,sale_price,stock_quantity,created_by)
VALUES ('X','device',1,1,'11111111-1111-1111-1111-111111111111');
RESET ROLE;