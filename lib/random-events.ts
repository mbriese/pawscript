import type { EventSeverity, Pet } from "./types";

export interface RandomEvent {
  title: string;
  severity: EventSeverity;
  category: string;
}

const CAT_EVENTS: RandomEvent[] = [
  { title: "Mouse Detected", severity: "alert", category: "Critter Events" },
  { title: "Bird Spotted", severity: "info", category: "Critter Events" },
  { title: "Suspicious Rustling Heard", severity: "notice", category: "Critter Events" },
  { title: "Unknown Shadow Investigated", severity: "notice", category: "Critter Events" },
  { title: "Front Door Activity Observed", severity: "notice", category: "Critter Events" },
  { title: "Lizard Encounter", severity: "notice", category: "Critter Events" },
  { title: "Insect Sighting", severity: "info", category: "Critter Events" },
  { title: "Critter Escaped Capture", severity: "alert", category: "Critter Events" },
  { title: "Food Bowl Refilled", severity: "info", category: "Household Events" },
  { title: "Food Bowl Alarmingly Low", severity: "notice", category: "Household Events" },
  { title: "Human Sleeping In", severity: "notice", category: "Household Events" },
  { title: "Human Returned Home", severity: "info", category: "Household Events" },
  { title: "New Box Arrived", severity: "info", category: "Household Events" },
  { title: "New Furniture Appeared", severity: "notice", category: "Household Events" },
  { title: "Vacuum Activated", severity: "alert", category: "Household Events" },
  { title: "Door Left Open", severity: "alert", category: "Household Events" },
];

const SASHA_EVENTS: RandomEvent[] = [
  { title: "Patrol Route Completed", severity: "info", category: "Sasha-Specific Events" },
  { title: "Security Sweep Successful", severity: "info", category: "Sasha-Specific Events" },
  { title: "Human Compliance Acceptable", severity: "info", category: "Sasha-Specific Events" },
  { title: "Breakfast Delayed", severity: "emergency", category: "Sasha-Specific Events" },
  { title: "Window Surveillance Initiated", severity: "notice", category: "Sasha-Specific Events" },
  { title: "Mouse Not Found (Suspicious)", severity: "notice", category: "Sasha-Specific Events" },
];

const DOG_EVENTS: RandomEvent[] = [
  { title: "Squirrel Spotted", severity: "emergency", category: "Rival Events" },
  { title: "UPS Truck Detected", severity: "alert", category: "Rival Events" },
  { title: "Mail Carrier Approaching", severity: "emergency", category: "Rival Events" },
  { title: "Dog Across Street Barking", severity: "notice", category: "Rival Events" },
  { title: "Cat Entered Territory", severity: "alert", category: "Rival Events" },
  { title: "Unknown Person Passing House", severity: "notice", category: "Rival Events" },
  { title: "Walk Completed", severity: "info", category: "Adventure Events" },
  { title: "Car Ride Initiated", severity: "info", category: "Adventure Events" },
  { title: "Ball Located", severity: "info", category: "Adventure Events" },
  { title: "Ball Lost", severity: "notice", category: "Adventure Events" },
  { title: "Treat Acquired", severity: "info", category: "Adventure Events" },
  { title: "Mud Encounter", severity: "notice", category: "Adventure Events" },
];

const DUG_EVENTS: RandomEvent[] = [
  { title: "New Friend Discovered", severity: "info", category: "Dug Events" },
  { title: "Human Returned Home", severity: "info", category: "Dug Events" },
  { title: "Squirrel Excitement Level Critical", severity: "emergency", category: "Dug Events" },
];

const ALPHA_EVENTS: RandomEvent[] = [
  { title: "Perimeter Breach Suspected", severity: "alert", category: "Alpha Events" },
  { title: "Security Patrol Completed", severity: "info", category: "Alpha Events" },
  { title: "Threat Assessment Updated", severity: "notice", category: "Alpha Events" },
];

