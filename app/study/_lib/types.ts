export type Section = { heading: string; points: string[] };
export type Concept = { term: string; definition: string };
export type QuizItem = {
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  hint: string;
};
export type Flashcard = { front: string; back: string };

export type Analysis = {
  title: string;
  overview: string;
  sections: Section[];
  concepts: Concept[];
  flashcards: Flashcard[];
};

export type ChatMessage = { role: "user" | "assistant"; content: string };
