INSERT INTO accounts (id,name,type,module_scope,opening_balance,current_balance,display_order)
VALUES ('abab0000-0000-0000-0000-000000000000','Bank Main','bank','core',500,500,2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO expense_categories (id,name,is_active,created_by)
VALUES ('edededed-eded-eded-eded-edededededed','Ops',true,'11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

UPDATE suppliers SET current_balance=20 WHERE id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';