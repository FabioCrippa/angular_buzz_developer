// Importações principais do Angular e dependências necessárias
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'; // Importa módulos essenciais do Angular
import { ActivatedRoute } from '@angular/router'; // Permite acessar parâmetros da rota
import quizz_questions from "../../../assets/data/quizz_questions.json"; // Importa as perguntas do quiz em formato JSON

// Interface que define o formato de uma questão do quiz
export interface Question {
  id: number; // Identificador único da questão
  question: string; // Texto da pergunta
  options: { id: number; name: string; alias: string }[]; // Opções de resposta
  correct: string; // Alias da resposta correta
  category: string; // Categoria da questão
  explanation?: string; // Explicação opcional para a resposta
}

// Decorador que define o componente Angular
@Component({
  selector: 'app-quizz', // Nome da tag do componente
  templateUrl: './quizz.component.html', // Caminho do template HTML
  styleUrls: ['./quizz.component.css'] // Caminho do CSS
})
export class QuizzComponent implements OnInit {
  // Permite acessar o elemento de áudio do template (caso usado)
  @ViewChild('backgroundAudio') backgroundAudio!: ElementRef<HTMLAudioElement>;
  private player: any; // Referência ao player do YouTube

  // Propriedades do componente
  title: string = ""; // Título dinâmico do quiz
  questions: Question[] = []; // Array de questões filtradas
  questionSelected: Question | null = null; // Questão atualmente exibida
  answers: string[] = []; // Respostas selecionadas pelo usuário
  answerSelected: string = ""; // Resposta final selecionada (para resultado)
  questionIndex: number = 0; // Índice da questão atual
  questionMaxIndex: number = 0; // Total de questões
  finished: boolean = false; // Indica se o quiz terminou
  difficulty: string = 'easy'; // Nível de dificuldade (pode ser expandido)
  score: number = 0; // Pontuação do usuário
  showCorrect: boolean = false; // Exibe feedback visual após resposta
  selectedAnswer: string = ""; // Resposta escolhida na questão atual
  correctAnswers: number = 0; // Contador de acertos
  wrongAnswers: number = 0; // Contador de erros
  category: string = ''; // Categoria selecionada pelo usuário
  
  // Injeta dependências (rota)
  constructor(private route: ActivatedRoute) { }

  // Método chamado ao inicializar o componente
  ngOnInit(): void {
    // Obtém parâmetros da rota (ex: categoria)
    this.route.queryParams.subscribe(params => {
      this.category = params['category'] || ''; // Salva categoria selecionada
      console.log('Parâmetros recebidos:', params);
    });

    // Verifica se o JSON de perguntas foi carregado
    if (quizz_questions) {
      console.log('Arquivo JSON carregado:', quizz_questions);

      this.finished = false; // Garante que o quiz não está finalizado
      this.title = quizz_questions.title; // Define o título do quiz

      // Filtra perguntas pela categoria selecionada
      this.questions = quizz_questions.questions.filter((q: any) => {
        return this.category ? q.category === this.category : true;
      });

      console.log('Categoria selecionada:', this.category);
      console.log('Perguntas filtradas:', this.questions);
      console.log('Todas as perguntas carregadas:', quizz_questions.questions);
      console.log('Perguntas da categoria CSS:', quizz_questions.questions.filter(q => q.category === 'css'));

      // Se houver perguntas filtradas, inicializa o quiz
      if (this.questions.length > 0) {
        this.questionIndex = 0;
        this.questionMaxIndex = this.questions.length;
        this.questionSelected = this.questions[this.questionIndex];
        console.log('Perguntas carregadas:', this.questions); // Debug
      } else {
        // Se não houver perguntas, exibe erro e limpa array
        console.error('Nenhuma pergunta encontrada para os critérios selecionados.');
        this.questions = []; // Garante que o array esteja vazio
      }

      // Fallback: tenta carregar todas as perguntas se não encontrar nenhuma
      if (this.questions.length === 0) {
        console.warn('Nenhuma pergunta encontrada. Carregando todas as perguntas como fallback.');
        this.questions = quizz_questions.questions.filter((q: any) => q.category === this.category);
        this.questionIndex = 0;
        this.questionMaxIndex = this.questions.length;
        this.questionSelected = this.questions[this.questionIndex];
      }
    } else {
      // Caso o JSON não seja encontrado
      console.error('Arquivo de perguntas não encontrado.');
    }

    // Opcional: inicia a música automaticamente
    this.playMusic();

    // Inicializa o player do YouTube quando a API estiver pronta
    (window as any).onYouTubeIframeAPIReady = () => {
      if (!this.player) {
        this.player = new (window as any).YT.Player('youtube-player', {
          videoId: 'DfSkKYQiwoU', // ID do vídeo do YouTube
          playerVars: {
            autoplay: 1, // Reprodução automática
            loop: 1, // Loop infinito
            playlist: 'DfSkKYQiwoU', // Necessário para o loop
            controls: 0, // Esconde controles
            mute: 0 // Inicia com som
          },
          events: {
            onReady: (event: any) => {
              console.log('Player do YouTube está pronto.');
              event.target.playVideo(); // Toca o vídeo
            },
            onError: (event: any) => {
              console.error('Erro no player do YouTube:', event);
            }
          }
        });
      }
    };
  }

