-- Partial unique indexes: only one ACTIVE allocation per asset slot
-- These enforce CLAUDE.md: "only ONE Active allocation per asset_id at a time"

CREATE UNIQUE INDEX IF NOT EXISTS uidx_active_office_alloc
  ON allocations (mp_office_id)
  WHERE status = 'ACTIVE' AND mp_office_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_active_flat_alloc
  ON allocations (mp_flat_id)
  WHERE status = 'ACTIVE' AND mp_flat_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_active_quarter_alloc
  ON allocations (quarter_id)
  WHERE status = 'ACTIVE' AND quarter_id IS NOT NULL;
