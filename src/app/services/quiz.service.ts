import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import questionsData from '../../assets/data/quizz_questions.json';

export interface Question {
  id: number;
  question: string;
  options: { id: number; name: string; alias: string }[];
  correct: string;
  category: string;
  explanation?: string;
  interviewTip?: string; // ✅ NOVA PROPRIEDADE!
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  categoryResults: CategoryResult[];
}

export interface CategoryResult {
  category: string;
  correct: number;
  total: number;
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private questions: Question[] = questionsData.questions;
  private currentQuestionIndex = 0;
  private userAnswers: { [questionId: number]: string } = {};
  
  private currentQuestionSubject = new BehaviorSubject<Question | null>(null);
  private quizProgressSubject = new BehaviorSubject<number>(0);

  get currentQuestion$(): Observable<Question | null> {
    return this.currentQuestionSubject.asObservable();
  }

  get quizProgress$(): Observable<number> {
    return this.quizProgressSubject.asObservable();
  }

  getAvailableCategories(): string[] {
    return [...new Set(this.questions.map(q => q.category))].sort();
  }

  getQuestionsByCategory(category: string): Question[] {
    return this.questions.filter(q => q.category === category);
  }

  startQuiz(categories: string[] = [], questionCount: number = 20): Question[] {
    let selectedQuestions = categories.length > 0 
      ? this.questions.filter(q => categories.includes(q.category))
      : this.questions;

    selectedQuestions = this.shuffleArray(selectedQuestions).slice(0, questionCount);
    
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    
    if (selectedQuestions.length > 0) {
      this.currentQuestionSubject.next(selectedQuestions[0]);
    }
    
    return selectedQuestions;
  }

  saveAnswer(questionId: number, answer: string): void {
    this.userAnswers[questionId] = answer;
  }

  nextQuestion(questions: Question[]): Question | null {
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex < questions.length) {
      const nextQuestion = questions[this.currentQuestionIndex];
      this.currentQuestionSubject.next(nextQuestion);
      this.updateProgress(questions.length);
      return nextQuestion;
    }
    return null;
  }

  calculateResults(questions: Question[]): QuizResult {
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    const categoryStats: { [category: string]: { correct: number; total: number } } = {};

    questions.forEach(question => {
      const userAnswer = this.userAnswers[question.id];
      const isCorrect = userAnswer === question.correct;

      if (isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }

      if (!categoryStats[question.category]) {
        categoryStats[question.category] = { correct: 0, total: 0 };
      }
      categoryStats[question.category].total++;
      if (isCorrect) {
        categoryStats[question.category].correct++;
      }
    });

    const categoryResults: CategoryResult[] = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100)
      }));

    return {
      score: correctAnswers,
      total: questions.length,
      percentage: Math.round((correctAnswers / questions.length) * 100),
      correctAnswers,
      incorrectAnswers,
      categoryResults
    };
  }

  getQuestionById(id: number): Question | undefined {
    return this.questions.find(q => q.id === id);
  }

  getUserAnswer(questionId: number): string | undefined {
    return this.userAnswers[questionId];
  }

  isAnswerCorrect(questionId: number): boolean {
    const question = this.getQuestionById(questionId);
    const userAnswer = this.getUserAnswer(questionId);
    return question ? userAnswer === question.correct : false;
  }

  resetQuiz(): void {
    this.currentQuestionIndex = 0;
    this.userAnswers = {};
    this.currentQuestionSubject.next(null);
    this.quizProgressSubject.next(0);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private updateProgress(totalQuestions: number): void {
    const progress = Math.round((this.currentQuestionIndex / totalQuestions) * 100);
    this.quizProgressSubject.next(progress);
  }
}
