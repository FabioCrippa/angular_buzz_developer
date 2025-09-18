// Importações principais do Angular e dependências necessárias
import { Component, OnInit, OnDestroy } from '@angular/core'; // Importa módulos essenciais do Angular
import { ActivatedRoute } from '@angular/router'; // Permite acessar parâmetros da rota
import { Subscription } from 'rxjs';
import { QuizService, Question, QuizResult } from '../../services/quiz.service';

// Decorador que define o componente Angular
@Component({
  selector: 'app-quizz', // Nome da tag do componente
  templateUrl: './quizz.component.html', // Caminho do template HTML
  styleUrls: ['./quizz.component.css'] // Caminho do CSS
})
export class QuizzComponent implements OnInit, OnDestroy {
pauseMusic() {
throw new Error('Method not implemented.');
}
playMusic() {
throw new Error('Method not implemented.');
}
goHome() {
throw new Error('Method not implemented.');
}
getCategoryTitle(arg0: string) {
throw new Error('Method not implemented.');
}
  // ✅ PROPRIEDADES SIMPLIFICADAS
  title: string = "Quiz Buzz Developer";
  questions: Question[] = [];
  currentQuestion: Question | null = null;
  questionIndex: number = 0;
  selectedAnswer: string = "";
  showFeedback: boolean = false;
  finished: boolean = false;
  quizResult: QuizResult | null = null;
  category: string = '';
  progress: number = 0;

  // ✅ SUBSCRIPTIONS PARA CLEANUP
  private subscriptions: Subscription[] = [];

  // Injeta dependências (rota)
  constructor(
    private route: ActivatedRoute,
    private quizService: QuizService
  ) {}

  // Método chamado ao inicializar o componente
  ngOnInit(): void {
    // ✅ OBTER CATEGORIA DA ROTA
    this.route.queryParams.subscribe(params => {
      this.category = params['category'] || '';
      this.initializeQuiz();
    });

    // ✅ OBSERVAR QUESTÃO ATUAL
    const currentQuestion$ = this.quizService.currentQuestion$.subscribe(
      question => this.currentQuestion = question
    );

    // ✅ OBSERVAR PROGRESSO
    const progress$ = this.quizService.quizProgress$.subscribe(
      progress => this.progress = progress
    );

    this.subscriptions.push(currentQuestion$, progress$);
  }

  ngOnDestroy(): void {
    // ✅ CLEANUP DE SUBSCRIPTIONS
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ✅ INICIALIZAR QUIZ
  initializeQuiz(): void {
    const categories = this.category ? [this.category] : [];
    this.questions = this.quizService.startQuiz(categories, 25);
    
    if (this.questions.length > 0) {
      this.currentQuestion = this.questions[0];
      this.questionIndex = 0;
      this.finished = false;
    }
  }

  // ✅ SELECIONAR RESPOSTA
  selectAnswer(answer: string): void {
    if (!this.currentQuestion || this.showFeedback) return;

    this.selectedAnswer = answer;
    this.quizService.saveAnswer(this.currentQuestion.id, answer);
    this.showFeedback = true;

    // ✅ LER EXPLICAÇÃO SE ERROU E TEM interviewTip
    if (answer !== this.currentQuestion.correct) {
      if (this.currentQuestion.interviewTip) {
        setTimeout(() => {
          this.readText(this.currentQuestion!.interviewTip!);
        }, 1000);
      } else if (this.currentQuestion.explanation) {
        setTimeout(() => {
          this.readText(this.currentQuestion!.explanation!);
        }, 1000);
      }
    }
  }

  // ✅ PRÓXIMA QUESTÃO
  nextQuestion(): void {
    const nextQuestion = this.quizService.nextQuestion(this.questions);
    
    if (nextQuestion) {
      this.questionIndex++;
      this.currentQuestion = nextQuestion;
      this.showFeedback = false;
      this.selectedAnswer = "";
      
      // ✅ LER PERGUNTA
      this.readText(nextQuestion.question);
    } else {
      this.finishQuiz();
    }
  }

  // ✅ FINALIZAR QUIZ
  finishQuiz(): void {
    this.quizResult = this.quizService.calculateResults(this.questions);
    this.finished = true;
    
    // ✅ LER RESULTADO
    this.readText(`Quiz finalizado! Você acertou ${this.quizResult.score} de ${this.quizResult.total} questões. Sua pontuação foi ${this.quizResult.percentage}%.`);
  }

  // ✅ REINICIAR QUIZ
  restartQuiz(): void {
    this.quizService.resetQuiz();
    this.initializeQuiz();
    this.showFeedback = false;
    this.selectedAnswer = "";
    this.finished = false;
    this.quizResult = null;
    this.progress = 0;
  }

  // ✅ VERIFICAR SE RESPOSTA ESTÁ CORRETA
  isCorrectAnswer(answer: string): boolean {
    return this.currentQuestion ? answer === this.currentQuestion.correct : false;
  }

  // ✅ VERIFICAR SE É A RESPOSTA SELECIONADA
  isSelectedAnswer(answer: string): boolean {
    return answer === this.selectedAnswer;
  }

  // ✅ OBTER CLASSE CSS PARA OPÇÃO
  getOptionClass(answer: string): string {
    if (!this.showFeedback) return '';
    
    if (this.isSelectedAnswer(answer)) {
      return this.isCorrectAnswer(answer) ? 'correct selected' : 'incorrect selected';
    }
    
    if (this.isCorrectAnswer(answer)) {
      return 'correct';
    }
    
    return '';
  }

  // ✅ TEXT-TO-SPEECH SIMPLIFICADO
  readText(text: string): void {
    if (!text || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }

  // ✅ OBTER RESULTADO POR CATEGORIA
  getCategoryResults(): any[] {
    return this.quizResult?.categoryResults || [];
  }
}
