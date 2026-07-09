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
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
        >
          📋 Generate Report
        </SubmitButton>
      </form>

      <form action={generateNemesisAction}>
        <input type="hidden" name="pet_id" value={petId} />
        <SubmitButton
          pendingLabel="Scanning…"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          🐿️ New Dispatch
        </SubmitButton>
      </form>

      <form action={generateRandomEventAction}>
        <input type="hidden" name="pet_id" value={petId} />
        <SubmitButton
          pendingLabel="Rolling…"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          🎲 Random Event
        </SubmitButton>
      </form>

      {showPraise ? (
        <form action={generatePraiseAction}>
          <input type="hidden" name="pet_id" value={petId} />
          <SubmitButton
            pendingLabel="…"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            🏅 Request Praise
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
