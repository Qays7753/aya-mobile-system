SET ROLE service_role;
SET "request.jwt.claim.sub"='11111111-1111-1111-1111-111111111111';
SELECT 'transfer' AS fn, create_transfer('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','abab0000-0000-0000-0000-000000000000',50,'xfer','90000000-0000-0000-0000-000000000001'::uuid);
SELECT 'expense' AS fn, create_expense(5,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','edededed-eded-eded-eded-edededededed','pen','note','90000000-0000-0000-0000-000000000002'::uuid);
SELECT 'supplier_payment' AS fn, create_supplier_payment('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',10,'pay supplier','90000000-0000-0000-0000-000000000003'::uuid);
SELECT 'topup' AS fn, create_topup('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',30,3,'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','topup','90000000-0000-0000-0000-000000000004'::uuid);
RESET "request.jwt.claim.sub";
RESET ROLE;