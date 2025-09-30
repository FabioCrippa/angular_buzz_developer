import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category?: 'pricing' | 'platform' | 'technical' | 'support';
}

interface SocialProof {
  number: string;
  label: string;
  icon?: string;
}

interface TechStack {
  id: string;
  name: string;
  icon: string;
  questionCount: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  popular?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  
  // ✅ PROPRIEDADES TIPADAS
  readonly currentYear: number = new Date().getFullYear();
  readonly totalQuestions: number = 1500; // Aumentado
  readonly totalTechnologies: number = 18;
  readonly totalAreas: number = 4; // 4 áreas
  readonly successRate: number = 89; // Taxa de sucesso
  
  activeFaq: number | null = null;
  isLoading: boolean = false;
  
  // ✅ SOCIAL PROOF ESTRUTURADO
  readonly socialProof: SocialProof[] = [
    { number: '558+', label: 'Questões', icon: '📚' },
    { number: '18', label: 'Tecnologias', icon: '⚡' },
    { number: '150+', label: 'Devs Aprovados', icon: '🎯' }
  ];
  
  // ✅ TECH STACK ESTRUTURADO
  readonly featuredTechs: TechStack[] = [
    {
      id: 'javascript',
      name: 'JavaScript',
      icon: '🟨',
      questionCount: 89,
      difficulty: 'basic',
      popular: true
    },
    {
      id: 'react',
      name: 'React',
      icon: '⚛️',
      questionCount: 65,
      difficulty: 'intermediate',
      popular: true
    },
    {
      id: 'angular',
      name: 'Angular',
      icon: '🅰️',
      questionCount: 35,
      difficulty: 'advanced'
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      icon: '🔷',
      questionCount: 28,
      difficulty: 'intermediate'
    }
  ];

  // ✅ FAQs COM CATEGORIAS E IDs
  readonly faqs: FAQ[] = [
    {
      id: 1,
      category: 'pricing',
      question: 'Posso estudar tanto para concursos quanto para vagas tech?',
      answer: 'Sim! Nossa plataforma oferece 4 áreas completas: Desenvolvimento Web, Português, Matemática e Informática. Você pode focar em uma área ou estudar todas!'
    },
    {
      id: 2,
      category: 'platform',
      question: 'As questões são baseadas em provas reais?',
      answer: 'Absolutamente! Temos questões de bancas como CESPE, FCC, VUNESP e entrevistas reais de empresas como Google, Nubank, XP Inc.'
    },
    {
      id: 3,
      category: 'technical',
      question: 'Funciona no celular?',
      answer: 'Perfeitamente! Nossa plataforma é totalmente responsiva e funciona em qualquer dispositivo - celular, tablet ou desktop.'
    },
    {
      id: 4,
      category: 'platform',
      question: 'Que tecnologias estão disponíveis?',
      answer: 'Temos questões de JavaScript, React, Angular, TypeScript, HTML, CSS, Node.js, DevOps, Scrum e muitas outras. Total de 18 tecnologias!'
    }
  ];

  constructor(private readonly router: Router) {}

  // ✅ MÉTODOS COM TRATAMENTO DE ERRO
  startFreeTrial(): void {
    try {
      this.isLoading = true;
      // TODO: Analytics tracking
      // gtag('event', 'start_free_trial', { method: 'hero_cta' });
      
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Erro ao iniciar trial:', error);
    } finally {
      this.isLoading = false;
    }
  }

  goToDashboard(): void {
    try {
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Erro na navegação:', error);
    }
  }

  goToTech(techId: string): void {
    try {
      const tech = this.featuredTechs.find(t => t.id === techId);
      if (!tech) {
        console.warn(`Tecnologia ${techId} não encontrada`);
        return;
      }

      // TODO: Analytics tracking
      // gtag('event', 'select_technology', { technology: techId });
      
      this.router.navigate(['/quiz', techId]);
    } catch (error) {
      console.error('Erro ao navegar para tech:', error);
    }
  }

  upgradeToPro(): void {
    try {
      // TODO: Analytics tracking
      // gtag('event', 'begin_checkout', { value: 29.90, currency: 'BRL' });
      
      // Versão mais amigável do alert
      const confirmed = confirm(
        'Quer começar seu teste grátis de 7 dias?\n\n' +
        'Acesso completo por 7 dias\n' +
        'Apenas R$ 29,90/mês após o teste\n' +
        'Cancele quando quiser\n\n' +
        'Clique OK para continuar'
      );
      
      if (confirmed) {
        // TODO: Implementar Stripe
        this.router.navigate(['/upgrade']);
      }
    } catch (error) {
      console.error('Erro no upgrade:', error);
    }
  }

  toggleFaq(index: number): void {
    try {
      const wasOpen = this.activeFaq === index;
      this.activeFaq = wasOpen ? null : index;
      
      // TODO: Analytics tracking
      if (!wasOpen) {
        const faq = this.faqs[index];
        // gtag('event', 'faq_expand', { faq_id: faq.id, category: faq.category });
      }
    } catch (error) {
      console.error('Erro no toggle FAQ:', error);
    }
  }

  // ✅ NOVOS MÉTODOS
  goToArea(area: string): void {
    try {
      // gtag('event', 'select_area', { area });
      this.router.navigate(['/area', area]);
    } catch (error) {
      console.error('Erro ao navegar para área:', error);
    }
  }

  goToCareer(career: string): void {
    try {
      alert(`🎯 Carreira ${career} selecionada!\n\nVamos mostrar as oportunidades disponíveis.`);
      this.router.navigate(['/career', career]);
    } catch (error) {
      console.error('Erro ao navegar para carreira:', error);
    }
  }

  // ✅ MÉTODOS AUXILIARES
  trackClick(element: string, value?: string): void {
    try {
      // TODO: Analytics
      console.log(`Click tracked: ${element}`, value);
      // gtag('event', 'click', { element, value });
    } catch (error) {
      console.error('Erro no tracking:', error);
    }
  }

  getDifficultyClass(difficulty: TechStack['difficulty']): string {
    const classes = {
      basic: 'difficulty-basic',
      intermediate: 'difficulty-intermediate', 
      advanced: 'difficulty-advanced'
    };
    return classes[difficulty] || 'difficulty-basic';
  }

  getFaqsByCategory(category: FAQ['category']): FAQ[] {
    return this.faqs.filter(faq => faq.category === category);
  }
}
