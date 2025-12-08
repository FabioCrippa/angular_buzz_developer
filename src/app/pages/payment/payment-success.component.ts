// ===============================================
// ✅ PÁGINA DE SUCESSO DO PAGAMENTO
// ===============================================

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MercadopagoService } from '../../core/services/mercadopago.service';
import { PremiumService } from '../../core/services/premium.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {
  
  isVerifying: boolean = true;
  paymentVerified: boolean = false;
  paymentInfo: any = null;
  errorMessage: string = '';
  countdown: number = 5;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private mercadoPagoService: MercadopagoService,
    private premiumService: PremiumService
  ) {}

  ngOnInit(): void {
    
    // Capturar parâmetros da URL
    this.route.queryParams.subscribe(params => {
      const collectionId = params['collection_id'];
      const collectionStatus = params['collection_status'];
      const paymentId = params['payment_id'];
      const externalReference = params['external_reference'];
      const preferenceId = params['preference_id'];
      
      this.paymentInfo = {
        id: collectionId || paymentId,
        status: collectionStatus,
        reference: externalReference
      };
      
      if (collectionId || paymentId) {
        this.verifyPayment(collectionId || paymentId, externalReference);
      } else {
        this.handleVerificationError('Nenhum ID de pagamento fornecido');
      }
    });
  }

  private verifyPayment(paymentId: string, externalReference?: string): void {
    this.isVerifying = true;
    
    this.mercadoPagoService.verifyPayment(paymentId, externalReference).subscribe({
      next: (payment) => {
        this.paymentInfo = payment;
        
        if (payment.status === 'approved') {
          this.paymentVerified = true;
          this.activatePremium();
          this.startCountdown();
        } else {
          this.handleVerificationError(`Pagamento com status: ${payment.status}`);
        }
        
        this.isVerifying = false;
      },
      error: (error) => {
        this.handleVerificationError('Erro ao verificar pagamento');
        this.isVerifying = false;
      }
    });
  }

  private activatePremium(): void {
    // Ativar premium no serviço local
    this.premiumService.activatePremium('monthly');
    
    // Salvar informações do pagamento
    localStorage.setItem('lastPaymentId', this.paymentInfo.id);
    localStorage.setItem('lastPaymentDate', new Date().toISOString());
    
  }

  private handleVerificationError(message: string): void {
    this.paymentVerified = false;
    this.errorMessage = message;
  }

  private startCountdown(): void {
    const interval = setInterval(() => {
      this.countdown--;
      
      if (this.countdown <= 0) {
        clearInterval(interval);
        this.redirectToDashboard();
      }
    }, 1000);
  }

  redirectToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToQuiz(): void {
    this.router.navigate(['/quiz']);
  }
}
