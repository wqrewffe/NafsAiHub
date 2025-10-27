// Type definitions for quiz and competition
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  organizerId: string;
  createdAt: string;
}

export interface QuizCompetition {
  id: string;
  quizId: string;
  participants: string[];
  scores: Record<string, number>;
  startedAt: string;
  endedAt?: string;
}
