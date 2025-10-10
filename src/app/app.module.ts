import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // ✅ IMPORTAR CommonModule

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MaterialModule } from './shared/material/material/material.module';

// Components
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { QuizzComponent } from './pages/quizz/quizz.component';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AreaComponent } from './pages/area/area.component';
import { MatRadioModule } from '@angular/material/radio';
import { UpgradeComponent } from './pages/upgrade/upgrade.component'; // ✅ ADICIONAR NO app.module.ts (imports)

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DashboardComponent,
    QuizzComponent,
  ],
  imports: [
    BrowserModule,          // ✅ Contém CommonModule
    CommonModule,           // ✅ ADICIONAR EXPLICITAMENTE
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    LoadingComponent,
    BrowserAnimationsModule,
    MaterialModule,
    MatRadioModule,
    UpgradeComponent,
    AreaComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
