import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentServiceSimple {
  
  private readonly API_URL = environment.apiUrl;
  
  constructor(private http: HttpClient) {}
  
  // Criar assinatura e redirecionar para Mercado Pago
  createSubscription(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/api/payments/create-subscription`, { email })
      .pipe(
        tap((response: any) => {
          // Redirecionar para o checkout do Mercado Pago
          if (response.init_point) {
            window.location.href = response.init_point;
          }
        })
      );
  }
}
