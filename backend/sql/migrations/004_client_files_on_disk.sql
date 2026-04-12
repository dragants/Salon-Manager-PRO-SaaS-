-- Prilozi u kartonu: opciono na disku (folder po klijentu), BYTEA ostaje za stare zapise

ALTER TABLE client_chart_files
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER;

ALTER TABLE client_chart_files
  ALTER COLUMN data DROP NOT NULL;

UPDATE client_chart_files
SET file_size_bytes = octet_length(data)
WHERE data IS NOT NULL AND file_size_bytes IS NULL;
