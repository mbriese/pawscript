import type { Badge } from "@/lib/types";

interface Props {
  catalog: Badge[];
  earnedKeys: Set<string>;
}

export function BadgeShelf({ catalog, earnedKeys }: Props) {
  if (catalog.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No badges in the catalog yet. Run the migration to seed them.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {catalog.map((badge) => {
        const earned = earnedKeys.has(badge.key);
        return (
          <div
            key={badge.key}
            className={`rounded-xl border p-3 text-center transition ${
              earned
                ? "border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30"
                : "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
            }`}
            title={badge.description}
          >
            <div className={`text-3xl ${earned ? "" : "grayscale"}`} aria-hidden>
              {badge.emoji}
            </div>
            <div className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
              {badge.name}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
              {earned ? "Earned" : "Locked"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
