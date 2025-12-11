import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout-test',
  template: `
    <div style="padding: 40px; max-width: 600px; margin: 0 auto;">
      <h1>🛒 Teste de Checkout - Mercado Pago</h1>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>Plano Premium</h2>
        <p style="font-size: 32px; color: #009ee3; font-weight: bold;">
          R$ 39,90<span style="font-size: 16px;">/mês</span>
        </p>
        <ul>
          <li>✅ Questões ilimitadas</li>
          <li>✅ Estatísticas completas</li>
          <li>✅ Sem anúncios</li>
        </ul>
      </div>

      <div style="margin: 20px 0;">
        <label>Email:</label><br>
        <input 
          type="email" 
          [(ngModel)]="email" 
          placeholder="seu@email.com"
          style="width: 100%; padding: 10px; font-size: 16px; border: 1px solid #ddd; border-radius: 4px;">
      </div>

      <button 
        (click)="assinar()" 
        [disabled]="loading"
        style="width: 100%; padding: 15px; font-size: 18px; background: #009ee3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        {{ loading ? 'Processando...' : 'Assinar Agora' }}
      </button>

      <div *ngIf="error" style="margin-top: 20px; padding: 15px; background: #ffebee; color: #c62828; border-radius: 4px;">
        ❌ {{ error }}
      </div>

      <div *ngIf="success" style="margin-top: 20px; padding: 15px; background: #e8f5e9; color: #2e7d32; border-radius: 4px;">
        ✅ {{ success }}
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class CheckoutTestComponent {
  email = 'teste@sowlfy.com.br';
  loading = false;
  error = '';
  success = '';

  constructor(private http: HttpClient) {}

  assinar() {
    if (!this.email) {
      this.error = 'Digite um email válido';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.post(`${environment.apiUrl}/api/payments/create-subscription`, { email: this.email })
      .subscribe({
        next: (response: any) => {
          console.log('Resposta:', response);
          this.success = 'Redirecionando para pagamento...';
          
          // Redirecionar para Mercado Pago
          if (response.init_point) {
            setTimeout(() => {
              window.location.href = response.init_point;
            }, 1000);
          }
        },
        error: (err) => {
          console.error('Erro:', err);
          this.error = 'Erro ao criar assinatura: ' + (err.error?.error || err.message);
          this.loading = false;
        }
      });
  }
}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
