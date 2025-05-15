import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import quizz_questions from "../../../assets/data/quizz_questions.json";

export interface Question {
  id: number;
  question: string;
  options: { id: number; name: string; alias: string }[];
  correct: string;
  category: string;
}

@Component({
  selector: 'app-quizz',
  templateUrl: './quizz.component.html',
  styleUrls: ['./quizz.component.css']
})
export class QuizzComponent implements OnInit {
  @ViewChild('backgroundAudio') backgroundAudio!: ElementRef<HTMLAudioElement>;
  private player: any; // Referência ao player do YouTube

  // propriedades
  title: string = ""; // Altera dinamicamente
  questions: Question[] = []; // Define o tipo como um array de Question
  questionSelected: Question | null = null; // Armazena a questão selecionada
  answers: string[] = []; // Armazena todas as respostas
  answerSelected: string = ""; // Armazena a resposta selecionada
  questionIndex: number = 0; // Indica qual é o ponteiro atual
  questionMaxIndex: number = 0; // Indica qual é o ponteiro máximo
  finished: boolean = false; // Exibe o resultado na tela quando 'true'
  difficulty: string = 'easy'; // Define o nível de dificuldade
  score: number = 0; // Incrementa a pontuação
  showCorrect: boolean = false; // Controla se as respostas corretas devem ser exibidas
  selectedAnswer: string = ""; // Armazena a resposta escolhida pelo usuário
  correctAnswers: number = 0; // Número de respostas corretas
  wrongAnswers: number = 0; // Número de respostas incorretas
  category: string = ''; // Categoria selecionada
  
  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Obter os parâmetros da rota
    this.route.queryParams.subscribe(params => {
      this.category = params['category'] || ''; // Categoria selecionada
      console.log('Parâmetros recebidos:', params);
    });

    // Verificar se há perguntas no JSON
    if (quizz_questions) {
      console.log('Arquivo JSON carregado:', quizz_questions);

      this.finished = false;
      this.title = quizz_questions.title;

      // Filtrar perguntas com base na dificuldade e categoria
      this.questions = quizz_questions.questions.filter((q: any) => {
        return this.category ? q.category === this.category : true;
      });

      console.log('Categoria selecionada:', this.category);
      console.log('Perguntas filtradas:', this.questions);
      console.log('Todas as perguntas carregadas:', quizz_questions.questions);
      console.log('Perguntas da categoria CSS:', quizz_questions.questions.filter(q => q.category === 'css'));

      // Verificar se há perguntas filtradas
      if (this.questions.length > 0) {
        this.questionIndex = 0;
        this.questionMaxIndex = this.questions.length;
        this.questionSelected = this.questions[this.questionIndex];
        console.log('Perguntas carregadas:', this.questions); // Debug
      } else {
        console.error('Nenhuma pergunta encontrada para os critérios selecionados.');
        this.questions = []; // Garante que o array esteja vazio
      }

      if (this.questions.length === 0) {
        console.warn('Nenhuma pergunta encontrada. Carregando todas as perguntas como fallback.');
        this.questions = quizz_questions.questions;
        this.questionIndex = 0;
        this.questionMaxIndex = this.questions.length;
        this.questionSelected = this.questions[this.questionIndex];
      }
    } else {
      console.error('Arquivo de perguntas não encontrado.');
    }

    // Opcional: Iniciar a música automaticamente
    this.playMusic();

