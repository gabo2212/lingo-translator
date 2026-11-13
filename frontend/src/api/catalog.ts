import type { StyleOption } from "./types";

export const FALLBACK_STYLES: readonly StyleOption[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "A professional costume. The sentence survives; the humility might not.",
    substyles: [
      { id: "motivational", label: "Motivational" },
      { id: "humble_brag", label: "Humble Brag" },
      { id: "thought_leader", label: "Thought Leader" },
      { id: "inspirational", label: "Inspirational Story" },
      { id: "corporate", label: "Corporate Jargon" },
    ],
  },
  {
    id: "chatgpt",
    label: "ChatGPT Speak",
    description: "An over-eager assistant. Lists, em dashes, reassurance, and an offer you did not ask for.",
    substyles: null,
  },
  {
    id: "corporate",
    label: "Corporate Speak",
    description: "An internal memo. Passive voice, workflows, and no hashtags.",
    substyles: null,
  },
  {
    id: "hr",
    label: "HR Speak",
    description: "A note several reviewers already sanded. The act stays; the blame does not.",
    substyles: null,
  },
  {
    id: "brainrot",
    label: "Brainrot Speak",
    description: "The event, scored in slang. Unrelated memes are a failed rewrite.",
    substyles: null,
  },
];
