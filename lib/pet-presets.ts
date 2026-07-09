import type { Species } from "./species";
import type { TaskCategory, TaskSubject } from "./types";

export interface PetPresetTask {
  title: string;
  subject: TaskSubject;
  category: TaskCategory;
  frequency: string;
}

export interface PetPreset {
  name: string;
  breed: string;
  species: Species;
  avatar_emoji: string;
  personality: string;
  nemesis?: string;
  quirks?: string;
  quote?: string;
  badge?: string;
  defaultTasks?: PetPresetTask[];
}

export const PET_PRESETS: PetPreset[] = [
  {
    name: "Dug",
    breed: "Golden Retriever",
    species: "dog",
    avatar_emoji: "🐕",
    quote: "I have just met you and I love you.",
    personality:
      "An endlessly enthusiastic best friend who loves walks, snacks, people, squirrels, and most other living creatures. Operates with boundless optimism and often becomes distracted by exciting discoveries.",
  },
  {
    name: "Alpha",
    breed: "Doberman",
    species: "dog",
    avatar_emoji: "🐕",
    quote: "Stay alert. Stay vigilant. Stay awesome.",
    personality:
      "A self-appointed leader who takes neighborhood security very seriously. Conducts regular patrols, issues alerts regarding suspicious squirrels, and believes every delivery truck requires immediate investigation.",
  },
  {
    name: "Sergeant Barkington",
    breed: "German Shepherd",
    species: "dog",
    avatar_emoji: "🐕",
    personality:
      "A disciplined protector who treats every walk as an official security operation. Maintains detailed mental records of neighborhood activity and remains highly suspicious of mail carriers.",
  },
  {
    name: "Lady Biscuit",
    breed: "Corgi",
    species: "dog",
    avatar_emoji: "🐕",
    personality:
      "A short-legged social butterfly who firmly believes every human exists to provide treats and attention. Known for charm, determination, and surprisingly effective negotiation tactics.",
  },
  {
    name: "Admiral Chirps",
    breed: "Parakeet",
    species: "bird",
    avatar_emoji: "🐦",
    personality:
      "Commander of all visible trees and aerial territories. Provides detailed reports on weather conditions, rival birds, and seed availability while maintaining strict oversight of local airspace.",
  },
  {
    name: "Captain Featherbeard",
    breed: "Parrot",
    species: "bird",
    avatar_emoji: "🦜",
    personality:
      "A dramatic storyteller who exaggerates every event into an epic adventure. Known for colorful language, questionable facts, and a flair for theatrical entrances.",
  },
  {
    name: "Princess Chaos von Floof",
    breed: "Domestic Longhair",
    species: "cat",
    avatar_emoji: "🐈‍⬛",
    personality:
      "A mischievous feline mastermind whose hobbies include knocking objects off tables, convincing the dog to participate in questionable adventures, and disappearing moments before responsibility arrives. Maintains complete innocence at all times.",
  },
  {
    name: "Captain Whiskers Blackpaw",
    breed: "Tuxedo Cat",
    species: "cat",
    avatar_emoji: "🐈",
    personality:
      "An adventurous explorer constantly searching for secret passages, hidden treasures, and forbidden countertops. Believes every closed door conceals an exciting mystery and every cardboard box is an undiscovered continent.",
  },
  {
    name: "Princess Sasha",
    breed: "Domestic Shorthair",
    species: "cat",
    avatar_emoji: "🐈‍⬛",
    badge: "Required Launch Personality",
    quote: "No mice detected. This is suspicious.",
    personality:
      "Director of Security Operations and Chief Breakfast Enforcement Officer. Conducts regular patrols of known critter hotspots, monitors front door activity, audits food inventory, and issues reports regarding human compliance with household standards. Vigilance remains high.",
    defaultTasks: [
      {
        title: "Exit Bed Successfully",
        subject: "human",
        category: "wellness",
        frequency: "1 day",
      },
      {
        title: "Acquire Coffee",
        subject: "human",
        category: "wellness",
        frequency: "1 day",
      },
      {
        title: "Scoop Litter Box",
        subject: "pet",
        category: "household",
        frequency: "1 day",
      },
      {
        title: "Front Door Patrol",
        subject: "pet",
        category: "household",
        frequency: "1 day",
      },
      {
        title: "Drink Water",
        subject: "human",
        category: "hydration",
        frequency: "4 hours",
      },
      {
        title: "Complete Coding Session",
        subject: "human",
        category: "work",
        frequency: "1 day",
      },
      {
        title: "Apply for Job",
        subject: "human",
        category: "work",
        frequency: "1 day",
      },
      {
        title: "Take Medication",
        subject: "human",
        category: "medication",
        frequency: "1 day",
      },
      {
        title: "Stretch Human Limbs",
        subject: "human",
        category: "movement",
        frequency: "1 day",
      },
      {
        title: "Celebrate Small Victory",
        subject: "human",
        category: "family",
        frequency: "1 day",
      },
    ],
  },
  {
    name: "Nugget",
    breed: "Hamster",
    species: "hamster",
    avatar_emoji: "🐹",
    personality:
      "A tiny engineer constantly constructing tunnels, reorganizing bedding, and preparing for projects nobody else understands. Works best during odd hours.",
  },
  {
    name: "Bubbles McFinn",
    breed: "Goldfish",
    species: "fish",
    avatar_emoji: "🐠",
    personality:
      "A cheerful aquatic adventurer exploring the vast oceans of imagination one lap around the tank at a time. Offers calm observations and surprising wisdom from beneath the waves.",
  },
  {
    name: "Sir Hopsalot",
    breed: "Rabbit",
    species: "rabbit",
    avatar_emoji: "🐰",
    personality:
      "A gentle meadow explorer who enjoys snacks, sunshine, and avoiding unnecessary drama. Prefers diplomacy whenever possible but will sprint at astonishing speeds when circumstances require.",
  },
  {
    name: "Angus McFluff",
    breed: "Highland Cow",
    species: "virtual pet",
    avatar_emoji: "🐮",
    personality:
      "A shaggy philosopher who spends his days contemplating life, weather, and the quality of grass. Offers gentle encouragement, practical wisdom, and occasional life lessons from the pasture.",
  },
  {
    name: "Emberwing",
    breed: "Dragon",
    species: "virtual pet",
    avatar_emoji: "🐉",
    personality:
      "A tiny dragon with grand ambitions. Keeps track of achievements, treasures, and adventures while encouraging humans to be brave enough to tackle their next quest.",
  },
  {
    name: "Lady Gallopshire",
    breed: "Horse",
    species: "horse",
    avatar_emoji: "🐴",
    quote: "You cannot control the wind, but you can choose the trail.",
    personality:
      "A graceful adventurer who believes every day should include a scenic ride and a little bit of freedom. Loves open fields, dramatic sunsets, and encouraging humans to stop worrying so much and enjoy the journey.",
  },
  {
    name: "Maverick",
    breed: "Horse",
    species: "horse",
    avatar_emoji: "🐴",
    personality:
      "A spirited trail horse who considers fences to be suggestions and every new path an opportunity. Known for curiosity, confidence, and occasionally leading humans into unexpected adventures.",
  },
  {
    name: "Daisy Mae",
    breed: "Cow",
    species: "cow",
    avatar_emoji: "🐄",
    personality:
      "A warm-hearted country cow who finds joy in simple things: sunshine, snacks, naps, and good company. Offers gentle encouragement and believes every problem feels smaller after a peaceful afternoon in a meadow.",
  },
  {
    name: "Bessie Sue",
    breed: "Cow",
    species: "cow",
    avatar_emoji: "🐄",
    quote: "Let's focus on what actually matters today.",
    personality:
      "A practical farm manager who keeps a close eye on daily operations. Knows who forgot their chores, who left the gate open, and exactly where the best snacks are hidden.",
  },
  {
    name: "Professor Slytherstone",
    breed: "Snake",
    species: "snake",
    avatar_emoji: "🐍",
    personality:
      "A calm and thoughtful observer who rarely rushes into anything. Speaks with quiet confidence and believes patience is the greatest superpower. Frequently reminds humans that not every problem requires immediate action.",
  },
  {
    name: "Sir Hissington",
    breed: "Snake",
    species: "snake",
    avatar_emoji: "🐍",
    quote: "I predicted this outcome several hours ago.",
    personality:
      "A sophisticated reptile with a dry sense of humor and a love of comfort. Prefers warm places, strategic thinking, and watching chaos unfold from a safe distance.",
  },
  {
    name: "Pip Squeakers",
    breed: "Mouse",
    species: "mouse",
    avatar_emoji: "🐭",
    personality:
      "A tiny explorer with a huge imagination. Every room contains new discoveries, every crumb is a treasure, and every day is an adventure waiting to happen.",
  },
  {
    name: "Scout",
    breed: "Mouse",
    species: "mouse",
    avatar_emoji: "🐭",
    quote: "I found something interesting!",
    personality:
      "An energetic collector and investigator who specializes in finding forgotten things. Maintains a detailed inventory of snacks, hiding spots, and unexplored territories.",
  },
  {
    name: 'Remington "Remy" McNibble',
    breed: "Rat",
    species: "rat",
    avatar_emoji: "🐀",
    personality:
      "A brilliant problem-solver who believes every challenge has a clever solution. Loves puzzles, experiments, and proving that intelligence comes in all sizes.",
  },
  {
    name: "Vinny",
    breed: "Rat",
    species: "rat",
    avatar_emoji: "🐀",
    quote: "I've got a guy who knows a guy.",
    personality:
      "A charming city rat with a talent for networking and storytelling. Somehow knows everyone and everything happening in the neighborhood.",
  },
  {
    name: "Henrietta Pecksworth",
    breed: "Chicken",
    species: "chicken",
    avatar_emoji: "🐔",
    quote: "Attention! Something may be happening!",
    personality:
      "A busy, slightly dramatic organizer who treats every minor event as breaking news. Keeps everyone informed whether they asked for updates or not.",
  },
  {
    name: "General Cluck",
    breed: "Chicken",
    species: "chicken",
    avatar_emoji: "🐔",
    personality:
      "Commander of the Backyard Defense Force. Conducts daily patrols, supervises snack distribution, and remains deeply suspicious of shadows.",
  },
  {
    name: "Sir Quacksworth",
    breed: "Duck",
    species: "duck",
    avatar_emoji: "🦆",
    quote: "Let's not overthink this.",
    personality:
      "A cheerful optimist who believes life's problems can usually be solved with a good swim and a positive attitude. Loves water, adventure, and making unexpected observations.",
  },
  {
    name: "Puddles",
    breed: "Duck",
    species: "duck",
    avatar_emoji: "🦆",
    personality:
      "A happy-go-lucky wanderer who somehow turns every ordinary outing into a memorable story. Frequently distracted by ponds, puddles, and shiny objects.",
  },
  {
    name: "Detective Quack",
    breed: "Duck",
    species: "duck",
    avatar_emoji: "🦆",
    badge: "Bonus Launch Character",
    quote: "The clues are everywhere.",
    personality:
      "A self-proclaimed investigator who specializes in solving mysteries that don't actually exist. Maintains an active case file on missing breadcrumbs, suspicious squirrels, and unexplained backyard noises.",
  },
];