    this.initPlayer();    
  }

  private initPlayer(): void {
    // Inicializar o player do YouTube quando a API estiver carregada
    (window as any).onYouTubeIframeAPIReady = () => {
      if (!this.player) {
        this.player = new (window as any).YT.Player('youtube-player', {
          videoId: 'DfSkKYQiwoU', // ID do vídeo do YouTube
          playerVars: {
            autoplay: 1, // Ativa reprodução automática
            loop: 1, // Ativa o loop
            playlist: 'DfSkKYQiwoU', // Necessário para o loop
            controls: 0, // Remove os controles do player
            mute: 0 // Inicia o vídeo com som
          },
          events: {
            onReady: (event: any) => {
              console.log('Player do YouTube está pronto.');
              event.target.playVideo(); // Reproduz o vídeo automaticamente
            },
            onError: (event: any) => {
              console.error('Erro no player do YouTube:', event);
            }
          }
        });
      }
    };
  }

  public shuffle(options: any[]): any[] {
    return options
      .map(value => ({ value, sort: Math.random() })) // Cria um array com valores e um número aleatório
      .sort((a, b) => a.sort - b.sort) // Ordena pelo número aleatório
      .map(({ value }) => value); // Retorna o array embaralhado
  }

  // Método (click)
  playerChoose(value: string) {
    this.selectedAnswer = value; // Armazena a resposta escolhida
    this.answers.push(value);
    console.log('Resposta escolhida:', value);
    console.log('Respostas até agora:', this.answers);

    if (this.questionSelected) {
      if (value === this.questionSelected.correct) {
        this.correctAnswers++; // Incrementa o número de respostas corretas
      } else {
        this.wrongAnswers++; // Incrementa o número de respostas incorretas
      }
    }

    // Atualiza a pontuação como porcentagem
    this.score = Math.round((this.correctAnswers / this.questions.length) * 100);

    this.showCorrect = true; // Exibe o feedback visual e o botão "Avançar"
  }

  // Método para mudar para próxima questão
  async nextStep() {
    this.questionIndex += 1;

    console.log('Índice da pergunta atual:', this.questionIndex);
    console.log('Índice máximo de perguntas:', this.questionMaxIndex);

    if (this.questionMaxIndex > this.questionIndex) {
      this.questionSelected = this.questions[this.questionIndex];
      console.log('Avançando para a próxima pergunta:', this.questionSelected); // Debug
      this.showCorrect = false; // Reseta o feedback visual
    } else {
      const finalAnswer: string = await this.checkResult(this.answers);
      this.finished = true;
      this.answerSelected = quizz_questions.results[finalAnswer as keyof typeof quizz_questions.results];
      console.log('Quiz finalizado. Resultado:', this.answerSelected); // Debug
    }
  }

  // Método para verificar a opção com mais frequência
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

  async finishQuiz() {
    this.finished = true; // Define o estado como finalizado
    const finalAnswer: string = await this.checkResult(this.answers); // Use 'await' para resolver a Promise
    this.answerSelected = quizz_questions.results[finalAnswer as keyof typeof quizz_questions.results];
    console.log('Quiz finalizado manualmente. Resultado:', this.answerSelected); // Debug
    console.log(`Respostas corretas: ${this.correctAnswers}`);
    console.log(`Respostas incorretas: ${this.wrongAnswers}`);
  }

  restartQuiz() {
    this.finished = false; // Define o estado como não finalizado
    this.questionIndex = 0; // Reinicia o índice da pergunta
    this.correctAnswers = 0; // Reseta o número de respostas corretas
    this.wrongAnswers = 0; // Reseta o número de respostas incorretas
    this.score = 0; // Reseta a pontuação
    this.answers = []; // Limpa as respostas
    this.questionSelected = this.questions[this.questionIndex]; // Seleciona a primeira pergunta
    this.showCorrect = false; // Reseta o feedback visual
    console.log('Quiz reiniciado.');
  }

  playMusic() {
    console.log('Tentando tocar música...');
    if (this.player && this.player.playVideo) {
      this.player.playVideo();
      console.log('Música tocando.');
    } else {
      console.error('Player do YouTube não está inicializado ou não está pronto.');
    }
  }

  pauseMusic() {
    if (this.player && this.player.pauseVideo) {
      this.player.pauseVideo(); // Pausa o vídeo
      console.log('Música pausada.');
    } else {
      console.error('Player do YouTube não está inicializado ou não está pronto.');
    }
  }
}
