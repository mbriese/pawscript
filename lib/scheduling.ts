export interface FrequencyOption {
  value: string; // valid Postgres interval literal
  label: string;
}

export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: "4 hours", label: "Every 4 hours" },
  { value: "8 hours", label: "Every 8 hours" },
  { value: "12 hours", label: "Twice a day" },
  { value: "1 day", label: "Daily" },
  { value: "2 days", label: "Every 2 days" },
  { value: "1 week", label: "Weekly" },
  { value: "1 mon", label: "Monthly" },
];

const FREQUENCY_LABELS: Record<string, string> = Object.fromEntries(
  FREQUENCY_OPTIONS.map((o) => [o.value, o.label])
);

export function frequencyLabel(frequency: string): string {
  if (FREQUENCY_LABELS[frequency]) return FREQUENCY_LABELS[frequency];
  // Fall back to a lightly humanized version of raw Postgres interval text.
  return frequency
    .replace(/\bmon\b/, "month")
    .replace(/(\d+):00:00/, (_m, h) => `${Number(h)} hours`)
    .trim();
}

export function isOverdue(nextDueAt: string | null): boolean {
  if (!nextDueAt) return false;
  return new Date(nextDueAt).getTime() <= Date.now();
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);

  let phrase: string;
  if (minutes < 1) phrase = "just now";
  else if (minutes < 60) phrase = `${minutes} min`;
  else if (hours < 24) phrase = `${hours} hr`;
  else phrase = `${days} day${days === 1 ? "" : "s"}`;

  if (phrase === "just now") return phrase;
  return diffMs >= 0 ? `in ${phrase}` : `${phrase} ago`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