  // Método chamado ao escolher uma resposta
  playerChoose(value: string) {
    this.selectedAnswer = value; // Salva resposta escolhida
    this.answers.push(value); // Adiciona ao array de respostas

    if (this.questionSelected) {
      if (value === this.questionSelected.correct) {
        this.correctAnswers++; // Incrementa acertos
      } else {
        this.wrongAnswers++; // Incrementa erros
        // Se errar, lê a explicação em voz alta
        if (this.questionSelected.explanation) {
          this.readText(this.questionSelected.explanation);
        }
      }
    }

    // Calcula a pontuação em porcentagem
    this.score = Math.round((this.correctAnswers / this.questions.length) * 100);
    this.showCorrect = true; // Exibe feedback visual
  }

  // Avança para a próxima questão
  
  async nextStep() {
    this.questionIndex += 1; // Incrementa índice

    console.log('Índice da pergunta atual:', this.questionIndex);
    console.log('Índice máximo de perguntas:', this.questionMaxIndex);

    if (this.questionMaxIndex > this.questionIndex) {
      this.questionSelected = this.questions[this.questionIndex]; // Seleciona próxima questão
      console.log('Avançando para a próxima pergunta:', this.questionSelected); // Debug
      this.showCorrect = false; // Reseta feedback visual
      // Lê a nova pergunta em voz alta
      this.readQuestion(this.questionSelected.question);
    } else {
      // Se acabou o quiz, calcula o resultado final
      const finalAnswer: string = await this.checkResult(this.answers);
      this.finished = true;
      this.answerSelected = quizz_questions.results[finalAnswer as keyof typeof quizz_questions.results];
      console.log('Quiz finalizado. Resultado:', this.answerSelected); // Debug
    }
  }

  // Calcula qual resposta foi mais escolhida (pode ser usado para quizzes de personalidade)
  async checkResult(answers: string[]) {
    const result = answers.reduce((previous, current, index, arr) => {
      if (
        arr.filter(item => item === previous).length >
        arr.filter(item => item === current).length
      ) {
        return previous;
      } else {
        return current;
      }
    });
    return result;
  }

  // Finaliza o quiz manualmente
  async finishQuiz() {
    this.finished = true; // Marca como finalizado
    const finalAnswer: string = await this.checkResult(this.answers); // Calcula resultado
    this.answerSelected = quizz_questions.results[finalAnswer as keyof typeof quizz_questions.results];
    console.log('Quiz finalizado manualmente. Resultado:', this.answerSelected); // Debug
    console.log(`Respostas corretas: ${this.correctAnswers}`);
    console.log(`Respostas incorretas: ${this.wrongAnswers}`);
  }

  // Reinicia o quiz do zero
  restartQuiz() {
    this.finished = false; // Marca como não finalizado
    this.questionIndex = 0; // Reinicia índice
    this.correctAnswers = 0; // Zera acertos
    this.wrongAnswers = 0; // Zera erros
    this.score = 0; // Zera pontuação
    this.answers = []; // Limpa respostas
    this.questionSelected = this.questions[this.questionIndex]; // Seleciona primeira questão
    this.showCorrect = false; // Reseta feedback visual
    console.log('Quiz reiniciado.');
  }

  // Toca a música de fundo (YouTube)
  playMusic() {
    console.log('Tentando tocar música...');
    if (this.player && this.player.playVideo) {
      this.player.playVideo();
      console.log('Música tocando.');
    } else {
      console.error('Player do YouTube não está inicializado ou não está pronto.');
    }
  }

  // Pausa a música de fundo
  pauseMusic() {
    if (this.player && this.player.pauseVideo) {
      this.player.pauseVideo(); // Pausa o vídeo
      console.log('Música pausada.');
    } else {
      console.error('Player do YouTube não está inicializado ou não está pronto.');
    }
  }

  // Lê a pergunta em voz alta (acessibilidade)
  readQuestion(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR'; // Define idioma
    window.speechSynthesis.speak(utterance);
  }

  // Lê qualquer texto em voz alta (usado para explicações)
  readText(text: string) {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR'; // Define idioma
    window.speechSynthesis.speak(utterance);
  }
}
