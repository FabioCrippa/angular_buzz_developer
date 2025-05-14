import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { QuizzComponent } from './components/quizz/quizz.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'quizz', component: QuizzComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

