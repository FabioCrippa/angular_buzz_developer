import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { QuizzComponent } from './pages/quizz/quizz.component';
import { ProgressComponent } from './pages/progress/progress.component';
import { FavoritesComponent } from './pages/favorites/favorites.component';
import { UpgradeComponent } from './pages/upgrade/upgrade.component'; // ✅ ADICIONAR
import { AreaComponent } from './pages/area/area.component'; // ✅ ADICIONAR
import { LoginComponent } from './shared/components/login/login.component'; // ✅ ADICIONAR ESTA LINHA CORRETA
import { HelpComponent } from './pages/help/help.component';
import { TermComponent } from './pages/term/term.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { PaymentSuccessComponent } from './pages/payment/payment-success.component';
import { PaymentFailureComponent } from './pages/payment/payment-failure.component';
import { PaymentPendingComponent } from './pages/payment/payment-pending.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SettingsComponent } from './pages/settings/settings.component';

// Guards
import { AuthGuard } from './core/guards/auth.guard';
import { PremiumGuard } from './core/guards/premium.guard';
import { GuestGuard } from './core/guards/guest.guard';

const routes: Routes = [
  // ===============================================
  // 🏠 ROTAS PÚBLICAS
  // ===============================================
  { 
    path: '', 
    component: HomeComponent 
  },
  
  // ===============================================
  // 🔐 ROTAS DE AUTENTICAÇÃO
  // ===============================================
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [GuestGuard],
    data: { 
      title: 'Login - SOWLFY',
      description: 'Faça login para acessar sua conta'
    }
  },

  // ===============================================
  // 🛡️ ROTAS PROTEGIDAS (REQUER LOGIN)
  // ===============================================
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  
  { 
    path: 'quiz', 
    component: QuizzComponent,
    canActivate: [AuthGuard]
  },
  
  { 
    path: 'quiz/:mode', 
    component: QuizzComponent,
    canActivate: [AuthGuard]
  },
  
  { 
    path: 'quiz/:mode/:area', 
    component: QuizzComponent,
    canActivate: [AuthGuard]
  },
  
  { 
    path: 'quiz/:area/:subject', 
    component: QuizzComponent,
    canActivate: [AuthGuard]
  },

  { 
    path: 'area/:id', 
    component: AreaComponent, // ✅ COMPONENT TRADICIONAL
    canActivate: [AuthGuard]
  },

  { 
    path: 'progress', 
    component: ProgressComponent,
    canActivate: [AuthGuard]
  },

  { 
    path: 'favorites', 
    component: FavoritesComponent,
    canActivate: [AuthGuard]
  },

  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard],
    data: { 
      title: 'Meu Perfil - SOWLFY',
      description: 'Gerencie suas informações pessoais'
    }
  },

  { 
    path: 'settings', 
    component: SettingsComponent,
    canActivate: [AuthGuard],
    data: { 
      title: 'Configurações - SOWLFY',
      description: 'Personalize sua experiência'
    }
  },

  // ===============================================
  // 📄 PÁGINAS PÚBLICAS (SEM LOGIN)
  // ===============================================
  { 
    path: 'help', 
    component: HelpComponent,
    data: { 
      title: 'Ajuda - SOWLFY',
      description: 'Central de ajuda e suporte'
    }
  },

  { 
    path: 'termos', 
    component: TermComponent,
    data: { 
      title: 'Termos de Uso - SOWLFY',
      description: 'Termos e condições de uso'
    }
  },

  { 
    path: 'privacidade', 
    component: PrivacyComponent,
    data: { 
      title: 'Política de Privacidade - SOWLFY',
      description: 'Como tratamos seus dados'
    }
  },

  // ===============================================
  // 💎 ROTAS PREMIUM (REQUER LOGIN + PREMIUM)
  // ===============================================
  { 
    path: 'upgrade', 
    component: UpgradeComponent,
    data: { 
      title: 'Upgrade Premium - SOWLFY',
      description: 'Desbloqueie todo o potencial da plataforma com nossos planos premium'
    }
  },

  // ===============================================
  // 💳 ROTAS DE PAGAMENTO
  // ===============================================
  { 
    path: 'payment/success', 
    component: PaymentSuccessComponent,
    canActivate: [AuthGuard],
    data: { 
      title: 'Pagamento Aprovado - SOWLFY',
      description: 'Seu pagamento foi aprovado com sucesso!'
    }
  },

  { 
    path: 'payment/failure', 
    component: PaymentFailureComponent,
    canActivate: [AuthGuard],
    data: { 
      title: 'Pagamento Não Aprovado - SOWLFY',
      description: 'Houve um problema com seu pagamento'
    }
  },

  { 
    path: 'payment/pending', 
    component: PaymentPendingComponent,
    canActivate: [AuthGuard],
    data: { 
      title: 'Pagamento Pendente - SOWLFY',
      description: 'Seu pagamento está sendo processado'
    }
  },

  { 
    path: 'home', 
    redirectTo: '', 
    pathMatch: 'full' 
  },
  
  { 
    path: '**', 
    redirectTo: '', 
    pathMatch: 'full' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

