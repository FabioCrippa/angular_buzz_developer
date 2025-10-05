import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { QuizzComponent } from './components/quizz/quizz.component';

// ✅ ADICIONAR EXPORT na frente de const
export const routes: Routes = [
  // ✅ ROTA HOME
  { path: '', component: HomeComponent },
  
  // ✅ ROTA DASHBOARD  
  { path: 'dashboard', component: DashboardComponent },
  
  // ✅ ROTAS DO QUIZ
  { path: 'quiz', component: QuizzComponent }, // Quiz misto
  { path: 'quiz/:area', component: QuizzComponent }, // Quiz por área
  { path: 'quiz/:area/:subject', component: QuizzComponent }, // Quiz específico
  
  // ✅ REDIRECTS
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  
  // ✅ WILDCARD (404)
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

