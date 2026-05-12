import { Component, OnInit, Inject, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
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
  
  isAdminLogin = false;
  isDialog: boolean = false;
  selectedTabIndex: number = 0;
  isSelectionMode: boolean = true;
  hideLoginPassword: boolean = true;
  hideRegisterPassword: boolean = true;
  hideConfirmPassword: boolean = true;
  dialogTitle: string = 'Login';
  dialogSubtitle: string = '';
  dialogData: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    @Optional() public dialogRef: MatDialogRef<LoginComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar
  ) {
    this.isDialog = !!this.dialogRef;
  }

  ngOnInit(): void {
    this.createForms();
    
    // Se já está autenticado, fechar
    if (this.authService.isAuthenticated()) {
      if (this.isDialog) {
        this.dialogRef.close({ success: true });
      } else {
        this.router.navigateByUrl('/');
      }
    }
  }

  createForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.registerForm = this.fb.group({
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
  // 🔐 AUTENTICAÇÃO COM DETECÇÃO AUTOMÁTICA (ADMIN vs ESTUDANTE)
  // ===============================================

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      this.errorMessage = 'Preencha todos os campos corretamente';
      return;
    }

    const { email, password, rememberMe } = this.loginForm.value;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // 🔍 DETECTAR TIPO DE USUÁRIO (3 tipos possíveis)
    const hasAtSymbol = email?.includes('@');
    const isAdminEmail = email?.toLowerCase() === 'admin@sowlfy.com.br';
    
    if (isAdminEmail) {
      // 🔐 LOGIN ADMIN SOWLFY
      this.loginAdmin(email, password);
    } else if (hasAtSymbol) {
      // 👤 LOGIN USUÁRIO INDIVIDUAL (Firebase Auth)
      this.loginIndividualUser(email, password, rememberMe);
    } else {
      // 🎓 LOGIN ESTUDANTE (RA + Senha Compartilhada)
      this.loginStudent(email, password, rememberMe);
    }
  }

  /**
   * 🔐 Login do Admin
   */
  private loginAdmin(email: string, password: string): void {
    this.http.post<any>(
      'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/adminLogin',
      { email, password },
      { headers: { 'Content-Type': 'application/json' } }
    ).subscribe({
      next: (result) => {
        this.isLoading = false;
        
        if (result?.success && result?.token) {
          // Armazenar token e dados do admin
          localStorage.setItem('sowlfy_admin_token', result.token);
          localStorage.setItem('sowlfy_admin_data', JSON.stringify(result.adminData || { email }));
          localStorage.setItem('testPremiumStatus', 'true');

          this.successMessage = '✅ Login Admin realizado!';
          
          this.snackBar.open(this.successMessage, 'Fechar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          
          if (this.isDialog) {
            this.dialogRef?.close({ 
              success: true, 
              userType: 'admin',
              user: result.adminData || { email, name: 'Admin' }
            });
          } else {
            this.router.navigateByUrl('/admin/dashboard');
          }
        } else {
          this.isLoading = false;
          this.errorMessage = result?.error || 'Email ou senha incorretos';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao fazer login: ' + (error.message || 'Tente novamente');
        
        this.snackBar.open(this.errorMessage, 'Fechar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * 👤 Login do Estudante (RA + Senha Compartilhada)
   */
  private loginStudent(ra: string, password: string, rememberMe: boolean): void {
    this.http.post<any>(
      'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/studentLogin',
      { ra, password },
      { headers: { 'Content-Type': 'application/json' } }
    ).subscribe({
      next: (result) => {
        this.isLoading = false;
        
        if (result?.success && result?.user) {
          // Armazenar dados do estudante
          localStorage.setItem('student_token', result.token || '');
          localStorage.setItem('student_data', JSON.stringify(result.user));
          localStorage.setItem('student_schoolId', result.schoolId || '');
          localStorage.setItem('testPremiumStatus', 'true');

          this.successMessage = `✅ Bem-vindo, ${result.user.name}!`;
          
          this.snackBar.open(this.successMessage, 'Fechar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          
          if (this.isDialog) {
            this.dialogRef?.close({ 
              success: true, 
              userType: 'student',
              user: result.user,
              schoolId: result.schoolId
            });
          } else {
            this.router.navigateByUrl('/dashboard');
          }
        } else {
          this.isLoading = false;
          this.errorMessage = result?.error || 'RA ou senha incorretos';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erro ao fazer login: ' + (error.message || 'Tente novamente');
        
        this.snackBar.open(this.errorMessage, 'Fechar', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * 👤 Login do Usuário Individual (Firebase Auth)
   * Email + Senha cadastrados como usuário regular
   */
  private loginIndividualUser(email: string, password: string, rememberMe: boolean): void {
    this.authService.login(email, password, rememberMe).subscribe({
      next: (result) => {
        this.isLoading = false;
        
        if (result?.success && result?.user) {
          this.successMessage = `✅ Bem-vindo, ${result.user.name}!`;
          
          this.snackBar.open(this.successMessage, 'Fechar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          
          if (this.isDialog) {
            this.dialogRef?.close({ 
              success: true, 
              userType: 'individual',
              user: result.user
            });
          } else {
            this.router.navigateByUrl('/dashboard');
          }
        } else {
          this.isLoading = false;
          this.errorMessage = result?.message || 'Email ou senha incorretos';
        }
      },
      error: (error) => {
        // Se Firebase Auth falhar, tentar como professor/coordenador
        this.tryTeacherLogin(email, password, error);
      }
    });
  }

  /**
   * 👨‍🏫 Fallback: Login do Professor/Coordenador
   * Tentado quando Firebase Auth falha para um email com @
   */
  private tryTeacherLogin(email: string, password: string, originalError: any): void {
    this.http.post<any>(
      'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/teacherLogin',
      { email, password },
      { headers: { 'Content-Type': 'application/json' } }
    ).subscribe({
      next: (result) => {
        this.isLoading = false;

        if (result?.success && result?.token) {
          localStorage.setItem('teacher_token', result.token);
          localStorage.setItem('teacher_data', JSON.stringify(result.teacher));

          this.successMessage = `✅ Bem-vindo, ${result.teacher.name}!`;
          this.snackBar.open(this.successMessage, 'Fechar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });

          if (this.isDialog) {
            this.dialogRef?.close({ success: true, userType: 'teacher', teacher: result.teacher });
          } else {
            this.router.navigateByUrl('/professor');
          }
        } else {
          // Ambos falharam — mostrar erro genérico
          this.isLoading = false;
          this.errorMessage = 'Email ou senha incorretos';
          this.snackBar.open(this.errorMessage, 'Fechar', {
            duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
          });
        }
      },
      error: () => {
        // Ambos falharam
        this.isLoading = false;
        const credentialErrors = [
          'auth/user-not-found',
          'auth/wrong-password',
          'auth/invalid-credential', // SDK Firebase moderno unifica os dois acima neste código
        ];
        if (credentialErrors.includes(originalError?.code)) {
          this.errorMessage = 'Email ou senha incorretos';
        } else if (originalError?.code === 'auth/network-request-failed') {
          this.errorMessage = 'Erro de conexão. Verifique sua internet';
        } else if (originalError?.code === 'auth/too-many-requests') {
          this.errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
        } else {
          this.errorMessage = originalError?.message || 'Erro ao fazer login. Tente novamente';
        }
        this.snackBar.open(this.errorMessage, 'Fechar', {
          duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['error-snackbar']
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
    // ✅ BUSCAR URL SALVA PELO AUTH GUARD
    const redirectUrl = localStorage.getItem('sowlfy_redirect_after_login');
    
    // ✅ LIMPAR STORAGE
    localStorage.removeItem('sowlfy_redirect_after_login');
    
    // ✅ RETORNAR URL SALVA OU DASHBOARD COMO PADRÃO
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
    this.selectedTabIndex = 0;
    this.isSelectionMode = false;
  }
  
  // ✅ ESCOLHER CADASTRO
  selectRegister(): void {
    this.selectedTabIndex = 1;
    this.isSelectionMode = false;
  }
  
  // ✅ FECHAR MODAL
  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }
}
