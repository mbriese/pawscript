import "server-only";
import OpenAI from "openai";
import { pickRandomEvent, severityLabel, type RandomEvent } from "./random-events";
import type { AlertKind, EventSeverity, Pet } from "./types";

const MODEL = "gpt-4o-mini";

export interface PetContext {
  overdueTitles: string[];
  recentDoneTitles: string[];
  streakDays: number;
}

export interface GeneratedAlert {
  kind: AlertKind;
  title: string;
  body: string;
  severity?: EventSeverity;
}

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function voiceSystemPrompt(pet: Pet): string {
  return [
    `You are ${pet.name}, a ${pet.breed ? `${pet.breed} ` : ""}${pet.species}.`,
    `Personality and voice: ${pet.personality}`,
    pet.nemesis ? `Recurring nemesis/worries: ${pet.nemesis}` : "",
    pet.quirks ? `Quirks and habits: ${pet.quirks}` : "",
    "You are writing a short in-character dispatch to your human.",
    "Stay fully in character. Be witty and concise. Never break character or mention that you are an AI.",
    "Do not use markdown, headings, or bullet points. Return 1-3 short sentences of plain prose.",
  ]
    .filter(Boolean)
    .join(" ");
}

const NEMESIS_SUBJECTS = [
  "a squirrel conducting unauthorized surveillance from the fence",
  "the mouse that continues to evade the perimeter patrol",
  "a suspicious mail carrier with unknown intentions",
  "the neighbor's cat loitering near the property line",
  "an unidentified bird performing reconnaissance flights",
  "a plastic bag exhibiting hostile movement in the wind",
  "the vacuum cleaner, a known and persistent adversary",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Templated fallbacks so the app works with no OpenAI key ------------------

function fallbackReport(pet: Pet, ctx: PetContext): GeneratedAlert {
  const overdue = ctx.overdueTitles.length
    ? `The following items remain outstanding: ${ctx.overdueTitles.join(
        ", "
      )}.`
    : "All logged protocols are, for once, current.";
  const done = ctx.recentDoneTitles.length
    ? ` Recently executed: ${ctx.recentDoneTitles.slice(0, 3).join(", ")}.`
    : "";
  return {
    kind: "report",
    title: "Status Report",
    body: `Per my records, a review of household operations has been conducted. ${overdue}${done} This concludes the report. Filed by ${pet.name}.`,
  };
}

function fallbackNemesis(pet: Pet): GeneratedAlert {
  const subject = pick(
    pet.nemesis
      ? pet.nemesis
          .split(/[,.;\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : NEMESIS_SUBJECTS
  );
  return {
    kind: "nemesis",
    title: "Nemesis Dispatch",
    body: `Be advised: ${subject} has been sighted. I have logged the incident and maintained visual contact for the appropriate duration. ${pet.quirks ? `Relevant behavioral note: ${pet.quirks}` : "The situation remains under my control."} — ${pet.name}`,
  };
}

function fallbackPraise(pet: Pet, ctx: PetContext): GeneratedAlert {
  return {
    kind: "praise",
    title: "Commendation on File",
    body: `Your ${ctx.streakDays}-day streak of compliance has been noted and, against my better judgment, approved. Continue as you were. — ${pet.name}`,
  };
}

function fallbackEvent(pet: Pet, event: RandomEvent): GeneratedAlert {
  if (pet.name === "Dug" && event.title.toLowerCase().includes("squirrel")) {
    return {
      kind: "event",
      severity: event.severity,
      title: event.title,
      body: "AMAZING NEWS! SQUIRREL! It was right there! I investigated thoroughly! I would like to investigate again immediately.",
    };
  }

  if (pet.name === "Alpha") {
    return {
      kind: "event",
      severity: event.severity,
      title: event.title,
      body: `${severityLabel(event.severity)}: ${event.title}. Situation logged under ${event.category}. Countermeasures initiated and vigilance remains mandatory.`,
    };
  }

  const quirk = pet.quirks ? ` ${pet.quirks}` : "";
  return {
    kind: "event",
    severity: event.severity,
    title: event.title,
    body: `${severityLabel(event.severity)}: ${event.title}. ${pet.name} has filed this under ${event.category}.${quirk}`,
  };
}

async function generate(
  pet: Pet,
  kind: AlertKind,
  userPrompt: string,
  fallback: GeneratedAlert
): Promise<GeneratedAlert> {
  const client = getClient();
  if (!client) return fallback;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.9,
      max_tokens: 220,
      messages: [
        { role: "system", content: voiceSystemPrompt(pet) },
        { role: "user", content: userPrompt },
      ],
    });
    const body = completion.choices[0]?.message?.content?.trim();
    if (!body) return fallback;
    return { kind, title: fallback.title, body };
  } catch {
    return fallback;
  }
}

export async function generateReport(
  pet: Pet,
  ctx: PetContext
): Promise<GeneratedAlert> {
  const prompt = [
    "Write a dry, bureaucratic status report about the household's care tasks.",
    ctx.overdueTitles.length
      ? `Overdue items: ${ctx.overdueTitles.join(", ")}.`
      : "Nothing is currently overdue.",
    ctx.recentDoneTitles.length
      ? `Recently completed: ${ctx.recentDoneTitles.join(", ")}.`
      : "",
    'Example tone: "Per my records, the medication protocol has not been executed."',
  ]
    .filter(Boolean)
    .join(" ");
  return generate(pet, "report", prompt, fallbackReport(pet, ctx));
}

export async function generateNemesis(pet: Pet): Promise<GeneratedAlert> {
  const prompt = pet.nemesis
    ? `Write a short surveillance dispatch about one of this pet's recurring nemesis or worries: ${pet.nemesis}. Include one relevant quirk if useful: ${pet.quirks ?? "none"}. Treat it as a serious security matter.`
    : `Write a short surveillance dispatch reporting a sighting of ${pick(
        NEMESIS_SUBJECTS
      )}. Treat it as a serious security matter.`;
  return generate(pet, "nemesis", prompt, fallbackNemesis(pet));
}

export async function generatePraise(
  pet: Pet,
  ctx: PetContext
): Promise<GeneratedAlert> {
  const prompt = `The human has kept a ${ctx.streakDays}-day streak of completing care tasks. Grudgingly praise them, in character.`;
  return generate(pet, "praise", prompt, fallbackPraise(pet, ctx));
}

export async function generateRandomEvent(pet: Pet): Promise<GeneratedAlert> {
  const event = pickRandomEvent(pet);
  const fallback = fallbackEvent(pet, event);
  const prompt = [
    `A random pet event occurred: ${event.title}.`,
    `Event category: ${event.category}.`,
    `Severity: ${event.severity}.`,
    "Write the pet's in-character reaction/report.",
    "Keep it short, funny, and specific to the pet personality.",
  ].join(" ");

  const generated = await generate(pet, "event", prompt, fallback);
  return { ...generated, title: event.title, severity: event.severity };
}
