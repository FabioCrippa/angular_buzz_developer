import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface AreaData {
  name: string;
  displayName: string;
  questionCount: number;
  subjects: string[];
  icon: string;
  description: string;
  features: string[];
  badge: string;
  badgeClass: string;
}

interface IndexData {
  appInfo: {
    name: string;
    version: string;
    description: string;
  };
  stats: {
    totalQuestions: number;
    byArea: { [key: string]: number };
  };
  structure: { [key: string]: string[] };
}

interface FAQ {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  // ✅ ESTADOS DO COMPONENTE
  activeFaq: number | null = null;
  currentYear: number = new Date().getFullYear();
  isLoading: boolean = true;
  
  // ✅ DADOS DINÂMICOS (OBRIGATÓRIOS PARA O TEMPLATE)
  totalQuestions: number = 1500;
  totalAreas: number = 4;
  successRate: number = 92;
  
  // ✅ ÁREAS (INICIALIZAR COMO ARRAY VAZIO)
  areas: AreaData[] = [];
  
  // ✅ FAQ DATA (USADO NO TEMPLATE)
  faqs: FAQ[] = [
    {
      question: 'Como funciona o plano gratuito?',
      answer: 'Você tem <strong>3 tentativas gratuitas por dia</strong> para testar todas as 4 áreas de estudo. Sem cartão de crédito, sem compromisso. Perfeito para conhecer a plataforma!'
    },
    {
      question: 'Quais áreas estão disponíveis?',
      answer: '<strong>4 áreas completas:</strong><br>• Desenvolvimento Web (React, Angular, JavaScript)<br>• Português (Gramática, interpretação, redação)<br>• Matemática (Raciocínio lógico, estatística)<br>• Informática (Windows, Office, conceitos TI)'
    },
    {
      question: 'As questões são atualizadas?',
      answer: 'Sim! Nossa base tem <strong>mais de 1.500 questões</strong> constantemente atualizadas com base nos editais mais recentes e tendências do mercado tech.'
    },
    {
      question: 'Posso cancelar quando quiser?',
      answer: 'Absolutamente! Não há fidelidade. Você pode cancelar a qualquer momento no painel de controle. Se cancelar nos primeiros 7 dias, não paga nada!'
    },
    {
      question: 'Como funciona o teste grátis de 7 dias?',
      answer: 'Você tem <strong>acesso completo por 7 dias</strong> sem pagar nada. Depois disso, se não cancelar, cobra-se R$ 39,90/mês. Mas você pode cancelar a qualquer momento!'
    },
    {
      question: 'Tem suporte técnico?',
      answer: 'Sim! Temos suporte por chat e email para tirar suas dúvidas sobre a plataforma, questões ou planos de estudo.'
    }
  ];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    console.log('🏠 Home Component inicializado');
    this.loadHomeData();
  }

  // ✅ GETTER OBRIGATÓRIO PARA HERO STATS (USADO NO TEMPLATE)
  get heroStats() {
    return {
      totalQuestions: this.totalQuestions,
      totalAreas: this.totalAreas,
      successRate: this.successRate
    };
  }

  // ✅ CARREGAR DADOS REAIS DA API
  private loadHomeData() {
    this.http.get<IndexData>('assets/data/index.json').subscribe({
      next: (data) => {
        console.log('📊 Dados carregados:', data);
        
        // Atualizar stats
        this.totalQuestions = data.stats.totalQuestions;
        this.totalAreas = Object.keys(data.stats.byArea).length;
        
        // Construir áreas com dados reais
        this.areas = this.buildAreasFromData(data);
        this.isLoading = false;
        
        console.log('✅ Home carregada com sucesso:', {
          totalQuestions: this.totalQuestions,
          areas: this.areas.length
        });
      },
      error: (error) => {
        console.error('❌ Erro ao carregar dados:', error);
        this.setupFallbackData();
        this.isLoading = false;
      }
    });
  }

  // ✅ CONSTRUIR DADOS DAS ÁREAS COM CONFIGURAÇÃO MANUAL
  private buildAreasFromData(indexData: IndexData): AreaData[] {
    const areaConfigs = {
      'desenvolvimento-web': {
        displayName: 'Desenvolvimento Web',
        icon: '',
        description: 'Entrevistas técnicas e vagas tech',
        features: ['React & Angular', 'JavaScript/TypeScript', 'CSS & HTML5', 'Node.js & DevOps'],
        badge: 'Tech Jobs',
        badgeClass: 'advanced'
      },
      'portugues': {
        displayName: 'Língua Portuguesa',
        icon: '',
        description: 'Base fundamental dos concursos',
        features: ['Gramática completa', 'Interpretação de textos', 'Redação oficial', 'Questões CESPE/FCC'],
        badge: 'Concursos',
        badgeClass: 'fundamental'
      },
      'matematica': {
        displayName: 'Matemática & R.L.',
        icon: '',
        description: 'Raciocínio lógico essencial',
        features: ['Raciocínio lógico', 'Matemática básica', 'Porcentagem e juros', 'Estatística aplicada'],
        badge: 'Diferencial',
        badgeClass: 'intermediate'
      },
      'informatica': {
        displayName: 'Informática',
        icon: '',
        description: 'Tecnologia em crescimento',
        features: ['Windows 10/11', 'Office 365 completo', 'Internet e segurança', 'Conceitos de TI'],
        badge: 'Em Alta',
        badgeClass: 'advanced'
      }
    };

    return Object.entries(indexData.stats.byArea).map(([areaKey, questionCount]) => {
      const config = areaConfigs[areaKey as keyof typeof areaConfigs];
      const subjects = indexData.structure[areaKey] || [];
      
      return {
        name: areaKey,
        displayName: config?.displayName || this.capitalizeFirst(areaKey),
        questionCount: questionCount as number,
        subjects,
        icon: config?.icon || '',
        description: config?.description || 'Área de estudo importante',
        features: config?.features || ['Questões atualizadas', 'Explicações detalhadas'],
        badge: config?.badge || 'Disponível',
        badgeClass: config?.badgeClass || 'basic'
      };
    });
  }

  // ✅ DADOS DE FALLBACK CASO A API FALHE
  private setupFallbackData() {
    console.log('🔄 Usando dados de fallback');
    
    this.totalQuestions = 1500;
    this.totalAreas = 4;
    this.successRate = 92;
    
    this.areas = [
      {
        name: 'desenvolvimento-web',
        displayName: 'Desenvolvimento Web',
        questionCount: 558,
        subjects: ['React', 'Angular', 'JavaScript', 'TypeScript'],
        icon: '💻',
        description: 'Entrevistas técnicas e vagas tech',
        features: ['⚛️ React & Angular', '🟨 JavaScript/TypeScript', '🎨 CSS & HTML5', '🔧 Node.js & DevOps'],
        badge: 'Tech Jobs',
        badgeClass: 'advanced'
      },
      {
        name: 'portugues',
        displayName: 'Língua Portuguesa',
        questionCount: 428,
        subjects: ['Gramática', 'Interpretação', 'Redação'],
        icon: '📚',
        description: 'Base fundamental dos concursos',
        features: ['✏️ Gramática completa', '📖 Interpretação de textos', '📝 Redação oficial', '🏛️ Questões CESPE/FCC'],
        badge: 'Concursos',
        badgeClass: 'fundamental'
      },
      {
        name: 'matematica',
        displayName: 'Matemática & R.L.',
        questionCount: 312,
        subjects: ['Raciocínio Lógico', 'Matemática Básica'],
        icon: '🧮',
        description: 'Raciocínio lógico essencial',
        features: ['🧠 Raciocínio lógico', '📊 Matemática básica', '💰 Porcentagem e juros', '📈 Estatística aplicada'],
        badge: 'Diferencial',
        badgeClass: 'intermediate'
      },
      {
        name: 'informatica',
        displayName: 'Informática',
        questionCount: 202,
        subjects: ['Windows', 'Office', 'Hardware'],
        icon: '🖥️',
        description: 'Tecnologia em crescimento',
        features: ['🪟 Windows 10/11', '📊 Office 365 completo', '🌐 Internet e segurança', '🔒 Conceitos de TI'],
        badge: 'Em Alta',
        badgeClass: 'advanced'
      }
    ];
  }

  // ✅ MÉTODOS DE NAVEGAÇÃO (USADOS NO TEMPLATE)
  goToArea(area: string) {
    console.log(`🎯 Navegando para área: ${area}`);
    
    const areaRoutes: { [key: string]: string } = {
      'desenvolvimento': 'desenvolvimento-web',
      'portugues': 'portugues', 
      'matematica': 'matematica',
      'informatica': 'informatica'
    };
    
    const routeArea = areaRoutes[area] || area;
    this.router.navigate(['/quiz', routeArea]);
  }

  goToDashboard() {
    console.log('📊 Navegando para dashboard');
    this.router.navigate(['/dashboard']);
  }

  startFreeTrial() {
    console.log('🆓 Iniciando teste gratuito');
    this.router.navigate(['/quiz']);
  }

  upgradeToPro() {
    console.log('💎 Upgrade para Pro');
    this.router.navigate(['/quiz']);
  }

  toggleFaq(index: number) {
    console.log(`❓ Toggle FAQ ${index}`);
    this.activeFaq = this.activeFaq === index ? null : index;
  }

  // ✅ MÉTODOS DO FOOTER (OBRIGATÓRIOS PARA O TEMPLATE)
  openHelp() {
    console.log('❓ Abrindo central de ajuda');
    // TODO: Implementar modal ou página de ajuda
    alert('Central de Ajuda será implementada em breve!');
  }

  openTerms() {
    console.log('📄 Abrindo termos de uso');
    // TODO: Implementar modal ou página de termos
    alert('Termos de Uso serão implementados em breve!');
  }

  openPrivacy() {
    console.log('🔒 Abrindo política de privacidade');
    // TODO: Implementar modal ou página de privacidade
    alert('Política de Privacidade será implementada em breve!');
  }

  // ✅ MÉTODOS AUXILIARES
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
