import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // ✅ IMPORTAR CommonModule

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Components
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { QuizzComponent } from './components/quizz/quizz.component';
import { LoadingComponent } from './shared/components/loading/loading.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DashboardComponent,
    QuizzComponent
  ],
  imports: [
    BrowserModule,          // ✅ Contém CommonModule
    CommonModule,           // ✅ ADICIONAR EXPLICITAMENTE
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    LoadingComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
