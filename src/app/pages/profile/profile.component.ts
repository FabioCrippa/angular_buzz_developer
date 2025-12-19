import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GamificationService, UserProgress } from '../../core/services/gamification.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  
  currentUser: any = null;
  isEditing = false;
  isLoading = false;
  
  // Gamificação
  userProgress: UserProgress | null = null;
  userLevel = 1;
  userXP = 0;
  levelName = 'Iniciante';
  xpToNextLevel = 100;
  levelProgress = 0;
  
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
    private snackBar: MatSnackBar,
    private gamificationService: GamificationService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadGamificationData();
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
        
        // Carregar gamificação quando usuário muda
        if (user.id) {
          this.loadGamificationData();
        }
      }
    });
  }
  
  private async loadGamificationData(): Promise<void> {
    try {
      const user = this.authService.currentUserValue;
      if (!user?.id) return;
      
      this.userProgress = await this.gamificationService.loadUserProgress(user.id);
      
      if (this.userProgress) {
        this.userXP = this.userProgress.xp;
        this.userLevel = this.userProgress.level;
        
        const levelInfo = this.gamificationService.getLevelInfo(this.userXP);
        this.levelName = levelInfo.levelName;
        this.xpToNextLevel = levelInfo.xpToNextLevel;
        this.levelProgress = levelInfo.progressPercentage;
      }
    } catch (error) {
      console.error('Erro ao carregar gamificação:', error);
    }
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
    return this.userLevel;
  }

  getUserXP(): number {
    return this.userXP;
  }

  getNextLevelXP(): number {
    const levelInfo = this.gamificationService.getLevelInfo(this.userXP);
    return levelInfo.xpForNextLevel;
  }

  getXPProgress(): number {
    return this.levelProgress;
  }
  
  getLevelName(): string {
    return this.levelName;
  }
}
