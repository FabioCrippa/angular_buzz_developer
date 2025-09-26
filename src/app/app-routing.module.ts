import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { QuizzComponent } from './components/quizz/quizz.component';

// ✅ ADICIONAR EXPORT na frente de const
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'quiz', component: QuizzComponent },
  { path: 'quizz', component: QuizzComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