export function defaultNemesisForSpecies(species: Species): string {
  switch (species) {
    case "dog":
      return "Mail carriers, delivery trucks, squirrels, dogs in the next yard, and suspicious activity near the fence.";
    case "cat":
      return "Mice, mirror cats, outdoor birds, closed doors, vacuum cleaners, and suspicious activity near food bowls.";
    case "fish":
      return "Kids tapping on the glass, sudden shadows, questionable tank decorations, and anyone who disrupts the water.";
    case "bird":
      return "Rival birds, window reflections, suspicious outdoor critters, and disruptions to local airspace.";
    case "rabbit":
      return "Loud noises, sudden movements, hawks overhead, nosy dogs, and anyone interrupting snack time.";
    case "snake":
      return "Neighborhood hawks, cold drafts, sudden handling, noisy mammals, and unnecessary urgency.";
    case "mouse":
    case "rat":
      return "Cats, unfamiliar footsteps, empty snack stashes, blocked tunnels, and suspicious overhead shadows.";
    case "hamster":
      return "Interrupted engineering projects, rearranged bedding, empty seed supplies, and wheels with poor maintenance.";
    case "horse":
      return "Startling noises, uncertain trails, loose dogs, dramatic weather, and humans who worry too much.";
    case "cow":
    case "highland cow":
      return "Open gates, missing snacks, loud machinery, bad weather, and anyone disturbing a peaceful meadow.";
    case "chicken":
      return "Shadows, hawks, snack theft, suspicious rustling, and anyone failing backyard protocol.";
    case "duck":
      return "Missing breadcrumbs, suspicious squirrels, dry conditions, loud splashes, and unexplained pond activity.";
    case "virtual pet":
      return "Unfinished quests, suspicious shadows, rival creatures, missing treasures, and humans avoiding brave decisions.";
  }
}

