import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import quizz_questions from '../../../assets/data/quizz_questions.json';

// ✅ INTERFACES CORRIGIDAS
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

interface CategoryInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  questionCount: number;
  difficulty: string;
}

interface QuizStats {
  totalQuestions: number;
  totalCategories: number;
  interviewQuestions: number;
}

// ✅ CONSTANTES SEPARADAS
const CATEGORY_CONFIG = {
  names: {
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
  },
  icons: {
    'angular': '🅰️', 'javascript': '🟨', 'typescript': '🔷',
    'css': '🎨', 'html': '📄', 'react': '⚛️', 'vue': '💚',
    'nodejs': '🟢', 'git': '📂', 'responsividade': '📱',
    'versionamento': '🔄', 'scrum': '🏃', 'devops': '🚀',
    'criptografia': '🔐', 'micro-front-end': '🧩',
    'testes-unitarios': '🧪', 'figma': '🎨', 'front-end': '✨',
    'ci-cd': '🔄', 'code-review': '👥', 'boas-praticas': '📚',
    'entrevista': '💼'
  },
  descriptions: {
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
  },
  difficulties: {
    'html': 'Básico', 'css': 'Básico', 'javascript': 'Básico',
    'responsividade': 'Básico', 'git': 'Básico',
    'typescript': 'Intermediário', 'angular': 'Intermediário',
    'react': 'Intermediário', 'vue': 'Intermediário',
    'nodejs': 'Intermediário', 'figma': 'Intermediário',
    'scrum': 'Intermediário', 'front-end': 'Intermediário',
    'boas-praticas': 'Intermediário', 'code-review': 'Intermediário',
    'versionamento': 'Intermediário', 'devops': 'Avançado',
    'ci-cd': 'Avançado', 'criptografia': 'Avançado',
    'micro-front-end': 'Avançado', 'testes-unitarios': 'Avançado',
    'entrevista': 'Avançado'
  }
} as const;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // ✅ PROPRIEDADES TIPADAS
  categories: CategoryInfo[] = [];
  totalQuestions: number = 0;
  
  // ✅ READONLY PARA DADOS QUE NÃO MUDAM - SEM CASTING FORÇADO
  private readonly questions: Question[];

  constructor(private readonly router: Router) {
    // ✅ VALIDAÇÃO E CONVERSÃO SEGURA
    this.questions = this.validateAndConvertQuestions();
  }

  ngOnInit(): void {
    this.initializeData();
  }

  // ✅ VALIDAÇÃO SEGURA DOS DADOS
  private validateAndConvertQuestions(): Question[] {
    try {
      const rawQuestions = quizz_questions.questions;
      
      // Validar se os dados existem e têm o formato esperado
      if (!Array.isArray(rawQuestions)) {
        throw new Error('Questions data is not an array');
      }

      // Converter e validar cada questão
      return rawQuestions.map((q: any, index: number) => {
        if (!q.category || !q.question || !Array.isArray(q.options) || !q.correct) {
          throw new Error(`Invalid question at index ${index}`);
        }

        return {
          id: q.id || index,
          category: q.category,
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation || '',
          interviewTip: q.interviewTip
        } as Question;
      });
      
    } catch (error) {
      console.error('❌ Erro ao validar questões:', error);
      return [];
    }
  }

  // ✅ MÉTODO DE INICIALIZAÇÃO MAIS CLARO
  private initializeData(): void {
    try {
      this.totalQuestions = this.questions.length;
      this.loadCategories();
    } catch (error) {
      console.error('❌ Erro ao inicializar dados:', error);
      this.handleInitializationError();
    }
  }

  // ✅ CARREGAMENTO DE CATEGORIAS OTIMIZADO
  private loadCategories(): void {
    try {
      if (this.questions.length === 0) {
        console.warn('⚠️ Nenhuma questão disponível para criar categorias');
        return;
      }

      const categoryMap = new Map<string, number>();
      
      // Contar questões por categoria de forma mais eficiente
      this.questions.forEach(question => {
        const count = categoryMap.get(question.category) || 0;
        categoryMap.set(question.category, count + 1);
      });

      // Criar array de categorias
      this.categories = Array.from(categoryMap.entries())
        .map(([categoryId, questionCount]) => this.createCategoryInfo(categoryId, questionCount))
        .sort((a, b) => b.questionCount - a.questionCount);
        
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
      this.categories = [];
    }
  }

  // ✅ FACTORY METHOD PARA CRIAR CATEGORIA
  private createCategoryInfo(categoryId: string, questionCount: number): CategoryInfo {
    return {
      id: categoryId,
      name: this.getCategoryDisplayName(categoryId),
      icon: this.getCategoryIcon(categoryId),
      description: this.getCategoryDescription(categoryId),
      questionCount,
      difficulty: this.getCategoryDifficulty(categoryId)
    };
  }

  // ✅ MÉTODOS MAIS LIMPOS E EFICIENTES
  private getCategoryDisplayName(category: string): string {
    return CATEGORY_CONFIG.names[category as keyof typeof CATEGORY_CONFIG.names] 
      || this.capitalizeFirstLetter(category);
  }

  private getCategoryIcon(category: string): string {
    return CATEGORY_CONFIG.icons[category as keyof typeof CATEGORY_CONFIG.icons] || '📋';
  }

  private getCategoryDescription(category: string): string {
    return CATEGORY_CONFIG.descriptions[category as keyof typeof CATEGORY_CONFIG.descriptions] 
      || 'Teste seus conhecimentos nesta área';
  }

  private getCategoryDifficulty(category: string): string {
    return CATEGORY_CONFIG.difficulties[category as keyof typeof CATEGORY_CONFIG.difficulties] 
      || 'Intermediário';
  }

  // ✅ UTILITY METHOD
  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // ✅ ERROR HANDLING MELHORADO
  private handleInitializationError(): void {
    this.categories = [];
    this.totalQuestions = 0;
  }

  // ✅ MÉTODOS PÚBLICOS MELHORADOS
  startQuickQuiz(): void {
    this.navigateToQuiz({ mode: 'quick', questions: 20 });
  }

  startQuiz(categoryId: string): void {
    let queryParams: { [key: string]: string | number } = {};
    if (categoryId === '' || categoryId === 'all') {
      queryParams = { mode: 'all', questions: 30 };
    } else {
      queryParams = { category: categoryId, questions: 25 };
    }
    this.navigateToQuiz(queryParams);
  }

  // ✅ NAVEGAÇÃO CENTRALIZADA
  private navigateToQuiz(queryParams: { [key: string]: string | number }): void {
    this.router.navigate(['/quiz'], { queryParams })
      .catch(error => console.error('❌ Erro na navegação:', error));
  }

  scrollToCategories(): void {
    const element = document.getElementById('categories');
    element?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }

  // ✅ TRACKBY OTIMIZADO
  trackByCategory(index: number, category: CategoryInfo): string {
    return category.id;
  }

  // ✅ STATS COM TIPAGEM - CORRIGIDO
  getQuizStats(): QuizStats {
    const interviewQuestions = this.questions.filter(q => 
      q.category === 'entrevista' && q.interviewTip
    ).length;

    return {
      totalQuestions: this.totalQuestions,
      totalCategories: this.categories.length,
      interviewQuestions
    };
  }

  // ✅ MÉTODO ADICIONAL PARA RECARREGAR
  reloadCategories(): void {
    this.loadCategories();
  }
}
