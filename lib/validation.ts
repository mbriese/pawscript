import { z } from "zod";
import { TASK_CATEGORIES } from "./types";
import { FREQUENCY_OPTIONS } from "./scheduling";

export type FormState = { error: string | null; message?: string } | null;

/** Returns the first Zod issue message, or a generic fallback. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

const frequencyValues = FREQUENCY_OPTIONS.map((f) => f.value) as [
  string,
  ...string[],
];

// User-generated content -----------------------------------------------------

export const petSchema = z.object({
  name: z.string().trim().min(1, "Please enter a name.").max(60, "Name is too long (60 max)."),
  species: z.string().trim().min(1, "Species is required.").max(40, "Species is too long."),
  breed: z.string().trim().max(60, "Breed is too long.").optional().or(z.literal("")),
  avatar_emoji: z.string().trim().min(1).max(8, "Pick a single emoji."),
  personality: z
    .string()
    .trim()
    .min(1, "Give your pet a personality.")
    .max(600, "Personality is too long (600 max)."),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Task needs a title.").max(120, "Title is too long (120 max)."),
  subject: z.enum(["pet", "human"]),
  category: z.enum(TASK_CATEGORIES as [string, ...string[]]),
  frequency: z.enum(frequencyValues),
  pet_id: z.uuid().optional().or(z.literal("")),
});

export const completeTaskSchema = z.object({
  task_id: z.uuid("Invalid task."),
  pet_id: z.uuid().optional().or(z.literal("")),
  note: z.string().trim().max(300, "Note is too long (300 max).").optional().or(z.literal("")),
});

export const idSchema = z.uuid();

// Auth -----------------------------------------------------------------------

export const emailSchema = z.email("Enter a valid email address.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

const STRONG_PASSWORD_MESSAGE =
  "Password must be at least 12 characters and include upper- and lower-case letters, a number, and a symbol.";

export const strongPasswordSchema = z
  .string()
  .min(12, STRONG_PASSWORD_MESSAGE)
  .max(128, "Password is too long.")
  .refine((v) => /[a-z]/.test(v), STRONG_PASSWORD_MESSAGE)
  .refine((v) => /[A-Z]/.test(v), STRONG_PASSWORD_MESSAGE)
  .refine((v) => /[0-9]/.test(v), STRONG_PASSWORD_MESSAGE)
  .refine((v) => /[^A-Za-z0-9]/.test(v), STRONG_PASSWORD_MESSAGE);

export const signUpSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
});

export const mfaCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app."),
});
