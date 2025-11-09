// ===============================================
// 📱 HOME COMPONENT - VERSÃO FINAL SOWLFY
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app\pages\home\home.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FreeTrialService } from '../../core/services/free-trial.service';
import { ProgressService } from '../../core/services/progress.service';

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
      answer: 'No plano gratuito você tem <strong>3 tentativas por dia</strong> em qualquer uma das 4 áreas. É perfeito para conhecer a plataforma e começar seus estudos!'
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
      question: 'Vocês oferecem certificados?',
      answer: 'Sim! Usuários premium recebem <strong>certificados digitais</strong> ao completar módulos de estudo e atingir metas de performance.'
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
    private progressService: ProgressService
  ) {}
  
  ngOnInit(): void {
    console.log('🏠 SOWLFY Home carregada');
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
      
      console.log('📊 Stats atualizadas:', this.heroStats);
    } catch (error) {
      console.warn('⚠️ Erro ao carregar stats dinâmicas:', error);
    }
  }
  
  // ✅ INICIAR TESTE GRÁTIS
  startFreeTrial(): void {
    console.log('🆓 Iniciando teste grátis...');
    
    // ✅ VERIFICAR SE AINDA TEM TENTATIVAS
    const remaining = this.freeTrialService.getRemainingAttempts('desenvolvimento-web');
    
    if (remaining > 0) {
      this.router.navigate(['/dashboard']);
    } else {
      // ✅ SEM TENTATIVAS - MOSTRAR UPGRADE
      this.upgradeToPro();
    }
  }
  
  // ✅ IR PARA DASHBOARD
  goToDashboard(): void {
    console.log('📊 Navegando para dashboard...');
    this.router.navigate(['/dashboard']);
  }
  
  // ✅ IR PARA ÁREA ESPECÍFICA
  goToArea(areaName: string): void {
    console.log(`📁 Navegando para área: ${areaName}`);
    
    // ✅ MAPEAR NOMES PARA ROTA CORRETA
    const areaMap: { [key: string]: string } = {
      'desenvolvimento': 'desenvolvimento-web',
      'portugues': 'portugues',
      'matematica': 'matematica',
      'informatica': 'informatica'
    };
    
    const mappedArea = areaMap[areaName] || areaName;
    
    this.router.navigate(['/quiz'], {
      queryParams: {
        mode: 'area',
        area: mappedArea,
        count: 5
      }
    });
  }
  
  // ✅ UPGRADE PARA PRO
  upgradeToPro(): void {
    console.log('👑 Upgrade para Premium...');
    
    // ✅ SIMULAR UPGRADE (remover em produção)
    const isPremium = localStorage.getItem('isPremium') === 'true';
    
    if (!isPremium) {
      // ✅ ATIVAR PREMIUM
      localStorage.setItem('isPremium', 'true');
      localStorage.setItem('premiumActivatedAt', new Date().toISOString());
      
      alert('🎉 Premium ativado! Agora você tem acesso ilimitado a todas as funcionalidades!');
      
      // ✅ RECARREGAR PARA APLICAR MUDANÇAS
      window.location.reload();
    } else {
      alert('👑 Você já é Premium! Aproveite todos os recursos ilimitados.');
    }
  }
  
  // ✅ CONTROLE DE FAQ
  toggleFaq(index: number): void {
    this.activeFaq = this.activeFaq === index ? null : index;
  }
  
  // ✅ LINKS DO FOOTER
  openHelp(): void {
    console.log('❓ Abrindo central de ajuda...');
    alert('🚧 Central de Ajuda em desenvolvimento!\n\nPor enquanto, use os FAQs abaixo para tirar suas dúvidas.');
  }
  
  openTerms(): void {
    console.log('📄 Abrindo termos de uso...');
    alert('📋 Termos de Uso\n\nO SOWLFY é uma plataforma educacional para preparação profissional.\n\n- Uso responsável da plataforma\n- Conteúdo para fins educacionais\n- Política de cancelamento flexível');
  }
  
  openPrivacy(): void {
    console.log('🔒 Abrindo política de privacidade...');
    alert('🛡️ Política de Privacidade\n\nSeus dados estão seguros conosco:\n\n- Dados armazenados localmente\n- Não compartilhamos informações pessoais\n- Conformidade com LGPD\n- Criptografia SSL');
  }
}
