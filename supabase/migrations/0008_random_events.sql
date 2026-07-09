-- Random Events Engine support.

alter type alert_kind add value if not exists 'event';

alter table public.alerts
  add column if not exists severity text;
