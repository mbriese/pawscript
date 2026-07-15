type PetLike = {
  name: string;
  species: string;
};

type EventSeverity = "info" | "notice" | "alert" | "emergency";

type RandomEvent = {
  title: string;
  body: string;
  severity: EventSeverity;
};

const eventsBySpecies: Record<string, RandomEvent[]> = {
  cat: [
    {
      title: "Sunbeam acquired",
      body: "A premium sunbeam was secured. Morale is high and nap quality is elite.",
      severity: "notice",
    },
    {
      title: "Countertop anomaly",
      body: "Something suspicious happened near the snacks. Investigation ongoing.",
      severity: "alert",
    },
  ],
  dog: [
    {
      title: "Neighborhood patrol complete",
      body: "All sidewalks checked. Zero squirrels negotiated with today.",
      severity: "notice",
    },
    {
      title: "Unexpected zoomies",
      body: "High-speed laps initiated without warning. Furniture remained intact.",
      severity: "info",
    },
  ],
  horse: [
    {
      title: "Trail confidence upgraded",
      body: "A new route was tested successfully. Spirits are adventurous.",
      severity: "notice",
    },
    {
      title: "Gate diplomacy needed",
      body: "A gate appears emotionally under-managed. Requesting human supervision.",
      severity: "alert",
    },
  ],
  default: [
    {
      title: "Routine check-in",
      body: "Everything appears stable. Snacks remain strategically important.",
      severity: "info",
    },
    {
      title: "Mild chaos detected",
      body: "A small mystery is unfolding. Confidence remains high.",
      severity: "notice",
    },
  ],
};

export function createRandomEvent(pet: PetLike): RandomEvent {
  const speciesKey = pet.species.trim().toLowerCase();
  const pool = eventsBySpecies[speciesKey] ?? eventsBySpecies.default;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  return {
    title: `${pet.name}: ${chosen.title}`,
    body: chosen.body,
    severity: chosen.severity,
  };
}
