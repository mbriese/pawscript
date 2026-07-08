import { completeTask, deleteTask } from "@/app/actions/tasks";
import { CATEGORY_META, type TaskWithPet } from "@/lib/types";
import { formatRelative, frequencyLabel, isOverdue } from "@/lib/scheduling";
import { SubmitButton } from "./submit-button";

export function TaskItem({
  task,
  showPet = false,
}: {
  task: TaskWithPet;
  showPet?: boolean;
}) {
  const meta = CATEGORY_META[task.category];
  const overdue = isOverdue(task.next_due_at);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition ${
        overdue
          ? "border-amber-300 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <form action={completeTask}>
        <input type="hidden" name="task_id" value={task.id} />
        {task.pet_id ? (
          <input type="hidden" name="pet_id" value={task.pet_id} />
        ) : null}
        <SubmitButton
          pendingLabel="…"
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-600 transition hover:bg-emerald-500 hover:text-white dark:text-emerald-400"
        >
          <span aria-hidden className="text-lg leading-none">✓</span>
        </SubmitButton>
      </form>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span aria-hidden>{meta.emoji}</span>
          <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
            {task.title}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              task.subject === "human"
                ? "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
                : "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
            }`}
          >
            {task.subject}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {showPet && task.pet ? (
            <span>
              {task.pet.avatar_emoji} {task.pet.name}
            </span>
          ) : null}
          <span>{frequencyLabel(task.frequency)}</span>
          <span aria-hidden>·</span>
          <span className={overdue ? "font-semibold text-amber-600 dark:text-amber-400" : ""}>
            {overdue ? "overdue" : `due ${formatRelative(task.next_due_at)}`}
          </span>
        </div>
      </div>

      <form action={deleteTask}>
        <input type="hidden" name="task_id" value={task.id} />
        {task.pet_id ? (
          <input type="hidden" name="pet_id" value={task.pet_id} />
        ) : null}
        <SubmitButton
          pendingLabel="…"
          className="rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
        >
          Remove
        </SubmitButton>
      </form>
    </div>
  );
}
