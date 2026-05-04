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
      answer: 'Você tem <strong>7 tentativas por dia</strong> com nosso sistema Pool Fixo (15 questões que mudam semanalmente). Sem cartão de crédito, sem compromisso.'
    },
    {
      question: 'O que é Pool Fixo?',
      answer: 'Pool Fixo é um conjunto de 15 questões que você estuda diariamente. Cada dia recebe 7 questões diferentes do pool, garantindo estudo focado e evitando memorização.'
    },
    {
      question: 'Como funciona o Contador de Streak?',
      answer: 'O Streak rastreia quantos dias consecutivos você pratica. Acumule 7 dias de streak para desbloquear um teste do plano Premium e ver toda a plataforma!'
    },
    {
      question: 'Como acessar as questões premium?',
      answer: 'Faça um upgrade para o plano Premium (R$ 39,90/mês) e tenha acesso ilimitado a 3.000+ questões sem restrições de Pool Fixo.'
    },
    {
      question: 'Posso cancelar quando quiser?',
      answer: 'Sim! Não há fidelidade. Você pode cancelar a qualquer momento na sua conta. O acesso premium continua até o fim do período já pago.'
    },
    {
      question: 'Minhas dúvidas não foram respondidas. O que faço?',
      answer: 'Use o botão abaixo para falar conosco por e-mail. Respondemos rapidamente!'
    }
  ];

  constructor(private router: Router) {}

  openEmail() {
    window.location.href = 'mailto:sowlfy.contact@gmail.com?subject=Ajuda%20-%20SOWLFY';
  }

  closeHelp() {
    this.router.navigate(['/']);
  }
}
