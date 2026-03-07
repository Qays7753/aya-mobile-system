INSERT INTO ledger_entries (id, account_id, entry_type, amount, reference_type, description, created_by)
VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','income',1,'test','append-only test','11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;