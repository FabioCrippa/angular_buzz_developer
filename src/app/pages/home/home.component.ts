import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import quizz_questions from '../../../assets/data/quizz_questions.json';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  categories: string[] = []; // Lista de categorias

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Extrair categorias únicas das perguntas
    const allCategories = quizz_questions.questions.map((q: any) => q.category);
    this.categories = Array.from(new Set(allCategories)); // Remove duplicatas
  }

  startQuiz(difficulty: string) {
    console.log(`Iniciando quiz com dificuldade: ${difficulty}`);
    this.router.navigate(['/quizz'], { queryParams: { difficulty } });
  }
}
