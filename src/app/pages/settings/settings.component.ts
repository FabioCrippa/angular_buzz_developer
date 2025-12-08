import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  
  currentUser: any = null;
  
  // Configurações
  settings = {
    notifications: {
      email: true,
      dailyReminder: true
    },
    preferences: {
      theme: 'light',
      questionsPerQuiz: 10,
      soundEffects: true
    }
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadSettings();
  }

  private loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  private loadSettings(): void {
    // Tentar carregar configurações do localStorage
    const savedSettings = localStorage.getItem('sowlfy_settings');
    if (savedSettings) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      } catch (error) {
      }
    }
  }

  saveSettings(): void {
    // Salvar no localStorage
    localStorage.setItem('sowlfy_settings', JSON.stringify(this.settings));
    
    this.snackBar.open('✅ Configurações salvas com sucesso!', 'OK', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });

    // TODO: Enviar para API backend
  }

  changePassword(): void {
    this.snackBar.open('🔒 Para alterar sua senha, faça logout e use "Esqueci minha senha"', 'OK', { 
      duration: 4000 
    });
  }

  clearCache(): void {
    const confirm = window.confirm(
      'Limpar cache?\n\n' +
      'Isso vai remover dados temporários e pode melhorar o desempenho.\n' +
      'Você não perderá seu progresso.'
    );

    if (confirm) {
      // Limpar apenas cache, não dados do usuário
      localStorage.removeItem('sowlfy_cache');
      sessionStorage.clear();
      
      this.snackBar.open('✅ Cache limpo com sucesso!', 'OK', { 
        duration: 3000 
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
