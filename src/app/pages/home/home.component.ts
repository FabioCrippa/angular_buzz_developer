import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category?: 'pricing' | 'platform' | 'technical' | 'support';
}

interface SocialProof {
  number: string;
  label: string;
  icon?: string;
}

interface TechStack {
  id: string;
  name: string;
  icon: string;
  questionCount: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  popular?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  
  // ✅ PROPRIEDADES NECESSÁRIAS
  currentYear = new Date().getFullYear();
  activeFaq = -1;
  
  // ✅ FAQs DATA
  faqs = [
    {
      question: 'Como funciona o plano gratuito?',
      answer: 'Você tem 3 tentativas grátis por dia em todas as 4 áreas de conhecimento. É perfeito para experimentar a plataforma e começar sua preparação sem custos.'
    },
    {
      question: 'Posso cancelar a assinatura a qualquer momento?',
      answer: 'Sim! Você pode cancelar sua assinatura a qualquer momento sem burocracias. Se cancelar nos primeiros 7 dias, não será cobrado nada.'
    },
    {
      question: 'As questões são atualizadas?',
      answer: 'Sim! Nossa equipe atualiza constantemente o banco de questões. Temos mais de <strong>1.500 questões atualizadas</strong> baseadas nos editais e tendências mais recentes.'
    },
    {
      question: 'Funciona para concursos e vagas tech?',
      answer: 'Exato! Nossa plataforma é única por cobrir tanto <strong>concursos públicos</strong> (Português, Matemática, Informática) quanto <strong>vagas tech</strong> (JavaScript, React, Angular, etc.).'
    },
    {
      question: 'Tem versão mobile?',
      answer: 'Sim! Nossa plataforma é 100% responsiva e funciona perfeitamente no celular, tablet e desktop. Estude onde e quando quiser.'
    },
    {
      question: 'Como funciona o plano de estudo IA?',
      answer: 'No plano premium, nossa IA analisa seu desempenho e cria planos de estudo personalizados, identificando suas <strong>pontos fracos</strong> e sugerindo o que estudar primeiro.'
    }
  ];

  constructor(private router: Router) {}

  // ✅ MÉTODOS PARA FAQs
  toggleFaq(index: number): void {
    this.activeFaq = this.activeFaq === index ? -1 : index;
  }

  // ✅ MÉTODOS DE NAVEGAÇÃO
  startFreeTrial(): void {
    console.log('Iniciando teste grátis...');
    // Implementar: navegar para registro ou login
    // this.router.navigate(['/register']);
  }

  upgradeToPro(): void {
    console.log('Upgrade para plano Pro...');
    // Implementar: navegar para checkout ou upgrade
    // this.router.navigate(['/checkout']);
  }

  goToDashboard(): void {
    console.log('Navegando para dashboard...');
    // Implementar: navegar para dashboard
    // this.router.navigate(['/dashboard']);
  }

  goToArea(area: string): void {
    console.log(`Navegando para área: ${area}`);
    // Implementar: navegar para área específica
    // this.router.navigate(['/areas', area]);
  }
}
