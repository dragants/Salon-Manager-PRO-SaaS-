-- Run once on existing databases (idempotent)

CREATE TABLE IF NOT EXISTS appointment_notification_log (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (
    kind IN (
      'reminder_day_before',
      'reminder_24h',
      'reminder_2h',
      'no_show',
      'booking_confirm_sms',
      'booking_confirm_wa'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (appointment_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_appt_notif_appt ON appointment_notification_log(appointment_id);
