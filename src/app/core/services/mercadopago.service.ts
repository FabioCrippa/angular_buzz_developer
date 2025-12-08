// ===============================================
// 💳 MERCADO PAGO SERVICE - SOWLFY
// ===============================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Declaração global para Mercado Pago
declare global {
  interface Window {
    MercadoPago: any;
  }
}

export interface MercadoPagoPlan {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}

export interface PaymentPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface PaymentInfo {
  id: string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  date_approved?: string;
  external_reference?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MercadopagoService {

  // ✅ CONFIGURAÇÕES
  private readonly API_URL = 'http://localhost:3000';
  private readonly MP_PUBLIC_KEY = 'APP_USR-d11ca329-064b-4623-af41-1b56a4f75eb0';
  
  // ✅ STATE MANAGEMENT
  private mpLoadedSubject = new BehaviorSubject<boolean>(false);
  private paymentLoadingSubject = new BehaviorSubject<boolean>(false);
  private currentPreferenceSubject = new BehaviorSubject<PaymentPreference | null>(null);
  
  public mpLoaded$ = this.mpLoadedSubject.asObservable();
  public isPaymentLoading$ = this.paymentLoadingSubject.asObservable();
  public currentPreference$ = this.currentPreferenceSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.initializeMercadoPago();
  }

  // ===============================================
  // 🔧 INICIALIZAÇÃO
  // ===============================================

  private async initializeMercadoPago(): Promise<void> {
    try {
      
      // Carregar o script do Mercado Pago dinamicamente
      await this.loadMercadoPagoScript();
      
      if (window.MercadoPago) {
        const mp = new window.MercadoPago(this.MP_PUBLIC_KEY, {
          locale: 'pt-BR'
        });
        
        this.mpLoadedSubject.next(true);
      }
      
    } catch (error) {
      this.mpLoadedSubject.next(false);
    }
  }

  private loadMercadoPagoScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar se já foi carregado
      if (window.MercadoPago) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar SDK do Mercado Pago'));
      document.head.appendChild(script);
    });
  }

  // ===============================================
  // 📋 OBTER PLANOS DISPONÍVEIS
  // ===============================================

  getPlans(): Observable<MercadoPagoPlan[]> {
    return this.http.get<{ success: boolean; plans: MercadoPagoPlan[] }>(
      `${this.API_URL}/api/payments/plans`
    ).pipe(
      map(response => response.plans),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // ===============================================
  // 💳 CRIAR PREFERÊNCIA DE PAGAMENTO
  // ===============================================

  createPreference(planId: string): Observable<PaymentPreference> {
    this.paymentLoadingSubject.next(true);

    const token = localStorage.getItem('sowlfy_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Obter dados do usuário do localStorage
    const userStr = localStorage.getItem('sowlfy_user');
    if (!userStr) {
      this.paymentLoadingSubject.next(false);
      return throwError(() => new Error('Usuário não autenticado'));
    }

    const user = JSON.parse(userStr);
    const payload = {
      planId: planId,
      userId: user.id,
      userEmail: user.email
    };

    return this.http.post<{
      success: boolean;
      preference: PaymentPreference;
      plan: MercadoPagoPlan;
    }>(
      `${this.API_URL}/api/payments/create-preference`,
      payload,
      { headers }
    ).pipe(
      map(response => response.preference),
      tap(preference => {
        this.currentPreferenceSubject.next(preference);
        this.paymentLoadingSubject.next(false);
      }),
      catchError(error => {
        this.paymentLoadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // ===============================================
  // 🚀 REDIRECIONAR PARA CHECKOUT
  // ===============================================

  redirectToCheckout(planId: string): Observable<void> {
    return new Observable(observer => {
      this.createPreference(planId).subscribe({
        next: (preference) => {
          try {
            // Em sandbox, usar sandbox_init_point
            // Em produção, usar init_point
            const checkoutUrl = preference.sandbox_init_point || preference.init_point;
            
            if (checkoutUrl) {
              window.location.href = checkoutUrl;
              observer.next();
              observer.complete();
            } else {
              observer.error(new Error('URL de checkout não disponível'));
            }
          } catch (err) {
            observer.error(err);
          }
        },
        error: (err) => observer.error(err)
      });
    });
  }

  // ===============================================
  // 🔍 VERIFICAR STATUS DO PAGAMENTO
  // ===============================================

  verifyPayment(collectionId: string, externalReference?: string): Observable<PaymentInfo> {
    const token = localStorage.getItem('sowlfy_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    let params: any = { collection_id: collectionId };
    if (externalReference) {
      params.external_reference = externalReference;
    }

    return this.http.get<{
      success: boolean;
      approved: boolean;
      payment: PaymentInfo;
    }>(
      `${this.API_URL}/api/payments/verify-payment`,
      { headers, params }
    ).pipe(
      map(response => response.payment),
      tap(payment => {
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // ===============================================
  // 🔍 OBTER INFORMAÇÕES DO PAGAMENTO
  // ===============================================

  getPaymentInfo(paymentId: string): Observable<PaymentInfo> {
    const token = localStorage.getItem('sowlfy_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<{
      success: boolean;
      payment: PaymentInfo;
    }>(
      `${this.API_URL}/api/payments/payment/${paymentId}`,
      { headers }
    ).pipe(
      map(response => response.payment),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // ===============================================
  // 🛠️ HELPER METHODS
  // ===============================================

  isMercadoPagoReady(): boolean {
    return this.mpLoadedSubject.value;
  }

  formatPrice(price: number, currency: string = 'BRL'): string {
    if (price === 0) return 'Grátis';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  // ===============================================
  // 🧪 MOCK PARA TESTES
  // ===============================================

  mockActivatePremium(planId: string): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        localStorage.setItem('isPremium', 'true');
        localStorage.setItem('premiumPlan', planId);
        localStorage.setItem('premiumActivatedAt', new Date().toISOString());
        
        observer.next(true);
        observer.complete();
      }, 2000);
    });
  }
}