const EVENTS_BY_SPECIES: Record<string, RandomEvent[]> = {
  bird: [
    { title: "Tree Successfully Claimed", severity: "info", category: "Bird Events" },
    { title: "Rival Bird Challenged Territory", severity: "notice", category: "Bird Events" },
    { title: "Seed Discovery", severity: "info", category: "Bird Events" },
    { title: "Nest Upgrade", severity: "info", category: "Bird Events" },
    { title: "Weather Alert", severity: "notice", category: "Bird Events" },
    { title: "Human Watching Bird TV", severity: "info", category: "Bird Events" },
  ],
  fish: [
    { title: "Bubble Activity Increased", severity: "info", category: "Fish Events" },
    { title: "Decorative Plant Investigation", severity: "info", category: "Fish Events" },
    { title: "New Tank Object Appeared", severity: "notice", category: "Fish Events" },
    { title: "Ocean Adventure Dream", severity: "info", category: "Fish Events" },
  ],
  horse: [
    { title: "Trail Ride Completed", severity: "info", category: "Horse Events" },
    { title: "Fence Inspection", severity: "notice", category: "Horse Events" },
    { title: "Carrot Acquired", severity: "info", category: "Horse Events" },
    { title: "Windy Day Alert", severity: "notice", category: "Horse Events" },
    { title: "New Pasture Explored", severity: "info", category: "Horse Events" },
  ],
  cow: [
    { title: "Grass Quality Excellent", severity: "info", category: "Cow Events" },
    { title: "Grass Quality Concerning", severity: "notice", category: "Cow Events" },
    { title: "Meadow Patrol", severity: "info", category: "Cow Events" },
    { title: "Human Appears Stressed", severity: "notice", category: "Cow Events" },
    { title: "Cloud Observation Session", severity: "info", category: "Cow Events" },
  ],
  "highland cow": [
    { title: "Grass Quality Excellent", severity: "info", category: "Cow Events" },
    { title: "Grass Quality Concerning", severity: "notice", category: "Cow Events" },
    { title: "Meadow Patrol", severity: "info", category: "Cow Events" },
    { title: "Human Appears Stressed", severity: "notice", category: "Cow Events" },
    { title: "Cloud Observation Session", severity: "info", category: "Cow Events" },
  ],
  snake: [
    { title: "Warm Spot Located", severity: "info", category: "Snake Events" },
    { title: "Temperature Optimal", severity: "info", category: "Snake Events" },
    { title: "Human Making Excessive Noise", severity: "notice", category: "Snake Events" },
    { title: "Strategic Observation Mode Activated", severity: "info", category: "Snake Events" },
  ],
  mouse: [
    { title: "Crumb Located", severity: "info", category: "Mouse Events" },
    { title: "New Tunnel Discovered", severity: "info", category: "Mouse Events" },
    { title: "Adventure Successful", severity: "info", category: "Mouse Events" },
    { title: "Cat Activity Detected", severity: "alert", category: "Mouse Events" },
  ],
  rat: [
    { title: "Puzzle Solved", severity: "info", category: "Rat Events" },
    { title: "Snack Acquired", severity: "info", category: "Rat Events" },
    { title: "New Route Mapped", severity: "info", category: "Rat Events" },
    { title: "Research Project Complete", severity: "info", category: "Rat Events" },
  ],
  chicken: [
    { title: "Bug Found", severity: "info", category: "Chicken Events" },
    { title: "Bug Escaped", severity: "notice", category: "Chicken Events" },
    { title: "Egg Produced", severity: "info", category: "Chicken Events" },
    { title: "Backyard Disturbance", severity: "alert", category: "Chicken Events" },
    { title: "Important Announcement", severity: "notice", category: "Chicken Events" },
  ],
  duck: [
    { title: "Puddle Located", severity: "info", category: "Duck Events" },
    { title: "Pond Visit Approved", severity: "info", category: "Duck Events" },
    { title: "Breadcrumb Discovery", severity: "info", category: "Duck Events" },
    { title: "Mystery Investigated", severity: "notice", category: "Duck Events" },
  ],
  hamster: [
    { title: "New Tunnel Discovered", severity: "info", category: "Hamster Events" },
    { title: "Wheel Activity Increased", severity: "info", category: "Hamster Events" },
    { title: "Bedding Reorganized", severity: "info", category: "Hamster Events" },
  ],
  rabbit: [
    { title: "Snack Patch Located", severity: "info", category: "Rabbit Events" },
    { title: "Drama Successfully Avoided", severity: "info", category: "Rabbit Events" },
    { title: "Sudden Sprint Initiated", severity: "notice", category: "Rabbit Events" },
  ],
  "virtual pet": [
    { title: "Quest Log Updated", severity: "info", category: "Virtual Pet Events" },
    { title: "Treasure Inventory Audited", severity: "info", category: "Virtual Pet Events" },
    { title: "Adventure Opportunity Detected", severity: "notice", category: "Virtual Pet Events" },
  ],
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function pickRandomEvent(pet: Pet): RandomEvent {
  const events = [
    ...(pet.species === "cat" ? CAT_EVENTS : []),
    ...(pet.species === "dog" ? DOG_EVENTS : []),
    ...(pet.name === "Princess Sasha" ? SASHA_EVENTS : []),
    ...(pet.name === "Dug" ? DUG_EVENTS : []),
    ...(pet.name === "Alpha" ? ALPHA_EVENTS : []),
    ...(EVENTS_BY_SPECIES[pet.species] ?? []),
  ];

  return pick(events.length ? events : CAT_EVENTS);
}

export function severityLabel(severity: EventSeverity): string {
  return severity.toUpperCase();
}
