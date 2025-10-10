import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { QuizzComponent } from './pages/quizz/quizz.component';

// ✅ ROTAS PARA PROJETO STANDALONE
export const routes: Routes = [
  // ✅ ROTA HOME
  { path: '', component: HomeComponent },
  
  // ✅ ROTA DASHBOARD  
  { path: 'dashboard', component: DashboardComponent },
  
  // ✅ ROTA UPGRADE (MOVER PARA CIMA!)
  { 
    path: 'upgrade',
    loadComponent: () => import('./pages/upgrade/upgrade.component').then(m => m.UpgradeComponent),
    data: { 
      title: 'Upgrade Premium - BuzzDeveloper',
      description: 'Acelere sua aprovação com acesso premium ilimitado'
    }
  },
  
  // ✅ ROTA ÁREA - STANDALONE COMPONENT
  { 
    path: 'area/:name', 
    loadComponent: () => import('./pages/area/area.component').then(c => c.AreaComponent)
  },
  
  // ✅ ROTAS DO QUIZ
  { path: 'quiz', component: QuizzComponent },
  { path: 'quiz/:mode', component: QuizzComponent },
  { path: 'quiz/:mode/:area', component: QuizzComponent },
  { path: 'quiz/:area/:subject', component: QuizzComponent },
  
  // ✅ ROTAS FUTURAS - STANDALONE
  // { 
  //   path: 'progress', 
  //   loadComponent: () => import('./pages/progress/progress.component').then(c => c.ProgressComponent)
  // },
  // { 
  //   path: 'favorites', 
  //   loadComponent: () => import('./pages/favorites/favorites.component').then(c => c.FavoritesComponent)
  // },
  
  // ✅ REDIRECTS
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  
  // ✅ WILDCARD (404) - SEMPRE POR ÚLTIMO!
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}

