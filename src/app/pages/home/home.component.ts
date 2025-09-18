import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import quizz_questions from '../../../assets/data/quizz_questions.json';

interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  questionCount: number;
  difficulty: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  categories: CategoryInfo[] = [];
  totalQuestions: number = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadCategories();
    this.totalQuestions = quizz_questions?.questions?.length || 0;
  }

  private loadCategories(): void {
    try {
      const allCategories = quizz_questions.questions.map((q: any) => q.category);
      const uniqueCategories = Array.from(new Set(allCategories));

      this.categories = uniqueCategories.map(category => {
        const questionsInCategory = quizz_questions.questions.filter((q: any) => q.category === category);
        
        return {
          id: category,
          name: this.getCategoryDisplayName(category),
          icon: this.getCategoryIcon(category),
          description: this.getCategoryDescription(category),
          questionCount: questionsInCategory.length,
          difficulty: this.getCategoryDifficulty(category)
        };
      }).sort((a, b) => b.questionCount - a.questionCount);
    } catch (error) {
      // Em caso de erro, carregar categorias padrão
      this.categories = [];
    }
  }

  private getCategoryDisplayName(category: string): string {
    const categoryNames: { [key: string]: string } = {
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
    
    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  private getCategoryIcon(category: string): string {
    const categoryIcons: { [key: string]: string } = {
      'angular': '🅰️',
      'javascript': '🟨',
      'typescript': '🔷',
      'css': '🎨',
      'html': '📄',
      'react': '⚛️',
      'vue': '💚',
      'nodejs': '🟢',
      'git': '📂',
      'responsividade': '📱',
      'versionamento': '🔄',
      'scrum': '🏃',
      'devops': '🚀',
      'criptografia': '🔐',
      'micro-front-end': '🧩',
      'testes-unitarios': '🧪',
      'figma': '🎨',
      'front-end': '✨',
      'ci-cd': '🔄',
      'code-review': '👥',
      'boas-praticas': '📚',
      'entrevista': '💼'
    };
    
    return categoryIcons[category] || '📋';
  }

  private getCategoryDescription(category: string): string {
    const categoryDescriptions: { [key: string]: string } = {
      'angular': 'Framework frontend poderoso para SPAs',
      'javascript': 'Linguagem base do desenvolvimento web',
      'typescript': 'JavaScript com tipagem estática',
      'css': 'Estilização e layout responsivo',
      'html': 'Estruturação e semântica web',
      'react': 'Biblioteca JavaScript para interfaces',
      'vue': 'Framework progressivo para web',
      'nodejs': 'Runtime JavaScript server-side',
      'git': 'Controle de versão distribuído',
      'responsividade': 'Design adaptativo para dispositivos',
      'versionamento': 'Controle e histórico de código',
      'scrum': 'Metodologia ágil de desenvolvimento',
      'devops': 'Automação e deploy contínuo',
      'criptografia': 'Segurança e proteção de dados',
      'micro-front-end': 'Arquitetura modular frontend',
      'testes-unitarios': 'Qualidade e confiabilidade',
      'figma': 'Design e prototipagem',
      'front-end': 'Desenvolvimento de interfaces',
      'ci-cd': 'Integração e entrega contínua',
      'code-review': 'Revisão e qualidade de código',
      'boas-praticas': 'Padrões de desenvolvimento',
      'entrevista': 'Preparação para entrevistas técnicas'
    };
    
    return categoryDescriptions[category] || 'Teste seus conhecimentos nesta área';
  }

  private getCategoryDifficulty(category: string): string {
    const categoryDifficulties: { [key: string]: string } = {
      'html': 'Básico',
      'css': 'Básico',
      'javascript': 'Básico',
      'responsividade': 'Básico',
      'git': 'Básico',
      'typescript': 'Intermediário',
      'angular': 'Intermediário',
      'react': 'Intermediário',
      'vue': 'Intermediário',
      'nodejs': 'Intermediário',
      'figma': 'Intermediário',
      'scrum': 'Intermediário',
      'front-end': 'Intermediário',
      'boas-praticas': 'Intermediário',
      'code-review': 'Intermediário',
      'versionamento': 'Intermediário',
      'devops': 'Avançado',
      'ci-cd': 'Avançado',
      'criptografia': 'Avançado',
      'micro-front-end': 'Avançado',
      'testes-unitarios': 'Avançado',
      'entrevista': 'Avançado'
    };
    
    return categoryDifficulties[category] || 'Intermediário';
  }

  startQuickQuiz(): void {
    this.router.navigate(['/quiz'], { 
      queryParams: { 
        mode: 'quick',
        questions: 20 
      } 
    });
  }

  startQuiz(categoryId: string): void {
    if (categoryId === '' || categoryId === 'all') {
      this.router.navigate(['/quiz'], { 
        queryParams: { 
          mode: 'all',
          questions: 30
        } 
      });
    } else {
      this.router.navigate(['/quiz'], { 
        queryParams: { 
          category: categoryId,
          questions: 25
        } 
      });
    }
  }

  scrollToCategories(): void {
    const element = document.getElementById('categories');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  trackByCategory(index: number, category: CategoryInfo): string {
    return category.id;
  }

  getQuizStats() {
    return {
      totalQuestions: this.totalQuestions,
      totalCategories: this.categories.length,
      interviewQuestions: quizz_questions.questions.filter((q: any) => 
        q.category === 'entrevista' && q.interviewTip
      ).length
    };
  }
}
