import { Component, OnInit } from '@angular/core';
import quizz_questions from "../../../assets/data/quizz_questions.json";

@Component({
  selector: 'app-quizz',
  templateUrl: './quizz.component.html',
  styleUrls: ['./quizz.component.css']
})
export class QuizzComponent implements OnInit {
  // propriedades
  title: string = ""; //altera dinamicamente
  questions: any; //armazena todas as perguntas
  questionSelected: any; //armazena a questão selecionada
  answers: string[] = []; //armazena todas as respostas
  answerSelected: string = ""; //armazena a resposta selecionada
  questionIndex: number = 0; //indica qual é o ponteiro atual
  questionMaxIndex: number = 0; //indica qual é o ponteiro máximo
  finished: boolean = false; //exibe o resultado na tela quando 'true'
  
  constructor() { }

  ngOnInit(): void {
    if (quizz_questions) {
      this.finished = false;
      this.title = quizz_questions.title;

      this.questions = quizz_questions.questions;
      this.questionSelected = this.questions[this.questionIndex];

      this.questionIndex = 0;
      this.questionMaxIndex = this.questions.length;
    }
  }

  //método (click)
  playerChoose(value: string) {
    this.answers.push(value)
    this.nextStep()
  }

  //método para mudar para próxima questão
  async nextStep() {
    this.questionIndex += 1;

    if (this.questionMaxIndex > this.questionIndex) {
      this.questionSelected = this.questions[this.questionIndex]
    } else {
      const finalAnswer: string = await this.checkResult(this.answers)
      this.finished = true;
      //quando passamos qualquer coisa e a constante reclama que 
      //só aceita um determinado valor, usamos keyof...typeof para dizer que
      //o valor é esse mesmo que eu quero
      this.answerSelected = quizz_questions.results[finalAnswer as keyof
      typeof quizz_questions.results]

    }
  }

  //método para verificar a opção com mais frequência
  async checkResult(answers: string[]) {
    const result = answers.reduce((previous, current, index, arr)=>{
      if (
        //arr filtra cada item. 
        //item vc é = ao previous?pega o valor
        //item vc é = ao current?pega o valor
        //comparação: o valor anterior tem mais itens que o valor atual?
        arr.filter(item => item === previous).length >
        arr.filter(item => item === current).length
      ) {
        return previous
        
      } else {
        return current
      }
    })
    return result
  }
}
