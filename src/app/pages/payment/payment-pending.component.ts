// ===============================================
// ⏳ PÁGINA DE PAGAMENTO PENDENTE
// ===============================================

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-pending',
  templateUrl: './payment-pending.component.html',
  styleUrls: ['./payment-pending.component.css']
})
export class PaymentPendingComponent implements OnInit {
  
  paymentId: string = '';
  paymentMethod: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['payment_id'] || params['collection_id'] || '';
      this.paymentMethod = params['payment_type_id'] || 'boleto';
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  checkStatus(): void {
    // Implementar verificação de status
    this.router.navigate(['/dashboard']);
  }
}
