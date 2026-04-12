-- Dodaje kind 'reminder_day_before' (idempotent po imenu constrainta)

ALTER TABLE appointment_notification_log
  DROP CONSTRAINT IF EXISTS appointment_notification_log_kind_check;

ALTER TABLE appointment_notification_log
  ADD CONSTRAINT appointment_notification_log_kind_check
  CHECK (
    kind IN (
      'reminder_day_before',
      'reminder_24h',
      'reminder_2h',
      'no_show',
      'booking_confirm_sms',
      'booking_confirm_wa'
    )
  );