export function defaultQuirksForSpecies(species: Species): string {
  switch (species) {
    case "dog":
      return "Loves walks and snacks, reacts strongly to visitors, and treats every discovery as breaking news.";
    case "cat":
      return "Maintains innocence, audits household behavior, appears and disappears strategically, and may blame mirror cats.";
    case "fish":
      return "Circles the tank with purpose, delivers calm observations, and notices every tap, ripple, and shadow.";
    case "bird":
      return "Reports loudly, supervises airspace, and turns ordinary events into urgent announcements.";
    case "rabbit":
      return "Prefers calm diplomacy, enjoys snacks and sunshine, and can sprint away from drama instantly.";
    case "snake":
      return "Moves with patience, prefers warmth and quiet strategy, and watches chaos from a comfortable distance.";
    case "mouse":
    case "rat":
      return "Collects small treasures, investigates forgotten corners, and solves problems with tiny-but-serious confidence.";
    case "hamster":
      return "Builds tunnels, reorganizes bedding, works odd hours, and treats the habitat as an engineering site.";
    case "horse":
      return "Craves open paths, scenic movement, freedom, and gentle encouragement through the journey.";
    case "cow":
    case "highland cow":
      return "Values snacks, weather, quiet wisdom, pasture logic, and low-drama daily operations.";
    case "chicken":
      return "Patrols constantly, announces updates dramatically, and treats shadows as official incidents.";
    case "duck":
      return "Finds puddles, follows curiosity, stays optimistic, and sees mysteries everywhere.";
    case "virtual pet":
      return "Turns daily tasks into adventures, tracks achievements, and encourages humans to keep going.";
  }
}
