import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  
  currentUser: any = null;
  isEditing = false;
  isLoading = false;
  
  // Formulário
  formData = {
    name: '',
    email: '',
    avatar: '',
    bio: '',
    phone: '',
    location: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.formData = {
          name: user.name || '',
          email: user.email || '',
          avatar: user.avatar || '',
          bio: (user as any).bio || '',
          phone: (user as any).phone || '',
          location: (user as any).location || ''
        };
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Cancelar - restaurar dados originais
      this.loadUserData();
    }
  }

  saveProfile(): void {
    if (!this.formData.name || !this.formData.email) {
      this.snackBar.open('Nome e email são obrigatórios', 'OK', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    // TODO: Implementar chamada à API para salvar
    setTimeout(() => {
      // Simulação de salvamento
      const updatedUser = {
        ...this.currentUser,
        ...this.formData
      };

      // Atualizar localStorage temporariamente
      localStorage.setItem('sowlfy_user', JSON.stringify(updatedUser));
      
      this.isLoading = false;
      this.isEditing = false;
      
      this.snackBar.open('✅ Perfil atualizado com sucesso!', 'OK', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      // Forçar atualização do currentUser no AuthService
      this.authService['currentUserSubject'].next(updatedUser);
    }, 1000);
  }

  changeAvatar(): void {
    // TODO: Implementar upload de imagem
    this.snackBar.open('🚧 Upload de imagem em desenvolvimento', 'OK', { duration: 3000 });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getUserLevel(): number {
    // TODO: Calcular nível baseado em pontos/XP
    return this.currentUser?.level || 1;
  }

  getUserXP(): number {
    return this.currentUser?.xp || 0;
  }

  getNextLevelXP(): number {
    const currentLevel = this.getUserLevel();
    return currentLevel * 100; // 100 XP por nível
  }

  getXPProgress(): number {
    const xp = this.getUserXP();
    const nextLevelXP = this.getNextLevelXP();
    return (xp / nextLevelXP) * 100;
  }
}
