-- Upgrade Compatibility (existing databases)
-- ============================================================
DO $$
BEGIN
  -- debt_entries: keep a single unique idempotency constraint with canonical name.
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'debt_entries'
      AND c.conname = 'debt_entries_idempotency_key_key'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'debt_entries'
      AND c.conname = 'uq_debt_entries_idempotency'
  ) THEN
    ALTER TABLE debt_entries
      RENAME CONSTRAINT debt_entries_idempotency_key_key TO uq_debt_entries_idempotency;
  END IF;

  -- debt_entries: manual debt command requires idempotency_key.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'debt_entries'
      AND c.conname = 'chk_manual_debt_idempotency_required'
  ) THEN
    ALTER TABLE debt_entries
      ADD CONSTRAINT chk_manual_debt_idempotency_required CHECK (
        entry_type <> 'manual' OR idempotency_key IS NOT NULL
      );
  END IF;

  -- daily_snapshots: drop legacy idempotency unique and enforce one snapshot per day.
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'daily_snapshots'
      AND c.conname = 'daily_snapshots_idempotency_key_key'
  ) THEN
    ALTER TABLE daily_snapshots
      DROP CONSTRAINT daily_snapshots_idempotency_key_key;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'daily_snapshots'
      AND c.conname = 'uq_daily_snapshots_snapshot_date'
  ) THEN
    ALTER TABLE daily_snapshots
      ADD CONSTRAINT uq_daily_snapshots_snapshot_date UNIQUE (snapshot_date);
  END IF;
END $$;
