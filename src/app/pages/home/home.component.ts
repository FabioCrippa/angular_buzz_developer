import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service'; // ✅ ADICIONAR

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
  totalQuestions: number = 2500;
  totalAreas: number = 4;
  successRate: number = 92;
  
  // ✅ ÁREAS (INICIALIZAR COMO ARRAY VAZIO)
  areas: AreaData[] = [];
  
  // ✅ FAQ DATA (USADO NO TEMPLATE)
  faqs: FAQ[] = [
    {
      question: 'Como funciona o plano gratuito?',
      answer: 'Você tem <strong>3 tentativas gratuitas por dia</strong> em cada área de estudo. Sem cartão de crédito, sem compromisso. Perfeito para conhecer a plataforma!'
    },
    {
      question: 'Quais áreas estão disponíveis?',
      answer: '<strong>4 áreas completas:</strong><br>• Desenvolvimento Web (React, Angular, JavaScript)<br>• Português (Gramática, interpretação, redação)<br>• Matemática (Raciocínio lógico, estatística)<br>• Informática (Windows, Office, conceitos TI)'
    },
    {
      question: 'As questões são atualizadas?',
      answer: 'Sim! Nossa base tem <strong>mais de 2.500+ questões</strong> constantemente atualizadas com base nos editais mais recentes e tendências do mercado tech.'
    },
    {
      question: 'Posso cancelar quando quiser?',
      answer: 'Absolutamente! Não há fidelidade. Você pode cancelar a qualquer momento no painel de controle. Se cancelar nos primeiros 7 dias, não paga nada!'
    },
    {
      question: 'Como funciona o teste grátis de 7 dias?',
      answer: 'Você tem acesso completo a todas as funcionalidades premium por 7 dias. Após esse período, será cobrado R$ 39,90/mês. Pode cancelar a qualquer momento.'
    },
    
  ];

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService, // ✅ ADICIONAR
    private snackBar?: MatSnackBar // ✅ OPCIONAL
  ) {}

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
    return [
      {
        name: 'desenvolvimento',
        displayName: 'Desenvolvimento Web',
        icon: '💻',
        description: 'Front-end, Metodologias, Design, Segurança, Entrevista Técnica',
        questionCount:
          (indexData.stats.byArea['desenvolvimento-web'] || 0) +
          (indexData.stats.byArea['metodologias'] || 0) +
          (indexData.stats.byArea['design'] || 0) +
          (indexData.stats.byArea['seguranca'] || 0) +
          (indexData.stats.byArea['entrevista'] || 0),
        subjects: [
          ...(indexData.structure['desenvolvimento-web'] || []),
          ...(indexData.structure['metodologias'] || []),
          ...(indexData.structure['design'] || []),
          ...(indexData.structure['seguranca'] || []),
          ...(indexData.structure['entrevista'] || [])
        ],
        features: [
          'Metodologias Ágeis',
          'Design UI/UX',
          'Segurança Web',
          'Entrevista Técnica'
        ],
        badge: 'Tech',
        badgeClass: 'tech-badge'
      },
      {
        name: 'portugues',
        displayName: 'Língua Portuguesa',
        icon: '📚',
        description: 'Gramática, interpretação e redação para concursos',
        questionCount: indexData.stats.byArea['portugues'] || 0,
        subjects: indexData.structure['portugues'] || [],
        features: [
          'Gramática completa',
          'Interpretação de textos',
          'Redação oficial'
        ],
        badge: 'Concursos',
        badgeClass: 'concursos-badge'
      },
      {
        name: 'matematica',
        displayName: 'Matemática & Raciocínio Lógico',
        icon: '🧮',
        description: 'Matemática básica, avançada e raciocínio lógico',
        questionCount: indexData.stats.byArea['matematica'] || 0,
        subjects: indexData.structure['matematica'] || [],
        features: [
          'Matemática básica',
          'Matemática avançada',
          'Raciocínio lógico'
        ],
        badge: 'Concursos',
        badgeClass: 'concursos-badge'
      },
      {
        name: 'informatica',
        displayName: 'Informática',
        icon: '🖥️',
        description: 'Windows, Office, TI e atualidades tecnológicas',
        questionCount: indexData.stats.byArea['informatica'] || 0,
        subjects: indexData.structure['informatica'] || [],
        features: [
          'Windows e Office',
          'Conceitos de TI',
          'Atualidades tecnológicas'
        ],
        badge: 'Concursos',
        badgeClass: 'concursos-badge'
      }
    ];
  }

  // ✅ DADOS DE FALLBACK CASO A API FALHE
  private setupFallbackData() {
    console.log('🔄 Usando dados de fallback');

    this.totalQuestions = 2500;
    this.totalAreas = 4;
    this.successRate = 92;
    
    // Corrija o array para conter só as áreas principais:
    this.areas = [
      {
        name: 'desenvolvimento',
        displayName: 'Desenvolvimento Web',
        icon: '💻',
        description: 'React, Angular, JavaScript, Metodologias, Design, Segurança e Entrevista Técnica',
        questionCount: 500,
        subjects: ['React', 'Angular', 'JavaScript', 'Metodologias', 'Design', 'Segurança', 'Entrevista'],
        features: [
          'Metodologias Ágeis',
          'Design UI/UX',
          'Segurança Web',
          'Entrevista Técnica'
        ],
        badge: 'Tech',
        badgeClass: 'tech-badge'
      },
      {
        name: 'portugues',
        displayName: 'Língua Portuguesa',
        icon: '📚',
        description: 'Gramática, interpretação e redação para concursos',
        questionCount: 400,
        subjects: ['Gramática', 'Interpretação', 'Redação'],
        features: [
          'Gramática completa',
          'Interpretação de textos',
          'Redação oficial'
        ],
        badge: 'Concursos',
        badgeClass: 'concursos-badge'
      },
      {
        name: 'matematica',
        displayName: 'Matemática & Raciocínio Lógico',
        icon: '🧮',
        description: 'Matemática básica, avançada e raciocínio lógico',
        questionCount: 350,
        subjects: ['Matemática', 'Raciocínio Lógico'],
        features: [
          'Matemática básica',
          'Matemática avançada',
          'Raciocínio lógico'
        ],
        badge: 'Concursos',
        badgeClass: 'concursos-badge'
      },
      {
        name: 'informatica',
        displayName: 'Informática',
        icon: '🖥️',
        description: 'Windows, Office, TI e atualidades tecnológicas',
        questionCount: 250,
        subjects: ['Windows', 'Office', 'TI'],
        features: [
          'Windows e Office',
          'Conceitos de TI',
          'Atualidades tecnológicas'
        ],
        badge: 'Concursos',
        badgeClass: 'concursos-badge'
      }
    ];
  }

  // ✅ MÉTODOS DE NAVEGAÇÃO (USADOS NO TEMPLATE)
  goToQuizArea(area: string) {
    this.router.navigate(['/quiz', area]);
    console.log(`🎯 Navegando para área do quiz: ${area}`);
    
    const areaRoutes: { [key: string]: string } = {
      'desenvolvimento': 'desenvolvimento-web',
      'portugues': 'portugues', 
      'matematica': 'matematica',
      'informatica': 'informatica'
    };
    
    const routeArea = areaRoutes[area] || area;
    this.router.navigate(['/quiz', routeArea]);
  }

  // ✅ MÉTODO CORRIGIDO PARA INICIAR TESTE GRÁTIS
  startFreeTrial(): void {
  console.log('🎯 Iniciando teste grátis...');
  this.router.navigate(['/quiz']);
  
  // ✅ TESTE DE DIAGNÓSTICO
  const isAuth = this.authService.isAuthenticated();
  console.log('🔍 AuthService.isAuthenticated():', isAuth);
  console.log('🔍 AuthService objeto:', this.authService);
  
  // ✅ TESTE FORÇADO - IGNORAR AUTENTICAÇÃO TEMPORARIAMENTE
  if (true) { // FORÇAR SEMPRE TRUE PARA TESTE
    console.log('✅ Navegando diretamente para quiz...');
    this.router.navigate(['/quiz'], {
      queryParams: {
        mode: 'mixed',
        type: 'free-trial',
        limit: 10
      }
    });
    return;
  }
  
    // ✅ VERIFICAR AUTENTICAÇÃO
    if (this.authService.isAuthenticated()) {
      // Usuário logado - vai direto para quiz
      this.router.navigate(['/quiz'], {
        queryParams: {
          mode: 'mixed',
          type: 'free-trial',
          limit: 10
        }
      });
    } else {
      // ✅ USUÁRIO NÃO LOGADO - IR PARA LOGIN
      this.showSuccessMessage('Redirecionando para login...');
      
      setTimeout(() => {
        this.router.navigate(['/login'], {
          queryParams: {
            returnUrl: '/quiz',
            mode: 'mixed',
            type: 'free-trial'
          }
        });
      }, 500);
    }
  }

  // ✅ MÉTODO PARA IR DIRETAMENTE AO DASHBOARD
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
    console.log('📊 Navegando para dashboard...');
    
    // ✅ VERIFICAR AUTENTICAÇÃO
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      // ✅ USUÁRIO NÃO LOGADO - IR PARA LOGIN
      this.showSuccessMessage('Faça login para acessar o dashboard');
      
      setTimeout(() => {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/dashboard' }
        });
      }, 500);
    }
  }

  // ✅ MÉTODO PARA IR A UMA ÁREA ESPECÍFICA
  goToArea(areaName: string): void {
    this.router.navigate(['/area', areaName]);
    console.log(`📖 Navegando para área: ${areaName}`);
    
    const areaMapping: { [key: string]: string } = {
      'desenvolvimento': 'desenvolvimento-web',
      'portugues': 'portugues',
      'matematica': 'matematica',
      'informatica': 'informatica'
    };
    
    const mappedArea = areaMapping[areaName] || areaName;
    
    // ✅ VERIFICAR AUTENTICAÇÃO
    if (this.authService.isAuthenticated()) {
      this.showSuccessMessage(`Carregando área: ${mappedArea}`);
      
      setTimeout(() => {
        this.router.navigate(['/area', mappedArea]);
      }, 500);
    } else {
      // ✅ USUÁRIO NÃO LOGADO - IR PARA LOGIN
      this.showSuccessMessage('Faça login para acessar esta área');
      
      setTimeout(() => {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: `/area/${mappedArea}` }
        });
      }, 500);
    }
  }

  // 🚀 MÉTODO PARA UPGRADE PRO
  upgradeToPro(): void {
    this.router.navigate(['/upgrade']);
    console.log('💎 Iniciando upgrade para plano Pro...');
  
  // ✅ VERIFICAR AUTENTICAÇÃO
  if (this.authService.isAuthenticated()) {
    this.router.navigate(['/upgrade'], {
      queryParams: {
        source: 'home-cta',
        plan: 'monthly',
        timestamp: Date.now()
      }
    });
    this.showSuccessMessage('Carregando planos premium...');
  } else {
    // ✅ USUÁRIO NÃO LOGADO - IR PARA LOGIN
    this.showSuccessMessage('Faça login para ver os planos premium');
    
    setTimeout(() => {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/upgrade' }
      });
    }, 500);
  }
}

  // 🆘 MÉTODO PARA CENTRAL DE AJUDA
  openHelp(): void {
  this.router.navigate(['/help']);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

  // 📄 MÉTODO PARA TERMOS DE USO
  openTerms(): void {
  this.router.navigate(['/termos']);
}

// 📄 MÉTODO PARA PRIVACIDADE
openPrivacy(): void {
  this.router.navigate(['/privacidade']);
}

  // ❓ MÉTODO PARA FAQ
  toggleFaq(index: number): void {
    console.log(`❓ Toggling FAQ ${index}`);
    
    // ✅ ALTERNAR FAQ ATIVO
    if (this.activeFaq === index) {
      this.activeFaq = -1; // Fechar se já estiver aberto
    } else {
      this.activeFaq = index; // Abrir o selecionado
    }
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

  // ✅ SE NÃO EXISTIR, ADICIONAR ESTE MÉTODO TAMBÉM
  private showSuccessMessage(message: string): void {
    // ✅ SE VOCÊ TEM MatSnackBar
    if (this.snackBar) {
      this.snackBar.open(message, 'Fechar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } else {
      // ✅ FALLBACK SIMPLES
      console.log('✅ Success:', message);
    }
  }
}
