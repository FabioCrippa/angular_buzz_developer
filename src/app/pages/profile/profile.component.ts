import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
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
    private gamificationService: GamificationService,
    private dialog: MatDialog
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

    // Atualizar perfil no Firestore
    this.authService.updateUserProfile(this.currentUser.id, {
      name: this.formData.name,
      email: this.formData.email,
      // Adicionar outros campos conforme necessário
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.isEditing = false;
        
        this.snackBar.open('✅ Perfil atualizado com sucesso!', 'OK', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        // Atualizar dados locais
        this.currentUser = {
          ...this.currentUser,
          ...this.formData
        };
      },
      error: (error) => {
        console.error('Erro ao salvar perfil:', error);
        this.isLoading = false;
        
        this.snackBar.open('❌ Erro ao salvar perfil. Tente novamente.', 'OK', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  changeAvatar(): void {
    // TODO: Implementar upload de imagem para Firebase Storage
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

  deleteAccount(): void {
    const confirmDelete = confirm(
      '⚠️ ATENÇÃO!\n\n' +
      'Você tem certeza que deseja DELETAR sua conta?\n\n' +
      'Esta ação irá:\n' +
      '• Excluir todos os seus dados\n' +
      '• Remover todo seu progresso\n' +
      '• Cancelar sua assinatura (se houver)\n' +
      '• NÃO PODERÁ SER DESFEITA!\n\n' +
      'Digite "DELETAR" para confirmar'
    );

    if (!confirmDelete) {
      return;
    }

    // Segunda confirmação
    const finalConfirm = prompt('Digite "DELETAR" em MAIÚSCULAS para confirmar:');
    
    if (finalConfirm !== 'DELETAR') {
      this.snackBar.open('❌ Deleção cancelada', 'OK', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    // Deletar conta
    this.authService.deleteAccount(this.currentUser.id).subscribe({
      next: () => {
        this.snackBar.open('✅ Conta deletada com sucesso. Até logo! 👋', 'OK', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        
        // Usuário será redirecionado para login automaticamente pelo logout
      },
      error: (error) => {
        console.error('Erro ao deletar conta:', error);
        this.isLoading = false;
        
        this.snackBar.open('❌ Erro ao deletar conta. Tente novamente.', 'OK', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
