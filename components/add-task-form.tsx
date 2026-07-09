"use client";

import { useRef, useState } from "react";
import { createTask } from "@/app/actions/tasks";
import type { FormState } from "@/lib/validation";
import {
  TASK_CATEGORIES,
  CATEGORY_META,
  type TaskCategory,
  type TaskSubject,
} from "@/lib/types";
import { FREQUENCY_OPTIONS } from "@/lib/scheduling";
import { TASK_PRESET_GROUPS, type TaskPreset } from "@/lib/task-presets";
import { SubmitButton } from "./submit-button";

interface PetOption {
  id: string;
  name: string;
  avatar_emoji: string;
  species?: string;
}

export function AddTaskForm({
  pets,
  defaultPetId,
  lockPet = false,
  defaultSpecies,
  petSpecies = [],
}: {
  pets: PetOption[];
  defaultPetId?: string;
  lockPet?: boolean;
  defaultSpecies?: string;
  petSpecies?: string[];
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<TaskSubject>("pet");
  const [category, setCategory] = useState<TaskCategory>("other");
  const [frequency, setFrequency] = useState("1 day");
  const [petId, setPetId] = useState(defaultPetId ?? "");
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handle(formData: FormData) {
    const result: FormState = await createTask(formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setError(null);
    formRef.current?.reset();
    setTitle("");
    setSubject("pet");
    setCategory("other");
    setFrequency("1 day");
    setPetId(defaultPetId ?? "");
  }

  function applyPreset(preset: TaskPreset) {
    setTitle(preset.title);
    setSubject(preset.subject);
    setCategory(preset.category);
    setFrequency(preset.frequency);
    if (preset.subject === "pet") {
      setPetId(defaultPetId ?? "");
    }
  }

  const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <form ref={formRef} action={handle} className="flex flex-col gap-3">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        {TASK_PRESET_GROUPS.map((group) => {
          const presets = group.presets.filter((preset) => {
            if (lockPet) {
              return (
                preset.subject === "pet" &&
                (!preset.species ||
                  (defaultSpecies && preset.species.includes(defaultSpecies)))
              );
            }

            if (!preset.species) return true;
            return preset.species.some((species) => petSpecies.includes(species));
          });
          if (presets.length === 0) return null;

          return (
            <section key={group.title}>
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <span aria-hidden>{group.emoji}</span> {group.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {group.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-amber-950/30"
                  >
                    {CATEGORY_META[preset.category].emoji} {preset.title}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <input
        name="title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task (e.g. Evening walk)"
        className={inputClass}
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value as TaskSubject)}
          className={inputClass}
        >
          <option value="pet">For pet</option>
          <option value="human">For human</option>
        </select>

        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as TaskCategory)}
          className={inputClass}
        >
          {TASK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          name="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className={inputClass}
        >
          {FREQUENCY_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {subject === "pet" ? (
          lockPet && defaultPetId ? (
            <input type="hidden" name="pet_id" value={defaultPetId} />
          ) : (
            <select
              name="pet_id"
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              className={inputClass}
            >
              <option value="">No specific pet</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.avatar_emoji} {p.name}
                </option>
              ))}
            </select>
          )
        ) : null}
      </div>

      <SubmitButton
        pendingLabel="Adding…"
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Add task
      </SubmitButton>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </form>
  );
}
