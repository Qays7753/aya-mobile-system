INSERT INTO auth.users (id, raw_user_meta_data) VALUES
('11111111-1111-1111-1111-111111111111', '{"name":"Admin QA","role":"admin"}'),
('22222222-2222-2222-2222-222222222222', '{"name":"POS QA 1","role":"pos_staff"}'),
('33333333-3333-3333-3333-333333333333', '{"name":"POS QA 2","role":"pos_staff"}')
ON CONFLICT (id) DO NOTHING;

UPDATE profiles SET role='admin', full_name='Admin QA' WHERE id='11111111-1111-1111-1111-111111111111';
UPDATE profiles SET role='pos_staff', full_name='POS QA 1' WHERE id='22222222-2222-2222-2222-222222222222';
UPDATE profiles SET role='pos_staff', full_name='POS QA 2' WHERE id='33333333-3333-3333-3333-333333333333';

INSERT INTO accounts (id,name,type,module_scope,opening_balance,current_balance,display_order)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Cash Main','cash','core',1000,1000,1),
('abab0000-0000-0000-0000-000000000000','Bank Main','bank','core',500,500,2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO suppliers (id,name,phone,address,current_balance,is_active)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Supplier QA','0790000000','Amman',0,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO debt_customers (id,name,phone,credit_limit,current_balance,due_date_days,is_active,created_by)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc','Debt QA','0780000000',200,0,30,true,'11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id,name,category,sku,sale_price,cost_price,avg_cost_price,stock_quantity,min_stock_level,track_stock,is_quick_add,is_active,created_by)
VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd','Phone A','device','SKU-PHONE-A',100,70,70,3,1,true,false,true,'11111111-1111-1111-1111-111111111111'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee','Cable B','accessory','SKU-CABLE-B',10,5,5,10,2,true,true,true,'11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;
