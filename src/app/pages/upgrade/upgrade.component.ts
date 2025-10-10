import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  description: string;
  features: string[];
  recommended?: boolean;
  badge?: string;
  buttonText: string;
  buttonColor: string;
}

interface FAQ {
  question: string;
  answer: string;
  expanded?: boolean;
}

@Component({
  selector: 'app-upgrade',
  standalone: true, // ✅ TORNAR STANDALONE
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.css']
})
export class UpgradeComponent implements OnInit {
  
  // ===============================================
  // 📊 PROPRIEDADES DO COMPONENT
  // ===============================================
  
  // Dados do usuário atual
  currentArea: string = '';
  currentScore: number = 0;
  source: string = '';
  
  // Estados da página
  isLoading: boolean = false;
  selectedPlan: string = 'monthly';
  
  // Planos disponíveis
  plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      period: 'sempre',
      description: 'Perfeito para conhecer a plataforma',
      features: [
        '3 tentativas por área/dia',
        '4 áreas de estudo',
        'Questões básicas',
        'Explicações simples'
      ],
      buttonText: 'Plano Atual',
      buttonColor: 'basic'
    },
    {
      id: 'monthly',
      name: 'Premium Mensal',
      price: 39.90,
      period: 'mês',
      description: 'Acesso completo para acelerar seus estudos',
      features: [
        '✨ Tentativas ilimitadas',
        '📊 Relatórios detalhados de performance',
        '🎯 Simulados personalizados',
        '📚 Conteúdo exclusivo premium',
        '📈 Análise completa de evolução',
        '🏆 Metas personalizadas',
        '🔄 Sincronização em tempo real',
        '💾 Backup automático do progresso'
      ],
      recommended: true,
      badge: 'RECOMENDADO',
      buttonText: 'Começar 7 Dias Grátis',
      buttonColor: 'primary'
    }
  ];
  
  // FAQ sobre premium
  faqs: FAQ[] = [
    {
      question: 'Como funciona o teste grátis de 7 dias?',
      answer: 'Você tem acesso completo ao plano premium por 7 dias. Se cancelar antes do fim do período, não paga nada. Após os 7 dias, a cobrança acontece automaticamente.'
    },
    {
      question: 'Posso cancelar a qualquer momento?',
      answer: 'Sim! Não há fidelidade. Você pode cancelar a qualquer momento no painel de controle. O acesso premium continua até o fim do período pago.'
    },
    {
      question: 'Que formas de pagamento vocês aceitam?',
      answer: 'Aceitamos cartão de crédito, débito, PIX. Todos os pagamentos são processados com segurança pelo Stripe/PagSeguro.'
    },
    {
      question: 'Quantas tentativas ilimitadas realmente significa?',
      answer: 'Significa que você pode fazer quantos quizzes quiser, quantas vezes quiser, em todas as áreas disponíveis, sem nenhuma limitação diária.'
    },
    {
      question: 'Os relatórios realmente ajudam nos estudos?',
      answer: 'Sim! Nossos relatórios mostram suas áreas de força e fraqueza, evolução ao longo do tempo, temas que precisa focar mais e sugestões personalizadas de estudo.'
    },
    
  ];
  
  // Depoimentos de usuários
  testimonials = [
    {
      name: 'Maria Silva',
      role: 'Aprovada em Concurso Público',
      avatar: '👩‍💼',
      text: 'Com o plano premium consegui focar nas minhas dificuldades. Os relatórios me ajudaram a ver exatamente onde precisava melhorar. Aprovada em 3 meses!',
      rating: 5
    },
    {
      name: 'João Santos',
      role: 'Dev Full Stack',
      avatar: '👨‍💻',
      text: 'As questões de programação são atualizadas e realmente refletem o mercado. O acesso ilimitado foi fundamental para minha preparação.',
      rating: 5
    },
    {
      name: 'Ana Costa',
      role: 'Estudante de TI',
      avatar: '👩‍🎓',
      text: 'Estava perdida nos estudos até descobrir os relatórios detalhados. Agora sei exatamente o que estudar e quando. Vale cada centavo!',
      rating: 5
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('🚀 Inicializando página de upgrade...');
    
    // Capturar parâmetros da URL
    this.route.queryParams.subscribe(params => {
      this.source = params['source'] || 'direct';
      this.currentArea = params['area'] || '';
      this.currentScore = parseInt(params['score']) || 0;
      
      console.log('📊 Parâmetros de upgrade:', {
        source: this.source,
        area: this.currentArea,
        score: this.currentScore
      });
    });
  }

  // ===============================================
  // 🎯 MÉTODOS DE INTERAÇÃO
  // ===============================================

  selectPlan(planId: string): void {
    this.selectedPlan = planId;
    console.log('📦 Plano selecionado:', planId);
    
    // Analytics
    this.trackPlanSelection(planId);
  }

  async startCheckout(plan: PricingPlan): Promise<void> {
    if (this.isLoading) return;
    
    console.log('💳 Iniciando checkout para:', plan.name);
    
    if (plan.id === 'free') {
      this.showMessage('Você já está no plano gratuito!');
      return;
    }
    
    this.isLoading = true;
    this.selectedPlan = plan.id; // ✅ DEFINIR PLANO SELECIONADO PARA LOADING
    
    try {
      // Simular processo de checkout
      this.showMessage('Redirecionando para pagamento...');
      
      // Analytics
      this.trackCheckoutStart(plan);
      
      // Aqui você integraria com Stripe, PagSeguro, etc.
      await this.simulateCheckout(plan);
      
    } catch (error) {
      console.error('❌ Erro no checkout:', error);
      this.showMessage('Erro ao processar pagamento. Tente novamente.', true);
    } finally {
      this.isLoading = false;
    }
  }

  private async simulateCheckout(plan: PricingPlan): Promise<void> {
    // Simular delay de checkout
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Por enquanto, apenas mostrar mensagem
    this.showMessage(`Checkout simulado para ${plan.name}. Funcionalidade em desenvolvimento!`);
  }

  toggleFaq(index: number): void {
    this.faqs[index].expanded = !this.faqs[index].expanded;
  }

  goBack(): void {
    if (this.source === 'quiz-completion') {
      this.router.navigate(['/quiz'], { 
        queryParams: { 
          area: this.currentArea,
          type: 'free-trial' 
        } 
      });
    } else {
      this.router.navigate(['/']);
    }
  }

  // ===============================================
  // 🎯 MÉTODOS UTILITÁRIOS
  // ===============================================

  getPlanBadgeClass(plan: PricingPlan): string {
    if (plan.recommended) return 'badge-popular';
    if (plan.badge === 'MELHOR VALOR') return 'badge-value';
    return '';
  }

  getPlanCardClass(plan: PricingPlan): string {
    let classes = 'pricing-card';
    if (plan.recommended) classes += ' recommended';
    if (this.selectedPlan === plan.id) classes += ' selected';
    return classes;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  getYearlySavings(): string {
    const monthly = this.plans.find(p => p.id === 'monthly')?.price || 0;
    const yearly = this.plans.find(p => p.id === 'yearly')?.price || 0;
    const savings = ((monthly - yearly) / monthly * 100);
    return Math.round(savings) + '%';
  }

  // ===============================================
  // 🔢 MÉTODOS AUXILIARES PARA TEMPLATE
  // ===============================================

  // ✅ HELPER PARA *ngFor DE ESTRELAS
  getStarsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  // ===============================================
  // 📊 ANALYTICS
  // ===============================================

  private trackPlanSelection(planId: string): void {
    console.log('📊 Analytics: Plano selecionado', {
      plan: planId,
      source: this.source,
      area: this.currentArea,
      score: this.currentScore
    });
  }

  private trackCheckoutStart(plan: PricingPlan): void {
    console.log('📊 Analytics: Checkout iniciado', {
      plan: plan.id,
      price: plan.price,
      source: this.source,
      area: this.currentArea
    });
  }

  private showMessage(message: string, isError: boolean = false): void {
    this.snackBar.open(message, 'Fechar', {
      duration: isError ? 6000 : 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: isError ? ['error-snackbar'] : ['success-snackbar']
    });
  }
}
