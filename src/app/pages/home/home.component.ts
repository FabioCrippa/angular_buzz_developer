// ===============================================
// 📱 HOME COMPONENT - VERSÃO FINAL SOWLFY
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app\pages\home\home.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  // ✅ STATS DINÂMICOS DA HERO SECTION
  heroStats = {
    totalQuestions: 2500,
    totalAreas: 4,
    successRate: 92
  };
  
  // ✅ ÁREAS DE ESTUDO
  areas = [
    {
      name: 'analise-desenvolvimento',
      displayName: 'Análise e Desenvolvimento',
      icon: '🏗️',
      description: 'Web, backend, DevOps, segurança, metodologias ágeis e preparação para Big Techs',
      questionCount: 479,
      subjects: ['Angular', 'React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'DevOps', 'Segurança'],
      features: [
        'Análise e design de sistemas',
        'Frontend (Angular, React, JavaScript)',
        'Backend e APIs (TypeScript)',
        'DevOps, CI/CD e versionamento',
        'Segurança e autenticação',
        'Entrevistas técnicas avançadas'
      ],
      badge: 'MAIS POPULAR',
      badgeClass: 'popular',
      difficulty: 'Intermediário/Avançado'
    },
    {
      name: 'portugues',
      displayName: 'Português',
      icon: '📚',
      description: 'Gramática, interpretação de texto e redação com foco em concursos públicos',
      questionCount: 456,
      subjects: ['Gramática', 'Interpretação', 'Redação', 'Ortografia', 'Semântica'],
      features: [
        'Questões de principais bancas',
        'Interpretação de texto avançada',
        'Gramática normativa atualizada',
        'Dicas de redação oficial'
      ],
      badge: 'CONCURSOS',
      badgeClass: 'concursos',
      difficulty: 'Básico/Intermediário'
    },
    {
      name: 'matematica',
      displayName: 'Matemática',
      icon: '🔢',
      description: 'Raciocínio lógico, matemática básica e álgebra para qualquer prova',
      questionCount: 230,
      subjects: ['Álgebra', 'Geometria', 'Raciocínio Lógico', 'Matemática Básica'],
      features: [
        'Raciocínio lógico para concursos',
        'Matemática básica essencial',
        'Problemas práticos do dia a dia',
        'Preparação para vestibulares'
      ],
      badge: 'ESSENCIAL',
      badgeClass: 'essential',
      difficulty: 'Básico/Avançado'
    },
    {
      name: 'informatica',
      displayName: 'Informática',
      icon: '💾',
      description: 'Windows, Office, redes e conceitos fundamentais de TI atualizados',
      questionCount: 136,
      subjects: ['Windows', 'Office', 'Redes', 'Hardware', 'Internet'],
      features: [
        'Windows 10/11 atualizado',
        'Pacote Office completo',
        'Conceitos de redes e internet',
        'Hardware e software'
      ],
      badge: 'ATUALIZADO',
      badgeClass: 'updated',
      difficulty: 'Básico/Intermediário'
    }
  ];
  
  // ✅ FAQ
  faqs = [
    {
      question: 'Como funciona o plano gratuito do SOWLFY?',
      answer: 'No plano gratuito você tem <strong>7 tentativas por dia</strong> em qualquer uma das 4 áreas. É perfeito para conhecer a plataforma e começar seus estudos!'
    },
    {
      question: 'Posso cancelar o plano premium quando quiser?',
      answer: 'Sim! O plano premium é <strong>sem fidelidade</strong>. Você pode cancelar a qualquer momento e continuar usando até o final do período pago.'
    },
    {
      question: 'As questões são atualizadas regularmente?',
      answer: 'Sim! Nossa equipe atualiza as questões <strong>mensalmente</strong>, especialmente nas áreas de tecnologia e com base nos editais mais recentes de concursos.'
    },
    {
      question: 'Quando meu limite de tentativas recarrega?',
      answer: 'Suas 7 tentativas grátis diárias <strong>recarregam todos os dias à meia-noite</strong>. Premium tem tentativas ilimitadas 24/7!'
    },
    {
      question: 'O SOWLFY funciona no celular?',
      answer: 'Perfeitamente! Nossa plataforma é <strong>100% responsiva</strong> e funciona em qualquer dispositivo - celular, tablet ou computador.'
    },
    {
      question: 'O que é o Prepara Tech e como ele funciona?',
      answer: 'O <strong>Prepara Tech</strong> é uma funcionalidade exclusiva Pro que gera um simulado personalizado a partir da descrição de uma vaga de emprego. Você cola o texto da vaga (do LinkedIn, Gupy, etc.), o sistema analisa automaticamente as tecnologias e requisitos mencionados, e monta um quiz com até <strong>20 questões focadas exatamente no que será cobrado na entrevista</strong>.'
    },
    {
      question: 'Como funciona a análise da vaga no Prepara Tech?',
      answer: 'O sistema lê o texto da vaga e identifica palavras-chave de tecnologias como JavaScript, React, Angular, Python, SQL, Docker, entre outras. Cada tecnologia detectada é mapeada para um banco de questões específico. Quanto mais tecnologias a vaga mencionar, mais variadas e abrangentes serão as questões do simulado.'
    },
    {
      question: 'As 20 questões são sempre as mesmas no Prepara Tech?',
      answer: 'Não! As questões são <strong>selecionadas e embaralhadas aleatoriamente</strong> a cada novo simulado. Mesmo colando a mesma descrição de vaga duas vezes, você receberá uma combinação diferente de questões. Isso garante que você treine diferentes aspectos de cada tecnologia a cada tentativa.'
    },
    {
      question: 'O que aparece no resultado detalhado por tópico?',
      answer: 'Ao finalizar o quiz, você vê um <strong>relatório por tecnologia</strong>: para cada tópico avaliado (ex: React, TypeScript, Git) aparece quantas questões foram respondidas, quantas você acertou e a sua taxa de aproveitamento. Assim você sabe exatamente onde está forte e onde precisa estudar mais antes da entrevista.'
    }
  ];
  
  // ✅ CONTROLE DO FAQ
  activeFaq: number | null = null;
  
  // ✅ ANO ATUAL
  currentYear = new Date().getFullYear();
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // Stats já estão inicializados com valores padrão
  }

  // ✅ CARREGAR ESTATÍSTICAS DINÂMICAS
  private loadDynamicStats(): void {
    // Stats utilizan valores padrão da classe
    // Futuro: integrar com backend para dados dinâmicos
  }
  
  // ===============================================
  // 🆓 COMEÇAR TESTE GRÁTIS - DIRETO ANÔNIMO
  // ===============================================

  startFreeTrial(): void {
    // ✅ TODOS OS BOTÕES DE TESTE GRÁTIS VÃO PARA QUIZ ANÔNIMO
    this.router.navigate(['/anonymous-quiz']);
  }

  // ✅ ALIAS PARA COMPATIBILIDADE
  startAnonymousQuiz(): void {
    this.router.navigate(['/anonymous-quiz']);
  }
  
  // ✅ IR PARA ÁREA ESPECÍFICA - TAMBÉM VIA ANÔNIMO
  goToArea(areaName: string): void {
    // ✅ REDIRECIONAR PARA QUIZ ANÔNIMO (FUTURO: ADICIONAR FILTRO DE ÁREA)
    this.router.navigate(['/anonymous-quiz']);
  }
  
  // ===============================================
  // 📊 DASHBOARD COM VERIFICAÇÃO DE AUTH
  // ===============================================
  
  goToDashboard(): void {
    // ✅ REDIRECIONAR PARA PÁGINA DE UPGRADE COM MERCADO PAGO
    this.router.navigate(['/upgrade'], {
      queryParams: {
        source: 'home',
        ref: 'upgrade-button'
      }
    });
  }
  
  // ✅ UPGRADE PARA PRO
  upgradeToPro(): void {
    this.router.navigate(['/upgrade']);
  }

  navigateToPrepaTech(): void {
    this.router.navigate(['/upgrade'], { queryParams: { highlight: 'prepara-tech' } });
  }
  
  // ✅ CONTROLE DE FAQ
  toggleFaq(index: number): void {
    this.activeFaq = this.activeFaq === index ? null : index;
  }
  
  // ✅ LINKS DO FOOTER
  openHelp(): void {
    this.router.navigate(['/help']);
  }
  
  openTerms(): void {
    this.router.navigate(['/termos']);
  }
  
  openPrivacy(): void {
    this.router.navigate(['/privacidade']);
  }
  
  // ===============================================
  // 🔧 ADICIONAR ESTES MÉTODOS NO FINAL DA CLASSE
  // ===============================================
  
  // ✅ ADICIONAR DEPOIS DO método openPrivacy():

  // ✅ VER TODAS AS ÁREAS
  goToAllAreas(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard'], { queryParams: { view: 'areas' } });
    } else {
      localStorage.setItem('sowlfy_redirect_after_login', '/dashboard?view=areas');
      this.router.navigate(['/login'], {
        queryParams: { 
          returnUrl: '/dashboard',
          message: 'Faça login para ver todas as áreas'
        }
      });
    }
  }

  // ✅ IR PARA ÁREA MAIS POPULAR
  goToPopularArea(): void {
    this.goToArea('desenvolvimento-web');
  }

  // ✅ INICIAR JORNADA (MÉTODO ALTERNATIVO)
  startJourney(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    }
  }

  // ✅ ROLAR PARA SEÇÃO DE ÁREAS
  scrollToAreas(): void {
    const areasSection = document.querySelector('.areas-section');
    if (areasSection) {
      areasSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  // ✅ ROLAR PARA FAQ

  // ✅ POLÍTICA DE REEMBOLSO
  openRefund(): void {
    this.router.navigate(['/help'], { fragment: 'reembolso' });
  }

  // ✅ COMEÇAR ÁREA ESPECÍFICA (MÉTODO HELPER)
  startSpecificArea(areaName: string): void {
    // ✅ REDIRECIONAR PARA QUIZ ANÔNIMO
    this.router.navigate(['/anonymous-quiz']);
  }

  // ✅ VERIFICAR SE USUÁRIO É PREMIUM
  isPremiumUser(): boolean {
    return localStorage.getItem('isPremium') === 'true';
  }

  // ✅ DEBUG - TESTAR BOTÃO
  testButton(): void {
    alert('✅ Botão está funcionando corretamente!\n\nMetódo executado com sucesso.');
  }

}
