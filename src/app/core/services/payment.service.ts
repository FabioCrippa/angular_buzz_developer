// ===============================================
// 🔧 SUBSTITUIR TODO O CONTEÚDO DO PAYMENT.SERVICE.TS
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app\core\services\payment.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { loadStripe, Stripe } from '@stripe/stripe-js'; // ← NOVO IMPORT

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: 'BRL' | 'USD';
  interval: 'month' | 'year';
  intervalCount: number;
  features: string[];
  popular?: boolean;
  stripePriceId: string;
  trialDays?: number;
}

export interface CheckoutSession {
  id: string;
  url: string;
  status: 'pending' | 'complete' | 'expired';
  planId: string;
  amount: number;
  currency: string;
}

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  planId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  
  // ✅ CONFIGURAÇÕES
  private readonly API_URL = 'http://localhost:3000'; // ← BACKEND LOCAL
  private readonly STRIPE_PUBLIC_KEY = 'pk_test_51SSO1CPeMRCkgPBhhTGAFm950miNFGoiM3lmHquSOEtUj9vWK68NB2fbPMRqzS4PxHTThtnaUWrrUeDecYfV18ai00lpSDQElH';
  
  // ✅ STRIPE PROPERTIES
  private stripe: Stripe | null = null;
  private stripeLoaded = false;
  
  // ✅ STATE MANAGEMENT
  private currentSubscriptionSubject = new BehaviorSubject<Subscription | null>(null);
  private paymentLoadingSubject = new BehaviorSubject<boolean>(false);
  
  public currentSubscription$ = this.currentSubscriptionSubject.asObservable();
  public isPaymentLoading$ = this.paymentLoadingSubject.asObservable();

  // ✅ PLANOS (APENAS FREE + MENSAL)
  readonly plans: PaymentPlan[] = [
    {
      id: 'sowlfy-free',
      name: 'SOWLFY Free',
      price: 0,
      currency: 'BRL',
      interval: 'month',
      intervalCount: 1,
      stripePriceId: '',
      features: [
        '🆓 3 tentativas por dia',
        '📚 500+ questões básicas',
        '📊 Estatísticas simples',
        '📱 Acesso mobile',
        '🌐 Acesso web'
      ]
    },
    {
      id: 'sowlfy-pro-monthly',
      name: 'SOWLFY Pro',
      price: 29.90,
      currency: 'BRL',
      interval: 'month',
      intervalCount: 1,
      stripePriceId: 'price_dynamic', // Será criado dinamicamente
      popular: true,
      trialDays: 7,
      features: [
        '🚀 Tentativas ilimitadas',
        '📚 2.500+ questões premium',
        '📊 Relatórios detalhados',
        '🎯 Quiz inteligente',
        '⭐ Favoritos ilimitados',
        '📈 Analytics avançado',
        '💬 Suporte prioritário',
        '🔔 Notificações personalizadas'
      ]
    }
  ];

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('💳 PaymentService inicializado');
    this.initializeStripe();
    this.initializePaymentService();
  }

  // ✅ INICIALIZAR STRIPE
  private async initializeStripe(): Promise<void> {
    try {
      console.log('🔧 Carregando Stripe...');
      this.stripe = await loadStripe(this.STRIPE_PUBLIC_KEY, {
        locale: 'pt-BR'
      });
      
      if (this.stripe) {
        this.stripeLoaded = true;
        console.log('✅ Stripe carregado com sucesso!');
      } else {
        console.error('❌ Falha ao carregar Stripe');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar Stripe:', error);
    }
  }

  private initializePaymentService(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.loadCurrentSubscription().subscribe();
      } else {
        this.currentSubscriptionSubject.next(null);
      }
    });
  }

  // ✅ CRIAR CHECKOUT SESSION
  createCheckoutSession(planId: string): Observable<CheckoutSession> {
    const plan = this.getPlanById(planId);
    if (!plan || plan.price === 0) {
      return throwError(() => new Error('Plano inválido'));
    }

    this.paymentLoadingSubject.next(true);

    const payload = {
      planId: planId,
      successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/payment/cancel`
    };

    return this.http.post<CheckoutSession>(
      `${this.API_URL}/api/v1/payments/create-checkout`,
      payload
    ).pipe(
      tap(() => this.paymentLoadingSubject.next(false)),
      catchError(error => {
        this.paymentLoadingSubject.next(false);
        console.error('❌ Erro checkout:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ REDIRECIONAR PARA STRIPE
  redirectToCheckout(planId: string): Observable<void> {
    return new Observable(observer => {
      // Create the checkout session on the backend and use the returned URL to redirect the user.
      // This avoids relying on a typed `redirectToCheckout` method that may not exist on the Stripe type.
      this.createCheckoutSession(planId).subscribe({
        next: async (session) => {
          try {
            // If the backend returned a direct URL for the Checkout session, use it (recommended).
            if (session.url) {
              window.location.href = session.url;
              observer.next();
              observer.complete();
              return;
            }

            // Fallback: if the Stripe library is loaded and exposes redirectToCheckout, call it.
            // Cast to any to avoid TypeScript errors when the typed interface doesn't include the method.
            if (this.stripeLoaded && this.stripe && (this.stripe as any).redirectToCheckout) {
              const result = await (this.stripe as any).redirectToCheckout({
                sessionId: session.id
              });

              if (result && (result as any).error) {
                observer.error((result as any).error);
              } else {
                observer.next();
                observer.complete();
              }
              return;
            }

            observer.error(new Error('Nenhuma forma de redirecionamento disponível'));
          } catch (err) {
            observer.error(err);
          }
        },
        error: (err) => observer.error(err)
      });
    });
  }

  // ✅ VERIFICAR SE STRIPE ESTÁ PRONTO
  isStripeReady(): boolean {
    return this.stripeLoaded && !!this.stripe;
  }

  // ✅ HELPER METHODS
  getPlanById(planId: string): PaymentPlan | null {
    return this.plans.find(p => p.id === planId) || null;
  }

  getPopularPlan(): PaymentPlan | null {
    return this.plans.find(p => p.popular) || null;
  }

  formatPrice(price: number): string {
    if (price === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  loadCurrentSubscription(): Observable<Subscription | null> {
    return of(null); // Placeholder
  }

  // ✅ MOCK UPGRADE PARA TESTES
  mockUpgradeToPremium(planId: string = 'sowlfy-pro-monthly'): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        const mockSubscription: Subscription = {
          id: `mock_sub_${Date.now()}`,
          status: 'active',
          planId: planId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false
        };
        
        this.currentSubscriptionSubject.next(mockSubscription);
        
        // Atualizar localStorage
        localStorage.setItem('isPremium', 'true');
        
        observer.next(true);
        observer.complete();
      }, 2000);
    });
  }
}
