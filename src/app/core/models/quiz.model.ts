export interface Question {
  id: string;
  area: string;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizConfig {
  mode: 'area' | 'random' | 'favorites';
  areaName?: string;
  questionCount: number;
  timeLimit?: number; // em minutos
  subjects?: string[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  shuffle: boolean;
}

export interface QuizSession {
  id: string;
  config: QuizConfig;
  questions: Question[];
  answers: QuizAnswer[];
  startTime: Date;
  endTime?: Date;
  currentQuestionIndex: number;
  isCompleted: boolean;
  score?: QuizScore;
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number; // em segundos
  answeredAt: Date;
}

export interface QuizScore {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpent: number; // em segundos
  difficulty: string;
  area: string;
}