import { Component, OnInit, Inject, Optional } from '@angular/core'; // ✅ ADICIONAR Optional
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  hideLoginPassword: boolean = true;
  hideRegisterPassword: boolean = true;
  hideConfirmPassword: boolean = true;
  
  selectedTabIndex: number = 0;
  isDialog: boolean = false; // ✅ ADICIONAR PROPRIEDADE
  isSelectionMode: boolean = false; // ✅ MODO DE SELEÇÃO
  dialogTitle: string = 'Login';
  dialogSubtitle: string = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    @Optional() public dialogRef: MatDialogRef<LoginComponent>, // ✅ OPCIONAL
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any, // ✅ OPCIONAL
    private snackBar: MatSnackBar // ✅ INJETAR MatSnackBar
  ) {
    // ✅ DETECTAR SE É DIALOG
    this.isDialog = !!this.dialogRef;
    
    // ✅ CONFIGURAR BASEADO NO DATA
    if (this.data) {
      this.dialogTitle = this.data.title || 'Login';
      this.dialogSubtitle = this.data.subtitle || '';
      this.isSelectionMode = this.data.mode === 'selection';
      
      if (this.data.mode === 'register') {
        this.selectedTabIndex = 1;
      }
    }
  }

  ngOnInit(): void {
    this.createForms();
    
    // ✅ SÓ VERIFICAR LOGIN SE NÃO FOR DIALOG
    if (!this.isDialog) {
      this.checkIfAlreadyLoggedIn();
    }
  }

  // ===============================================
  // 🔧 INICIALIZAÇÃO
  // ===============================================

  private createForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rememberMe: [false]
    });

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, this.passwordMatchValidator.bind(this)]],
      acceptTerms: [false, [Validators.requiredTrue]]
    });
  }

  private checkIfAlreadyLoggedIn(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  // ===============================================
  // 🔐 AUTENTICAÇÃO CORRIGIDA
  // ===============================================

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      this.errorMessage = 'Preencha todos os campos corretamente';
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value; // ✅ INCLUIR REMEMBER ME
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(email, password, rememberMe).subscribe({
      next: (result) => {
        this.isLoading = false;
        
        if (result.success) {
          this.successMessage = '✅ Login realizado com sucesso!';
          
          // Mostrar mensagem de sucesso
          this.snackBar.open(this.successMessage, 'Fechar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          
          // Redirecionar após delay
          if (this.isDialog) {
            setTimeout(() => {
              this.dialogRef?.close({ success: true, user: result.user });
            }, 800);
          } else {
            setTimeout(() => {
              const redirectUrl = this.getRedirectUrl();
              this.router.navigate([redirectUrl]);
            }, 1000);
          }
          
        } else {
          this.errorMessage = result.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Erro no servidor. Tente novamente.';
        
        this.snackBar.open(this.errorMessage, 'Fechar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      this.errorMessage = 'Preencha todos os campos corretamente';
      return;
    }

    const userData = this.registerForm.value;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(userData).subscribe({
      next: (result) => {
        this.isLoading = false;
        
        if (result.success) {
          this.successMessage = '🎉 Cadastro realizado com sucesso!';
          
          // Mostrar mensagem de sucesso
          this.snackBar.open(this.successMessage, 'Fechar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          
          // Redirecionar após delay
          if (this.isDialog) {
            setTimeout(() => {
              this.dialogRef?.close({ success: true, user: result.user });
            }, 800);
          } else {
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 1000);
          }
          
        } else {
          this.errorMessage = result.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Erro no servidor. Tente novamente.';
        
        this.snackBar.open(this.errorMessage, 'Fechar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // ===============================================
  // 🔧 HELPERS (mantidos iguais)
  // ===============================================

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      // ✅ ATUALIZAR VALIDADOR CUSTOMIZADO
      if (key === 'confirmPassword') {
        control?.updateValueAndValidity();
      }
    });
  }

  private getRedirectUrl(): string {
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    localStorage.removeItem('redirectAfterLogin');
    return redirectUrl || '/dashboard';
  }

  getLoginErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} é obrigatório`;
    }
    
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    
    if (control?.hasError('minlength')) {
      return `${this.getFieldDisplayName(fieldName)} deve ter pelo menos ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    
    return '';
  }

  getRegisterErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    
    if (control?.hasError('required') || control?.hasError('requiredTrue')) {
      return `${this.getFieldDisplayName(fieldName)} é obrigatório`;
    }
    
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    
    if (control?.hasError('minlength')) {
      return `${this.getFieldDisplayName(fieldName)} deve ter pelo menos ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    
    // ✅ USAR VALIDADOR CUSTOMIZADO
    if (control?.hasError('mismatch')) {
      return 'Senhas não coincidem';
    }
    
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      email: 'Email',
      password: 'Senha',
      name: 'Nome',
      confirmPassword: 'Confirmar senha',
      acceptTerms: 'Aceitar termos'
    };
    
    return displayNames[fieldName] || fieldName;
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    if (!this.registerForm) {
      return null;
    }

    const password = this.registerForm.get('password')?.value;
    const confirmPassword = control.value;

    return password === confirmPassword ? null : { 'mismatch': true };
  }

  // ===============================================
  // 🎯 DEMO E UTILITÁRIOS
  // ===============================================

  fillDemoCredentials(): void {
    this.loginForm.patchValue({
      email: 'demo@sowlfy.com',
      password: 'demo123'
    });
    
    // ✅ LIMPAR ERROS
    this.clearMessages();
  }

  switchToRegister(): void {
    this.selectedTabIndex = 1;
    this.clearMessages();
  }

  switchToLogin(): void {
    this.selectedTabIndex = 0;
    this.clearMessages();
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  onTabChanged(index: number): void {
    this.selectedTabIndex = index;
    this.clearMessages();
  }

  onNoClick(): void {
    if (this.isDialog) {
      this.dialogRef?.close();
    }
  }

  // ===============================================
  // 🔄 ADICIONAR NO LOGIN.COMPONENT.TS (onLoginSuccess)
  // ===============================================

  onLoginSuccess(): void {
    
    // ✅ VERIFICAR INTENÇÕES SALVAS
    this.handlePostLoginRedirect();
  }

  private handlePostLoginRedirect(): void {
    try {
      // ✅ VERIFICAR INTENÇÃO DE QUIZ
      const userIntention = localStorage.getItem('userIntention');
      if (userIntention) {
        const intention = JSON.parse(userIntention);
        localStorage.removeItem('userIntention');
        
        
        if (intention.action === 'start_free_trial') {
          // ✅ QUERIA INICIAR QUIZ GRÁTIS
          this.router.navigate(['/quiz'], {
            queryParams: intention.params
          });
          return;
        }
      }
      
      // ✅ VERIFICAR INTENÇÃO DE REDIRECT
      const redirectIntention = localStorage.getItem('redirectIntention');
      if (redirectIntention) {
        const intention = JSON.parse(redirectIntention);
        localStorage.removeItem('redirectIntention');
        
        
        this.router.navigate([intention.route], {
          queryParams: intention.params
        });
        return;
      }
      
      // ✅ VERIFICAR INTENÇÃO DE UPGRADE
      const upgradeIntention = localStorage.getItem('upgradeIntention');
      if (upgradeIntention) {
        localStorage.removeItem('upgradeIntention');
        
        
        this.router.navigate(['/payment'], {
          queryParams: { plan: upgradeIntention }
        });
        return;
      }
      
      // ✅ SEM INTENÇÃO ESPECÍFICA - DASHBOARD PADRÃO
      this.router.navigate(['/dashboard']);
      
    } catch (error) {
      // ✅ FALLBACK
      this.router.navigate(['/dashboard']);
    }
  }
  
  // ===============================================
  // 🎯 MÉTODOS DE SELEÇÃO
  // ===============================================
  
  // ✅ ESCOLHER LOGIN
  selectLogin(): void {
    if (this.dialogRef) {
      this.dialogRef.close({ action: 'login' });
    } else {
      this.selectedTabIndex = 0;
      this.isSelectionMode = false;
    }
  }
  
  // ✅ ESCOLHER CADASTRO
  selectRegister(): void {
    if (this.dialogRef) {
      this.dialogRef.close({ action: 'register' });
    } else {
      this.selectedTabIndex = 1;
      this.isSelectionMode = false;
    }
  }
  
  // ✅ FECHAR MODAL
  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
