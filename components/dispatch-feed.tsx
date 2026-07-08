import { formatDateTime } from "@/lib/scheduling";
import type { AlertKind } from "@/lib/types";

export interface AlertRow {
  id: string;
  kind: AlertKind;
  title: string;
  body: string;
  created_at: string;
  pet?: { name: string; avatar_emoji: string } | null;
}

const KIND_STYLES: Record<AlertKind, { emoji: string; badge: string }> = {
  report: {
    emoji: "📋",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  },
  nemesis: {
    emoji: "🐿️",
    badge: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  },
  praise: {
    emoji: "🏅",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
};

export function DispatchFeed({ alerts }: { alerts: AlertRow[] }) {
  if (alerts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No dispatches yet. Generate a report or a new dispatch to hear from your
        pet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {alerts.map((a) => {
        const style = KIND_STYLES[a.kind];
        return (
          <li
            key={a.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-lg">{style.emoji}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {a.title}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}
                >
                  {a.kind}
                </span>
              </div>
              <time className="shrink-0 text-xs text-zinc-400">
                {formatDateTime(a.created_at)}
              </time>
            </div>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {a.body}
            </p>
            {a.pet ? (
              <p className="mt-2 text-xs text-zinc-400">
                — {a.pet.avatar_emoji} {a.pet.name}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
