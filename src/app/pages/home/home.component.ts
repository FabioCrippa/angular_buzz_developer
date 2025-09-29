import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface FAQ {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  
  // ✅ DADOS DA LANDING PAGE - SIMPLIFICADO
  totalQuestions = 558;
  totalTechnologies = 18;
  activeFaq: number | null = null;
  
  // ✅ FAQs ESPECÍFICOS PARA DEVS
  faqs: FAQ[] = [
    {
      question: 'Quantas tentativas tenho no plano gratuito?',
      answer: 'No plano gratuito você tem <strong>3 tentativas por dia</strong>, que renovam automaticamente a cada 24 horas. É perfeito para testar nossa plataforma!'
    },
    {
      question: 'Posso cancelar a assinatura a qualquer momento?',
      answer: '<strong>Sim, sem pegadinhas!</strong> Você pode cancelar quando quiser, sem taxas ou multas. Seu acesso premium continuará até o fim do período já pago.'
    },
    {
      question: 'As questões são baseadas em entrevistas reais?',
      answer: '<strong>Absolutamente!</strong> Todas as questões são baseadas em entrevistas reais de empresas como Google, Facebook, Amazon, Nubank, XP Inc e outras grandes techs.'
    },
    {
      question: 'Como funcionam as dicas de entrevista?',
      answer: 'Cada questão premium vem com <strong>dicas específicas</strong> de como responder em entrevistas reais, baseadas em experiências de recrutadores e tech leads.'
    },
    {
      question: 'Funciona no celular?',
      answer: '<strong>Perfeitamente!</strong> Nossa plataforma é totalmente responsiva e funciona em qualquer dispositivo - celular, tablet ou desktop.'
    },
    {
      question: 'Que tecnologias estão disponíveis?',
      answer: 'Temos questões de <strong>JavaScript, React, Angular, TypeScript, HTML, CSS, Node.js, DevOps, Scrum</strong> e muitas outras. Total de <strong>18 tecnologias</strong>!'
    }
  ];

  constructor(private router: Router) {}

  // ✅ NAVEGAÇÃO
  startFreeTrial(): void {
    this.router.navigate(['/dashboard']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToTech(tech: string): void {
    this.router.navigate(['/quiz', tech]);
  }

  // ✅ UPGRADE (FUTURO: INTEGRAÇÃO STRIPE)
  upgradeToPro(): void {
    alert('🚀 Redirecionando para página de assinatura...\n\n' +
          '✨ 7 dias grátis\n' +
          '💰 R$ 29,90/mês após teste\n' +
          '❌ Cancele quando quiser');
    
    // TODO: Implementar integração com Stripe
    // this.router.navigate(['/upgrade']);
  }

  // ✅ FAQ TOGGLE
  toggleFaq(index: number): void {
    this.activeFaq = this.activeFaq === index ? null : index;
  }
}
