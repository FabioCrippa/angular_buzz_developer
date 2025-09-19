// Importações principais do Angular e dependências necessárias
import { Component, OnInit, OnDestroy } from '@angular/core'; // Importa módulos essenciais do Angular
import { ActivatedRoute, Router } from '@angular/router'; // Permite acessar parâmetros da rota
import { Subscription } from 'rxjs';

// ✅ INTERFACES LOCAIS (INDEPENDENTE DE SERVICE)
interface QuestionOption {
  id: number;
  name: string;
  alias: string;
}

interface Question {
  id: number;
  category: string;
  question: string;
  options: QuestionOption[];
  correct: string;
  explanation: string;
  interviewTip?: string;
}

interface CategoryResult {
  category: string;
  correct: number;
  total: number;
  percentage: number;
}

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  categoryResults: CategoryResult[];
  answers: { [key: number]: string };
}

// ✅ IMPORTAR DADOS DIRETAMENTE (SEM DEPENDÊNCIA DE SERVICE)
import quizz_questions from '../../../assets/data/quizz_questions.json';

// Decorador que define o componente Angular
@Component({
  selector: 'app-quizz', // Nome da tag do componente
  templateUrl: './quizz.component.html', // Caminho do template HTML
  styleUrls: ['./quizz.component.css'] // Caminho do CSS
})
export class QuizzComponent implements OnInit, OnDestroy {
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

  // ✅ DADOS INTERNOS
  private userAnswers: { [key: number]: string } = {};
  private subscriptions: Subscription[] = [];

  // ✅ ÁUDIO E MÚSICA
  private youtubePlayer?: any;

  // Injeta dependências (rota)
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  // Método chamado ao inicializar o componente
  ngOnInit(): void {
    this.initializeFromRoute();
    this.initializeYouTubeAPI();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopMusic();
  }

  // ✅ INICIALIZAÇÃO A PARTIR DA ROTA
  private initializeFromRoute(): void {
    const subscription = this.route.queryParams.subscribe(params => {  // ✅ ADICIONAR ()
      this.category = params['category'] || '';
      const questionCount = parseInt(params['questions']) || 25;
      this.initializeQuiz(questionCount);
    });
    
    this.subscriptions.push(subscription);
  }

  // ✅ INICIALIZAR QUIZ COM DADOS LOCAIS
  private initializeQuiz(questionCount: number = 25): void {
    try {
      // Carregar todas as questões
      const allQuestions = quizz_questions.questions as any[];
      
      // Filtrar por categoria se especificada
      let filteredQuestions = this.category && this.category !== 'all' 
        ? allQuestions.filter(q => q.category === this.category)
        : allQuestions;

      // Embaralhar e limitar quantidade
      filteredQuestions = this.shuffleArray([...filteredQuestions])
        .slice(0, questionCount);

      // Converter para formato correto
      this.questions = filteredQuestions.map((q: any, index: number) => ({
        id: q.id || index,
        category: q.category,
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation || '',
        interviewTip: q.interviewTip
      }));

      // Iniciar primeira questão
      if (this.questions.length > 0) {
        this.currentQuestion = this.questions[0];
        this.questionIndex = 0;
        this.finished = false;
        this.updateProgress();
        
        // Ler primeira pergunta
        setTimeout(() => this.readText(this.currentQuestion!.question), 500);
      }
      
    } catch (error) {
      console.error('❌ Erro ao inicializar quiz:', error);
      this.questions = [];
    }
  }

  // ✅ EMBARALHAR ARRAY
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ✅ SELECIONAR RESPOSTA - VERSÃO OTIMIZADA
  selectAnswer(answer: string): void {
    if (!this.currentQuestion || this.showFeedback) return;

    this.selectedAnswer = answer;
    this.userAnswers[this.currentQuestion.id] = answer;
    this.showFeedback = true;

    // ✅ FEEDBACK SONORO IMEDIATO
    const isCorrect = answer === this.currentQuestion.correct;
    const feedbackText = isCorrect ? 'Correto!' : 'Incorreto!';
    this.readText(feedbackText);

    // ✅ SEMPRE MOSTRAR DICA DE ENTREVISTA (SE EXISTIR)
    setTimeout(() => {
      if (this.currentQuestion!.interviewTip) {
        // 🎯 DICA SEMPRE APARECE (INDEPENDENTE DE ACERTAR/ERRAR)
        this.readText(`Dica para entrevista: ${this.currentQuestion!.interviewTip}`);
      } else if (!isCorrect && this.currentQuestion!.explanation) {
        // 📝 EXPLICAÇÃO SÓ SE ERROU E NÃO TEM DICA
        this.readText(`Explicação: ${this.currentQuestion!.explanation}`);
      }
    }, 1500);

    this.updateProgress();
  }

  // ✅ PRÓXIMA QUESTÃO
  nextQuestion(): void {
    if (this.questionIndex < this.questions.length - 1) {
      this.questionIndex++;
      this.currentQuestion = this.questions[this.questionIndex];
      this.showFeedback = false;
      this.selectedAnswer = "";
      
      // ✅ LER NOVA PERGUNTA
      setTimeout(() => this.readText(this.currentQuestion!.question), 300);
      this.updateProgress();
    } else {
      this.finishQuiz();
    }
  }

  // ✅ FINALIZAR QUIZ
  finishQuiz(): void {
    this.quizResult = this.calculateResults();
    this.finished = true;
    
    // ✅ LER RESULTADO FINAL
    const resultText = `Quiz finalizado! Você acertou ${this.quizResult.score} de ${this.quizResult.total} questões. Sua pontuação foi ${this.quizResult.percentage} por cento.`;
    setTimeout(() => this.readText(resultText), 500);
  }

