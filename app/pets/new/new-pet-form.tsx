"use client";

import { useActionState, useState } from "react";
import { createPet } from "@/app/actions/pets";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/lib/validation";
import {
  defaultNemesisForSpecies,
  defaultQuirksForSpecies,
  PET_PRESETS,
  type PetPreset,
} from "@/lib/pet-presets";
import {
  SPECIES,
  SPECIES_EMOJI,
  type Species,
  speciesLabel,
} from "@/lib/species";

// Avatar choices are the per-species default emojis, so a species selection
// always maps to an option that shows as selected (still user-overridable).
const EMOJI_CHOICES = Array.from(
  new Set([...SPECIES.map((s) => SPECIES_EMOJI[s]), ...PET_PRESETS.map((p) => p.avatar_emoji)])
);

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

export function NewPetForm() {
  const [state, action] = useActionState<FormState, FormData>(createPet, null);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species | "">("");
  const [breed, setBreed] = useState("");
  const [emoji, setEmoji] = useState("");
  const [personality, setPersonality] = useState("");
  const [nemesis, setNemesis] = useState("");
  const [quirks, setQuirks] = useState("");
  const [selectedPresetName, setSelectedPresetName] = useState("");

  function handleSpeciesChange(next: Species | "") {
    setSpecies(next);
    if (!next) {
      setEmoji("");
      setNemesis("");
      setQuirks("");
      return;
    }
    const preset = SPECIES_EMOJI[next];
    if (preset) setEmoji(preset);
    setNemesis(defaultNemesisForSpecies(next));
    setQuirks(defaultQuirksForSpecies(next));
  }

  function selectPreset(preset: PetPreset) {
    setName(preset.name);
    setSelectedPresetName(preset.name);
    setBreed(preset.breed);
    setSpecies(preset.species);
    setEmoji(preset.avatar_emoji);
    setPersonality(
      preset.quote
        ? `${preset.personality}\n\n"${preset.quote}"`
        : preset.personality
    );
    setNemesis(preset.nemesis ?? defaultNemesisForSpecies(preset.species));
    setQuirks(preset.quirks ?? defaultQuirksForSpecies(preset.species));
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="preset_name" value={selectedPresetName} />
      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Select a Pet
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Pick a launch character to prefill the form, then customize anything you want.
          </p>
        </div>
        <div className="grid max-h-112 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {PET_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => selectPreset(preset)}
              className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-amber-400 hover:shadow-md dark:bg-zinc-900 ${
                name === preset.name
                  ? "border-amber-500 ring-2 ring-amber-200 dark:ring-amber-800/60"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-4xl leading-none" aria-hidden>
                  {preset.avatar_emoji}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {preset.name}
                    </h3>
                    {preset.badge ? (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                        {preset.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {preset.breed} • {speciesLabel(preset.species)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                {preset.personality}
              </p>
              {preset.quote ? (
                <p className="mt-2 text-xs font-medium italic text-amber-700 dark:text-amber-300">
                  &ldquo;{preset.quote}&rdquo;
                </p>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder=""
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="species" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Species
          </label>
          <select
            id="species"
            name="species"
            value={species}
            onChange={(e) => handleSpeciesChange(e.target.value as Species)}
            className={inputClass}
          >
            <option value="" disabled>
              Select a species
            </option>
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {SPECIES_EMOJI[s]} {speciesLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="breed" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Breed <span className="text-zinc-400">(optional)</span>
          </label>
          <input
            id="breed"
            name="breed"
            maxLength={60}
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          placeholder=""
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Avatar
        </legend>
        <div className="flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((choice) => (
            <label key={choice} className="cursor-pointer">
              <input
                type="radio"
                name="avatar_emoji"
                value={choice}
                checked={emoji === choice}
                onChange={() => setEmoji(choice)}
                className="peer sr-only"
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 text-2xl transition peer-checked:border-amber-500 peer-checked:bg-amber-50 dark:border-zinc-700 dark:peer-checked:bg-amber-950/40">
                {choice}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-zinc-400">
          Auto-set from the species — pick another to override.
        </p>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="personality" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Personality / voice style
        </label>
        <textarea
          id="personality"
          name="personality"
          rows={5}
          maxLength={600}
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          className={inputClass}
        />
        <p className="text-xs text-zinc-400">
          This drives how your pet writes reports and dispatches. Be specific and
          a little unhinged.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="nemesis" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Nemesis / worries
          </label>
          <textarea
            id="nemesis"
            name="nemesis"
            rows={4}
            maxLength={500}
            value={nemesis}
            onChange={(e) => setNemesis(e.target.value)}
            placeholder="Squirrels, mail carriers, mirror cats, hawks, glass-tapping kids..."
            className={inputClass}
          />
          <p className="text-xs text-zinc-400">
            Recurring rivals, fears, or suspicious things this pet reports on.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="quirks" className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Quirks
          </label>
          <textarea
            id="quirks"
            name="quirks"
            rows={4}
            maxLength={500}
            value={quirks}
            onChange={(e) => setQuirks(e.target.value)}
            placeholder="Favorite habits, odd behaviors, dramatic reactions..."
            className={inputClass}
          />
          <p className="text-xs text-zinc-400">
            Small behaviors and recurring bits that make this pet feel specific.
          </p>
        </div>
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
