// ===============================================
// ❌ PÁGINA DE FALHA DO PAGAMENTO
// ===============================================

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-failure',
  templateUrl: './payment-failure.component.html',
  styleUrls: ['./payment-failure.component.css']
})
export class PaymentFailureComponent implements OnInit {
  
  paymentId: string = '';
  reason: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['payment_id'] || params['collection_id'] || '';
      this.reason = params['status_detail'] || 'Pagamento não aprovado';
    });
  }

  tryAgain(): void {
    this.router.navigate(['/upgrade']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  contactSupport(): void {
    // Implementar contato com suporte
    window.open('mailto:suporte@sowlfy.com?subject=Problema com Pagamento&body=ID do Pagamento: ' + this.paymentId, '_blank');
  }
}
