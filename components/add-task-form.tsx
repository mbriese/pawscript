"use client";

import { useRef, useState } from "react";
import { createTask } from "@/app/actions/tasks";
import type { FormState } from "@/lib/validation";
import { TASK_CATEGORIES, CATEGORY_META, type TaskSubject } from "@/lib/types";
import { FREQUENCY_OPTIONS } from "@/lib/scheduling";
import { SubmitButton } from "./submit-button";

interface PetOption {
  id: string;
  name: string;
  avatar_emoji: string;
}

export function AddTaskForm({
  pets,
  defaultPetId,
  lockPet = false,
}: {
  pets: PetOption[];
  defaultPetId?: string;
  lockPet?: boolean;
}) {
  const [subject, setSubject] = useState<TaskSubject>("pet");
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
    setSubject("pet");
  }

  const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <form ref={formRef} action={handle} className="flex flex-col gap-3">
      <input
        name="title"
        required
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

        <select name="category" defaultValue="other" className={inputClass}>
          {TASK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select name="frequency" defaultValue="1 day" className={inputClass}>
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
              defaultValue={defaultPetId ?? ""}
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
