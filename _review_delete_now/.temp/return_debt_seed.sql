INSERT INTO debt_customers (id,name,phone,credit_limit,current_balance,due_date_days,is_active,created_by)
VALUES ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd','Debt Return QA','0777777777',500,100,30,true,'11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (id,invoice_number,customer_name,subtotal,total_amount,debt_amount,debt_customer_id,status,created_by)
VALUES ('44444444-4444-4444-4444-444444444444','AYA-2026-77777','Debt Return QA',100,100,100,'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd','active','11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO invoice_items (id,invoice_id,product_id,product_name_at_time,quantity,unit_price,cost_price_at_time,discount_percentage,discount_amount,total_price)
VALUES ('55555555-5555-5555-5555-555555555555','44444444-4444-4444-4444-444444444444','eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee','Cable B',10,10,5,0,0,100)
ON CONFLICT (id) DO NOTHING;

INSERT INTO debt_entries (id,debt_customer_id,entry_type,invoice_id,amount,due_date,remaining_amount,created_by)
VALUES ('66666666-6666-6666-6666-666666666666','cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd','from_invoice','44444444-4444-4444-4444-444444444444',100,CURRENT_DATE+30,100,'11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;