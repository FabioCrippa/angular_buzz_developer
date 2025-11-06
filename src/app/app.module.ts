import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// MaterialModule removed because './shared/material/material.module' was not found; using individual Material imports below.

// ✅ COMPONENTS PARA DECLARATIONS
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { QuizzComponent } from './pages/quizz/quizz.component';
import { AreaComponent } from './pages/area/area.component';
import { UpgradeComponent } from './pages/upgrade/upgrade.component';
import { ProgressComponent } from './pages/progress/progress.component';
import { FavoritesComponent } from './pages/favorites/favorites.component';
import { LoginComponent } from './shared/components/login/login.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { PremiumUpgradeDialogComponent } from './shared/components/premium-upgrade-dialog/premium-upgrade-dialog.component';

// ✅ MATERIAL MODULES ESPECÍFICOS
import { MatRadioModule } from '@angular/material/radio';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// ✅ ADICIONAR ESTES MÓDULOS FALTANTES:
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HelpComponent } from './pages/help/help.component';
import { TermComponent } from './pages/term/term.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@NgModule({
  declarations: [
    // ✅ TODOS OS COMPONENTS VÃO AQUI
    AppComponent,
    HomeComponent,
    DashboardComponent,
    QuizzComponent,
    AreaComponent,
    UpgradeComponent,
    ProgressComponent,
    FavoritesComponent,
    LoginComponent,
    HeaderComponent,
    PremiumUpgradeDialogComponent,
    HelpComponent,
    TermComponent,
    PrivacyComponent,
  ],
  imports: [
    // ✅ SÓ MODULES VÃO AQUI
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    
    // MaterialModule removed because './shared/material/material.module' was not found; using individual Material imports below.
    // ✅ MATERIAL MODULES BÁSICOS
    MatRadioModule,
    MatDialogModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    
    // ✅ MATERIAL MODULES PARA AREA COMPONENT
    MatSelectModule,        // ✅ PARA mat-select
    MatOptionModule,        // ✅ PARA mat-option
    MatChipsModule,         // ✅ PARA tags/chips
    MatSlideToggleModule,   // ✅ PARA toggles
    MatCheckboxModule,      // ✅ PARA checkboxes
    MatTabsModule,          // ✅ PARA abas
    MatExpansionModule,     // ✅ PARA painéis expansíveis
    MatListModule,          // ✅ PARA listas
    MatGridListModule,      // ✅ PARA grid lists
    MatPaginatorModule,     // ✅ PARA paginação
    MatSortModule,          // ✅ PARA ordenação
    MatTableModule,         // ✅ PARA tabelas
    MatDatepickerModule,    // ✅ PARA date pickers
    MatNativeDateModule,     // ✅ PARA datas nativas
    MatProgressBarModule    // ✅ PARA barras de progresso
  ],
  providers: [
    // Services serão injetados automaticamente se tiverem @Injectable({providedIn: 'root'})
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
