export type Point = { text: string; pages: number[] };
// takeaway(핵심 한 줄)와 easy(쉬운 설명)는 이전 버전으로 저장된 문서에는 없다
export type Section = { heading: string; points: Point[]; takeaway?: string; easy?: string };
export type Concept = { term: string; definition: string };
export type QuizItem = {
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  hint: string;
};
export type Flashcard = { front: string; back: string };

// 업로드하면 바로 만드는 요약. 나머지(개념·카드·퀴즈)는 탭을 열 때 따로 만든다
export type Analysis = {
  title: string;
  overview: string;
  sections: Section[];
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

// 브라우저(IndexedDB)에 저장하는 문서 한 건
export type StoredDoc = {
  id: string;
  name: string; // 파일 이름
  createdAt: number;
  pdf: Blob;
  thumb?: string; // 첫 페이지 미리보기 (JPEG data URL). 이전 버전 문서에는 없다
  analysis: Analysis;
  concepts: Concept[] | null;
  flashcards: Flashcard[] | null;
  quiz: QuizItem[] | null;
};
