import {
  generateNemesisAction,
  generatePraiseAction,
  generateRandomEventAction,
  generateReportAction,
} from "@/app/actions/ai";
import { SubmitButton } from "./submit-button";

export function PetActions({
  petId,
  showPraise = false,
}: {
  petId: string;
  showPraise?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={generateReportAction}>
        <input type="hidden" name="pet_id" value={petId} />
        <SubmitButton
          pendingLabel="Filing…"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500"
        >
          📋 Generate Report
        </SubmitButton>
      </form>

      <form action={generateNemesisAction}>
        <input type="hidden" name="pet_id" value={petId} />
        <SubmitButton
          pendingLabel="Scanning…"
          className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-4 py-2 text-sm font-semibold text-fuchsia-700 shadow-sm transition hover:border-fuchsia-300 hover:bg-fuchsia-100 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/30 dark:text-fuchsia-200 dark:hover:bg-fuchsia-950/50"
        >
          🐿️ New Dispatch
        </SubmitButton>
      </form>

      <form action={generateRandomEventAction}>
        <input type="hidden" name="pet_id" value={petId} />
        <SubmitButton
          pendingLabel="Rolling…"
          className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200 dark:hover:bg-violet-950/50"
        >
          🎲 Random Event
        </SubmitButton>
      </form>

      {showPraise ? (
        <form action={generatePraiseAction}>
          <input type="hidden" name="pet_id" value={petId} />
          <SubmitButton
            pendingLabel="…"
            className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm transition hover:border-purple-300 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/30 dark:text-purple-200 dark:hover:bg-purple-950/50"
          >
            🏅 Request Praise
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