  // ✅ CALCULAR RESULTADOS
  private calculateResults(): QuizResult {
    let totalCorrect = 0;
    const categoryStats: { [key: string]: { correct: number, total: number } } = {};

    this.questions.forEach(question => {
      const userAnswer = this.userAnswers[question.id];
      const isCorrect = userAnswer === question.correct;
      
      if (isCorrect) totalCorrect++;

      // Estatísticas por categoria
      if (!categoryStats[question.category]) {
        categoryStats[question.category] = { correct: 0, total: 0 };
      }
      categoryStats[question.category].total++;
      if (isCorrect) {
        categoryStats[question.category].correct++;
      }
    });

    // Converter para array de resultados por categoria
    const categoryResults: CategoryResult[] = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      score: totalCorrect,
      total: this.questions.length,
      percentage: Math.round((totalCorrect / this.questions.length) * 100),
      categoryResults,
      answers: { ...this.userAnswers }
    };
  }

  // ✅ ATUALIZAR PROGRESSO
  private updateProgress(): void {
    if (this.questions.length === 0) {
      this.progress = 0;
      return;
    }

    const questionsAnswered = Object.keys(this.userAnswers).length;
    this.progress = Math.round((questionsAnswered / this.questions.length) * 100);
  }

  // ✅ REINICIAR QUIZ
  restartQuiz(): void {
    this.userAnswers = {};
    this.showFeedback = false;
    this.selectedAnswer = "";
    this.finished = false;
    this.quizResult = null;
    this.progress = 0;
    this.questionIndex = 0;
    
    if (this.questions.length > 0) {
      this.currentQuestion = this.questions[0];
      setTimeout(() => this.readText(this.currentQuestion!.question), 300);
    }
  }

  // ✅ VOLTAR PARA HOME - IMPLEMENTADO
  goHome(): void {
    this.router.navigate(['/home']);
  }

  // ✅ OBTER LETRA DA OPÇÃO - IMPLEMENTADO
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  // ✅ OBTER TÍTULO DA CATEGORIA - IMPLEMENTADO
  getCategoryTitle(category: string): string {
    const categoryTitles: { [key: string]: string } = {
      'angular': 'Angular',
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'css': 'CSS',
      'html': 'HTML',
      'react': 'React',
      'vue': 'Vue.js',
      'nodejs': 'Node.js',
      'git': 'Git',
      'responsividade': 'Responsividade',
      'versionamento': 'Versionamento',
      'scrum': 'Scrum',
      'devops': 'DevOps',
      'criptografia': 'Criptografia',
      'micro-front-end': 'Micro Front-End',
      'testes-unitarios': 'Testes Unitários',
      'figma': 'Figma',
      'front-end': 'Front-End',
      'ci-cd': 'CI/CD',
      'code-review': 'Code Review',
      'boas-praticas': 'Boas Práticas',
      'entrevista': 'Entrevista'
    };
    
    return categoryTitles[category] || category.charAt(0).toUpperCase() + category.slice(1);
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
    if (!this.showFeedback) {
      return this.isSelectedAnswer(answer) ? 'selected' : '';
    }
    
    if (this.isSelectedAnswer(answer)) {
      return this.isCorrectAnswer(answer) ? 'correct selected' : 'incorrect selected';
    }
    
    if (this.isCorrectAnswer(answer)) {
      return 'correct';
    }
    
    return 'disabled';
  }

  // ✅ TEXT-TO-SPEECH MELHORADO
  readText(text: string): void {
    if (!text || !('speechSynthesis' in window)) return;
    
    // Parar qualquer fala anterior
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Tentar usar voz em português
    const voices = window.speechSynthesis.getVoices();
    const portugueseVoice = voices.find(voice => voice.lang.startsWith('pt'));
    if (portugueseVoice) {
      utterance.voice = portugueseVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }

  // ✅ INICIALIZAR YOUTUBE API - IMPLEMENTADO
  private initializeYouTubeAPI(): void {
    if (typeof window !== 'undefined' && !(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      (window as any).onYouTubeIframeAPIReady = () => {
        this.createYouTubePlayer();
      };
    } else if ((window as any).YT?.Player) {
      this.createYouTubePlayer();
    }
  }

  // ✅ CRIAR PLAYER DO YOUTUBE - IMPLEMENTADO
  private createYouTubePlayer(): void {
    if (typeof window === 'undefined' || !(window as any).YT?.Player) return;
    
    this.youtubePlayer = new (window as any).YT.Player('youtube-player', {
      height: '0',
      width: '0',
      videoId: 'jfKfPfyJRdk', // Música de fundo relaxante
      playerVars: {
        autoplay: 0,
        loop: 1,
        playlist: 'jfKfPfyJRdk'
      },
      events: {
        onReady: (event: any) => {
          event.target.setVolume(30);
        }
      }
    });
  }

  // ✅ TOCAR MÚSICA - IMPLEMENTADO
  playMusic(): void {
    if (this.youtubePlayer && this.youtubePlayer.playVideo) {
      this.youtubePlayer.playVideo();
    }
  }

  // ✅ PAUSAR MÚSICA - IMPLEMENTADO
  pauseMusic(): void {
    if (this.youtubePlayer && this.youtubePlayer.pauseVideo) {
      this.youtubePlayer.pauseVideo();
    }
  }

  // ✅ PARAR MÚSICA
  private stopMusic(): void {
    if (this.youtubePlayer && this.youtubePlayer.stopVideo) {
      this.youtubePlayer.stopVideo();
    }
  }

  // ✅ OBTER RESULTADOS POR CATEGORIA
  getCategoryResults(): CategoryResult[] {
    return this.quizResult?.categoryResults || [];
  }
}
