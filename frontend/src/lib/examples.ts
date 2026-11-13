export type Example = {
  id: string;
  label: string;
  text: string;
};

export const EXAMPLES: readonly Example[] = [
  {
    id: "dump",
    label: "Course demo",
    text: "I took a massive dump just now",
  },
  {
    id: "bus",
    label: "Mundane",
    text: "I was late because I missed the bus.",
  },
  {
    id: "reply-all",
    label: "Embarrassing",
    text: "I replied all to an email I should not have sent.",
  },
  {
    id: "deadline",
    label: "Professional",
    text: "The deadline moved and I need another day.",
  },
  {
    id: "meeting",
    label: "Meeting",
    text: "I have no idea what anyone is talking about in this meeting.",
  },
];
