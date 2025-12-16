// ===============================================
// 📱 HOME COMPONENT - VERSÃO FINAL SOWLFY
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app\pages\home\home.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FreeTrialService } from '../../core/services/free-trial.service';
import { ProgressService } from '../../core/services/progress.service';
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
      name: 'desenvolvimento-web',
      displayName: 'Desenvolvimento Web',
      icon: '💻',
      description: 'React, Angular, JavaScript, TypeScript e tecnologias modernas para entrevistas técnicas',
      questionCount: 850,
      subjects: ['Angular', 'React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Node.js'],
      features: [
        'Questões técnicas de Big Techs',
        'Algoritmos e estruturas de dados',
        'Boas práticas e code review',
        'Frameworks modernos'
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
      questionCount: 650,
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
      questionCount: 480,
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
      questionCount: 520,
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
      answer: 'No plano gratuito você tem <strong>1 tentativa por dia</strong> em qualquer uma das 4 áreas. É perfeito para conhecer a plataforma e começar seus estudos!'
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
      question: 'O SOWLFY funciona no celular?',
      answer: 'Perfeitamente! Nossa plataforma é <strong>100% responsiva</strong> e funciona em qualquer dispositivo - celular, tablet ou computador.'
    },
    {
      question: 'Como são criadas as questões?',
      answer: 'Nossas questões são criadas por <strong>especialistas</strong> em cada área e baseadas em provas reais de concursos e entrevistas técnicas de grandes empresas.'
    }
  ];
  
  // ✅ CONTROLE DO FAQ
  activeFaq: number | null = null;
  
  // ✅ ANO ATUAL
  currentYear = new Date().getFullYear();
  
  constructor(
    private router: Router,
    private freeTrialService: FreeTrialService,
    private progressService: ProgressService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.loadDynamicStats();
  }
  
  // ✅ CARREGAR ESTATÍSTICAS DINÂMICAS
  private loadDynamicStats(): void {
    try {
      // ✅ BUSCAR DADOS REAIS DO PROGRESS SERVICE
      // o ProgressService pode não expor getOverallProgress; usar any + optional chaining
      const userProgress = ((this.progressService as any).getOverallProgress?.() as { totalAnswered: number; correctAnswers: number; }) ?? { totalAnswered: 0, correctAnswers: 0 };
      
      if (userProgress.totalAnswered > 0) {
        this.heroStats.successRate = Math.round(
          (userProgress.correctAnswers / userProgress.totalAnswered) * 100
        );
      }
    } catch (error) {
    }
  }
  
  // ===============================================
  // 🆓 COMEÇAR PREPARAÇÃO COM AUTH
  // ===============================================

  startFreeTrial(): void {
    if (this.authService.isAuthenticated()) {
      // ✅ USUÁRIO LOGADO - VERIFICAR TENTATIVAS E INICIAR QUIZ
      this.executeFreeTrial();
    } else {
      // ❌ NÃO LOGADO - REDIRECIONAR PARA LOGIN
      this.saveQuizIntention();
      this.router.navigate(['/login'], {
        queryParams: { 
          returnUrl: '/quiz',
          message: 'Faça login para começar sua preparação grátis'
        }
      });
    }
  }

  // ✅ SALVAR INTENÇÃO ESPECÍFICA PARA QUIZ
  private saveQuizIntention(): void {
    const intention = {
      action: 'start_free_trial',
      route: '/quiz',
      params: {
        mode: 'area',
        area: 'desenvolvimento-web',
        count: 5
      },
      timestamp: Date.now(),
      message: 'Iniciar preparação grátis - Quiz Desenvolvimento Web'
    };
    
    localStorage.setItem('userIntention', JSON.stringify(intention));
  }
  
  // ✅ INICIAR TESTE GRÁTIS
  private executeFreeTrial(): void {
    try {
      // ✅ VERIFICAR SE JÁ É PREMIUM
      const isPremium = localStorage.getItem('isPremium') === 'true';
      
      if (isPremium) {
        this.router.navigate(['/dashboard']);
        return;
      }
      
      // ✅ VERIFICAR TENTATIVAS RESTANTES
      const remaining = this.freeTrialService.getRemainingAttempts('desenvolvimento-web');
      
      if (remaining > 0) {
        // ✅ TEM TENTATIVAS - INICIAR QUIZ DIRETAMENTE
        this.router.navigate(['/quiz'], {
          queryParams: {
            mode: 'area',
            area: 'desenvolvimento-web',
            count: 5
          }
        });
      } else {
        // ✅ SEM TENTATIVAS - MOSTRAR OPÇÕES
        const message = `🚀 Sua 1 tentativa gratuita de hoje acabou!\n\n` +
                       `👑 Quer continuar praticando?\n\n` +
                       `• Upgrade para Premium = Acesso Ilimitado\n` +
                       `• Ou volte amanhã para mais 1 tentativa gratuita\n\n` +
                       `Fazer upgrade agora?`;
        
        if (confirm(message)) {
          this.upgradeToPro();
        } else {
          this.router.navigate(['/dashboard']);
        }
      }
      
    } catch (error) {
      // ❌ ERRO - REDIRECIONAR PARA LOGIN
      console.error('Erro ao executar free trial:', error);
      this.router.navigate(['/login']);
    }
  }
  
  // ===============================================
  // 📊 DASHBOARD COM VERIFICAÇÃO DE AUTH
  // ===============================================
  
  goToDashboard(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      localStorage.setItem('sowlfy_redirect_after_login', '/dashboard');
      this.router.navigate(['/login'], {
        queryParams: { 
          returnUrl: '/dashboard',
          message: 'Faça login para acessar seu dashboard'
        }
      });
    }
  }
  
  // ✅ IR PARA ÁREA ESPECÍFICA
  goToArea(areaName: string): void {
    // ✅ MAPEAR NOMES PARA ROTA CORRETA
    const areaMap: { [key: string]: string } = {
      'desenvolvimento': 'desenvolvimento-web',
      'desenvolvimento-web': 'desenvolvimento-web',
      'portugues': 'portugues',
      'matematica': 'matematica',
      'informatica': 'informatica'
    };
    
    const mappedArea = areaMap[areaName] || areaName;
    
    if (this.authService.isAuthenticated()) {
      // ✅ LOGADO - IR PARA QUIZ
      this.router.navigate(['/quiz'], {
        queryParams: {
          mode: 'area',
          area: mappedArea,
          count: 5
        }
      });
    } else {
      // ❌ NÃO LOGADO - IR PARA LOGIN
      const targetUrl = `/quiz?mode=area&area=${mappedArea}&count=5`;
      localStorage.setItem('sowlfy_redirect_after_login', targetUrl);
      this.router.navigate(['/login'], {
        queryParams: { 
          returnUrl: targetUrl,
          message: `Faça login para acessar ${areaMap[mappedArea] || mappedArea}`
        }
      });
    }
  }
  
  // ✅ UPGRADE PARA PRO - REDIRECIONAR PARA PÁGINA DE UPGRADE
  upgradeToPro(): void {
    
    // ✅ REDIRECIONAR PARA PÁGINA DE UPGRADE COM MERCADO PAGO
    this.router.navigate(['/upgrade'], {
      queryParams: {
        source: 'home',
        ref: 'upgrade-button'
      }
    });
  }
  
  // ✅ MÉTODO LEGADO (MANTER PARA COMPATIBILIDADE)
  upgradeToPro_OLD(): void {
    // ✅ SIMULAR UPGRADE (modo de teste - desativado)
    const isPremium = localStorage.getItem('isPremium') === 'true';
    
    if (!isPremium) {
      alert('👑 Você já é Premium! Aproveite todos os recursos ilimitados.');
    }
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

  // ✅ ABRIR FAQ (ROLAR PARA SEÇÃO)
  openFaq(): void {
    const faqSection = document.querySelector('.faq-section');
    if (faqSection) {
      faqSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  // ✅ POLÍTICA DE REEMBOLSO
  openRefund(): void {
    this.router.navigate(['/help'], { fragment: 'reembolso' });
  }

  // ✅ COMEÇAR ÁREA ESPECÍFICA (MÉTODO HELPER)
  startSpecificArea(areaName: string): void {
    
    // ✅ VERIFICAR TENTATIVAS
    const remaining = this.freeTrialService.getRemainingAttempts(areaName);
    
    if (remaining > 0) {
      // ✅ INICIAR QUIZ DA ÁREA
      this.router.navigate(['/quiz'], {
        queryParams: {
          mode: 'area',
          area: areaName,
          count: 5
        }
      });
    } else {
      // ✅ SEM TENTATIVAS
      const message = `⏱️ Tentativas da área "${areaName}" esgotadas hoje!\n\n` +
                     `Escolha:\n` +
                     `👑 Upgrade Premium (acesso ilimitado)\n` +
                     `🔄 Tentar outra área\n` +
                     `⏰ Voltar amanhã`;
      
      alert(message);
      
      // ✅ SUGERIR UPGRADE
      if (confirm('Fazer upgrade para Premium agora?')) {
        this.upgradeToPro();
      }
    }
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
