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
    data: { 
      title: 'Login - BuzzDeveloper',
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

