import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent {
  faqs = [
    {
      question: 'Como funciona o plano gratuito?',
      answer: 'Você tem 3 tentativas gratuitas por dia em cada área de estudo. Sem cartão de crédito, sem compromisso.'
    },
    {
      question: 'Como acessar as questões premium?',
      answer: 'Basta fazer o upgrade para o plano Pro e liberar todas as funcionalidades.'
    },
    {
      question: 'Posso cancelar quando quiser?',
      answer: 'Sim! Não há fidelidade. Você pode cancelar a qualquer momento no painel de controle.'
    },
    {
      question: 'Minhas dúvidas não foram respondidas. O que faço?',
      answer: 'Use o botão abaixo para falar conosco por e-mail.'
    }
  ];

  constructor(private router: Router) {}

  openEmail() {
    window.location.href = 'mailto:suporte@quizzfy.com?subject=Ajuda%20-%20Quizzfy';
  }

  closeHelp() {
    this.router.navigate(['/']);
  }
}
