"use client";

import { useActionState } from "react";
import { createPet } from "@/app/actions/pets";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/lib/validation";

const EMOJI_CHOICES = ["🐱", "🐶", "🐰", "🐹", "🦎", "🐦", "🐢", "🐴", "🐾"];

const PERSONALITY_PRESETS = [
  "A dry, bureaucratic house cat who narrates domestic life like a mid-level government auditor. Speaks in clipped official memos.",
  "An overdramatic golden retriever who treats every event as breaking news and every squirrel as a national emergency.",
  "A world-weary noir detective in a small furry body, narrating life like a rain-soaked crime novel.",
  "A chipper motivational coach who believes in you, the humans, and above all, snacks.",
];

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

export function NewPetForm() {
  const [state, action] = useActionState<FormState, FormData>(createPet, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Name
        </label>
        <input id="name" name="name" required maxLength={60} placeholder="Sir Reginald Whiskerton III" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="species" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Species
          </label>
          <input id="species" name="species" defaultValue="cat" maxLength={40} className={inputClass} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="breed" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Breed <span className="text-zinc-400">(optional)</span>
          </label>
          <input id="breed" name="breed" maxLength={60} placeholder="British Shorthair" className={inputClass} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Avatar
        </legend>
        <div className="flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((emoji, i) => (
            <label key={emoji} className="cursor-pointer">
              <input type="radio" name="avatar_emoji" value={emoji} defaultChecked={i === 0} className="peer sr-only" />
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 text-2xl transition peer-checked:border-amber-500 peer-checked:bg-amber-50 dark:border-zinc-700 dark:peer-checked:bg-amber-950/40">
                {emoji}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="personality" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Personality / voice style
        </label>
        <textarea id="personality" name="personality" rows={4} maxLength={600} defaultValue={PERSONALITY_PRESETS[0]} className={inputClass} />
        <p className="text-xs text-zinc-400">
          This drives how your pet writes reports and dispatches. Be specific and
          a little unhinged.
        </p>
      </div>

      <SubmitButton
        pendingLabel="Creating…"
        className="rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-amber-600"
      >
        Create pet
      </SubmitButton>

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
