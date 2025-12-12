// ===============================================
// 🦉 SOWLFY - APP.MODULE.TS CORRIGIDO
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app\app.module.ts

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

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
import { HelpComponent } from './pages/help/help.component';
import { TermComponent } from './pages/term/term.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { PaymentSuccessComponent } from './pages/payment/payment-success.component';
import { PaymentFailureComponent } from './pages/payment/payment-failure.component';
import { PaymentPendingComponent } from './pages/payment/payment-pending.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SettingsComponent } from './pages/settings/settings.component';

// ✅ GUARDS E SERVICES
import { PremiumGuard } from './core/guards/premium.guard';

// ✅ MATERIAL MODULES - IMPORTAÇÃO CORRIGIDA
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// ✅ FIREBASE MODULES
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    // ✅ TODOS OS COMPONENTS
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
    PaymentSuccessComponent,
    PaymentFailureComponent,
    PaymentPendingComponent,
    ProfileComponent,
    SettingsComponent
  ],
  imports: [
    // ✅ CORE MODULES
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    
    // ✅ MATERIAL MODULES (ORGANIZADOS)
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatTabsModule,
    MatExpansionModule,
    MatListModule,
    MatGridListModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    
    // ✅ FIREBASE CONFIGURATION
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ],
  providers: [
    // ✅ GUARDS E SERVICES
    PremiumGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
