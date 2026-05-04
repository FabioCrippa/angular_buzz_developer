import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../core/services/payment.service';
import { MercadopagoService } from '../../core/services/mercadopago.service';
import { AuthService } from '../../core/services/auth.service';

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
      description: 'Comece sua prática com o Pool Fixo',
      features: [
        '7 tentativas por dia (Pool Fixo)',
        '15 questões rotacionadas diariamente',
        'Contador de Streak (gamificação)',
        'Explicações completas',
        'Acesso a 4 áreas de estudo'
      ],
      buttonText: 'Plano Atual',
      buttonColor: 'basic'
    },
    {
      id: 'monthly',
      name: 'Premium Mensal',
      price: 39.90,
      period: 'mês',
      description: 'Acesso ilimitado para acelerar seus estudos',
      features: [
        '✨ Tentativas ilimitadas todos os dias',
        '📚 Banco completo com 3.000+ questões',
        '🔓 Sem restrição de Pool Fixo',
        '💡 Explicações completas para cada questão',
        '📈 Acesso em todas as áreas de estudo',
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
      answer: 'Sim! Não há fidelidade. Você pode cancelar a qualquer momento na sua conta. O acesso premium continua até o fim do período já pago.'
    },
    {
      question: 'Qual é a diferença entre Free e Premium?',
      answer: 'No Free você pratica 7 questões por dia do nosso Pool Fixo com contador de streak (gamificação). No Premium, você tem acesso ilimitado a todas as questões do banco completo, sem restrições diárias.'
    },
    {
      question: 'Como funciona o Counter de Streak?',
      answer: 'O Streak rastreia quantos dias consecutivos você pratica. Quanto mais dias seguidos, maior sua motivação! Após 7 dias de streak, você já terá praticado bastante e estará pronto para aproveitar o Premium.'
    },
    {
      question: 'Que formas de pagamento vocês aceitam?',
      answer: 'Aceitamos todas as formas de pagamento via Mercado Pago: cartão de crédito, cartão de débito, PIX e boleto. Todos os pagamentos são 100% seguros.'
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
    private snackBar: MatSnackBar,
    private paymentService: PaymentService,
    private mercadoPagoService: MercadopagoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    
    // Capturar parâmetros da URL
    this.route.queryParams.subscribe(params => {
      this.source = params['source'] || 'direct';
      this.currentArea = params['area'] || '';
      this.currentScore = parseInt(params['score']) || 0;
    });
  }

  // ===============================================
  // 🎯 MÉTODOS DE INTERAÇÃO
  // ===============================================

  selectPlan(planId: string): void {
    this.selectedPlan = planId;

    // Analytics
    this.trackPlanSelection(planId);
  }

  async startCheckout(plan: PricingPlan): Promise<void> {
    if (this.isLoading) return;


    if (plan.id === 'free') {
      this.showMessage('Você já está no plano gratuito!');
      return;
    }

    this.isLoading = true;
    this.selectedPlan = plan.id;

    try {
      this.showMessage('Redirecionando para pagamento via Mercado Pago...');

      // Analytics
      this.trackCheckoutStart(plan);

      // ✅ REDIRECIONAR PARA MERCADO PAGO
      await this.redirectToMercadoPagoCheckout(plan);

    } catch (error) {
      this.showMessage('Erro ao processar pagamento. Tente novamente.', true);
      this.isLoading = false;
    }
  }

  private async redirectToMercadoPagoCheckout(plan: PricingPlan): Promise<void> {
    // ✅ Pegar usuário AUTENTICADO do AuthService (Firebase)
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      this.showMessage('❌ Você precisa estar logado para assinar. Redirecionando...', true);
      setTimeout(() => this.router.navigate(['/login']), 2000);
      this.isLoading = false;
      return;
    }
    
    const email = currentUser.email;
    const userId = currentUser.id;
    
    console.log('👤 Usuário autenticado:', { email, userId });
    
    // Chamar API para criar assinatura
    this.paymentService.createSubscription(email, userId).subscribe({
      next: (response: any) => {
        console.log('✅ Assinatura criada:', response);
        // O redirect acontece automaticamente para o Mercado Pago
      },
      error: (error) => {
        console.error('❌ Erro ao criar assinatura:', error);
        this.showMessage('Erro ao acessar o checkout. Tente novamente.', true);
        this.isLoading = false;
      }
    });
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

  public trackPlanSelection(planId: string): void {
    // Analytics tracking
  }

  private trackCheckoutStart(plan: PricingPlan): void {
    // Analytics tracking
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
