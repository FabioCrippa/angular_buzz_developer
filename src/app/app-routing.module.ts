import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { QuizzComponent } from './pages/quizz/quizz.component';
import { ProgressComponent } from './pages/progress/progress.component';
import { FavoritesComponent } from './pages/favorites/favorites.component';
import { UpgradeComponent } from './pages/upgrade/upgrade.component'; // ✅ ADICIONAR
import { AreaComponent } from './pages/area/area.component'; // ✅ ADICIONAR

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
    loadComponent: () => import('./shared/components/login/login.component').then(c => c.LoginComponent),
    canActivate: [GuestGuard],
    data: { 
      title: 'Login - BuzzDeveloper',
      description: 'Acesse sua conta na BuzzDeveloper'
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
    path: 'area/:name', 
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

  // ===============================================
  // 💎 ROTAS PREMIUM (REQUER LOGIN + PREMIUM)
  // ===============================================
  { 
    path: 'upgrade', 
    component: UpgradeComponent, // ✅ COMPONENT TRADICIONAL
    data: { 
      title: 'Upgrade Premium - BuzzDeveloper',
      description: 'Desbloqueie todo o potencial da plataforma com nossos planos premium'
    }
    // Nota: Não precisa de guard, qualquer um pode ver a página de upgrade
  },

  // Exemplo de rota premium (descomente quando criar conteúdo premium)
  // { 
  //   path: 'premium/advanced-analytics', 
  //   loadComponent: () => import('./pages/premium/analytics/analytics.component').then(c => c.AdvancedAnalyticsComponent),
  //   canActivate: [AuthGuard, PremiumGuard]
  // },

  // ===============================================
  // 🔄 REDIRECTS E WILDCARDS
  // ===============================================
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

