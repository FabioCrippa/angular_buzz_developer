// ===============================================
// 🔐 AUTH.SERVICE.TS - VERSÃO PRODUÇÃO COMPLETA
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app\core\services\auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, timer } from 'rxjs';
import { map, catchError, tap, retry, timeout } from 'rxjs/operators';

// ===============================================
// 📝 INTERFACES
// ===============================================

export interface User {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  plan: 'free' | 'pro' | 'premium';
  avatar?: string;
  createdAt: Date;
  lastLoginAt: Date;
  stats: {
    level: number;
    xp: number;
    streak: number;
    totalQuestions: number;
    correctAnswers: number;
    timeStudied: number; // em minutos
    quizzesCompleted: number;
    averageScore: number;
  };
  preferences: {
    soundEnabled: boolean;
    darkTheme: boolean;
    emailNotifications: boolean;
    language: 'pt-BR' | 'en-US';
  };
  subscription?: {
    id: string;
    status: 'active' | 'canceled' | 'expired';
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  refreshToken: string;
  message: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  acceptTerms: boolean;
  marketingOptIn?: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  
  // ===============================================
  // 🔧 CONFIGURAÇÃO
  // ===============================================
  
  // ✅ CONFIGURAR PARA SEU BACKEND
  private readonly API_URL = 'https://api.sowlfy.com/v1'; // ← PRODUÇÃO
  // private readonly API_URL = 'http://localhost:3000/api/v1'; // ← DESENVOLVIMENTO
  // private readonly API_URL = 'https://jsonplaceholder.typicode.com'; // ← MOCK TESTE
  
  private readonly STORAGE_KEYS = {
    USER: 'sowlfy_user',
    TOKEN: 'sowlfy_token', 
    REFRESH_TOKEN: 'sowlfy_refresh_token',
    LAST_LOGIN: 'sowlfy_last_login',
    THEME: 'sowlfy_theme'
  };

  // ===============================================
  // 📊 STATE MANAGEMENT
  // ===============================================
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<AuthError | null>(null);
  
  // ✅ OBSERVABLES PÚBLICOS
  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  
  constructor(private http: HttpClient) {
    console.log('🔐 AuthService inicializado');
    this.initializeAuth();
  }

  // ===============================================
  // 🚀 INICIALIZAÇÃO
  // ===============================================

  private initializeAuth(): void {
    try {
      this.loadStoredUser();
      this.setupTokenRefresh();
      this.validateStoredToken();
    } catch (error) {
      console.warn('⚠️ Erro na inicialização do auth:', error);
      this.clearAllUserData();
    }
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem(this.STORAGE_KEYS.USER);
    const token = localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        if (this.isTokenValid(token)) {
          this.currentUserSubject.next(user);
          console.log('✅ Usuário restaurado do storage');
        } else {
          console.log('🔐 Token expirado, limpando dados');
          this.clearAllUserData();
        }
      } catch (error) {
        console.error('❌ Erro ao parsear usuário do storage:', error);
        this.clearAllUserData();
      }
    }
  }

  private setupTokenRefresh(): void {
    // ✅ REFRESH TOKEN AUTOMÁTICO A CADA 50 MINUTOS
    timer(0, 50 * 60 * 1000).subscribe(() => {
      if (this.isAuthenticated()) {
        this.refreshTokenSilently();
      }
    });
  }

  // ===============================================
  // 🔐 AUTENTICAÇÃO PRINCIPAL
  // ===============================================

  login(email: string, password: string, rememberMe: boolean = true): Observable<LoginResponse> {
    if (!email || !password) {
      return throwError(() => new Error('Email e senha são obrigatórios'));
    }

    if (!this.isValidEmail(email)) {
      return throwError(() => new Error('Email inválido'));
    }

    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    const payload = {
      email: email.toLowerCase().trim(),
      password,
      rememberMe,
      deviceInfo: this.getDeviceInfo()
    };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, payload)
      .pipe(
        timeout(10000), // 10s timeout
        retry(1), // 1 retry em caso de erro de rede
        tap(response => {
          if (response.success && response.user && response.token) {
            this.setCurrentUser(response.user, response.token, response.refreshToken);
            console.log('✅ Login realizado com sucesso:', response.user.email);
          }
        }),
        catchError(error => this.handleAuthError('LOGIN', error)),
        tap(() => this.isLoadingSubject.next(false))
      );
  }

  register(userData: RegisterRequest): Observable<LoginResponse> {
    if (!this.validateRegisterData(userData)) {
      return throwError(() => new Error('Dados de cadastro inválidos'));
    }

    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    const payload = {
      ...userData,
      email: userData.email.toLowerCase().trim(),
      name: userData.name.trim(),
      deviceInfo: this.getDeviceInfo()
    };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/register`, payload)
      .pipe(
        timeout(15000), // 15s timeout para registro
        retry(1),
        tap(response => {
          if (response.success && response.user && response.token) {
            this.setCurrentUser(response.user, response.token, response.refreshToken);
            console.log('✅ Cadastro realizado com sucesso:', response.user.email);
          }
        }),
        catchError(error => this.handleAuthError('REGISTER', error)),
        tap(() => this.isLoadingSubject.next(false))
      );
  }

  logout(everywhere: boolean = false): Observable<boolean> {
    const token = this.getAuthToken();
    
    this.isLoadingSubject.next(true);

    // ✅ NOTIFICAR BACKEND (OPCIONAL - NÃO BLOQUEAR SE FALHAR)
    const logoutRequest = token ? 
      this.http.post(`${this.API_URL}/auth/logout`, { everywhere }, {
        headers: { Authorization: `Bearer ${token}` }
      }).pipe(catchError(() => of(null))) : 
      of(null);

    return logoutRequest.pipe(
      tap(() => {
        this.clearAllUserData();
        this.currentUserSubject.next(null);
        console.log('✅ Logout realizado com sucesso');
      }),
      map(() => true),
      catchError(() => {
        // ✅ MESMO COM ERRO NA API, LIMPAR DADOS LOCAIS
        this.clearAllUserData();
        this.currentUserSubject.next(null);
        return of(true);
      }),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  // ===============================================
  // 👤 GESTÃO DE USUÁRIO
  // ===============================================

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  isAuthenticated(): boolean {
    const user = this.currentUserSubject.value;
    const token = this.getAuthToken();
    return !!(user && token && this.isTokenValid(token));
  }

  isPremium(): boolean {
    const user = this.currentUserSubject.value;
    return user?.isPremium || false;
  }

  getUserPlan(): 'free' | 'pro' | 'premium' {
    const user = this.currentUserSubject.value;
    return user?.plan || 'free';
  }

  refreshUserData(): Observable<User> {
    const token = this.getAuthToken();
    if (!token) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    return this.http.get<User>(`${this.API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.saveUserToStorage(user);
        console.log('✅ Dados do usuário atualizados');
      }),
      catchError(error => {
        if (error.status === 401) {
          this.clearAllUserData();
          this.currentUserSubject.next(null);
        }
        return this.handleAuthError('REFRESH_USER', error);
      })
    );
  }

  updateUserStats(updates: Partial<User['stats']>): Observable<User> {
    const token = this.getAuthToken();
    if (!token) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    return this.http.patch<User>(`${this.API_URL}/users/stats`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.saveUserToStorage(user);
      }),
      catchError(error => this.handleAuthError('UPDATE_STATS', error))
    );
  }

  updateUserPreferences(preferences: Partial<User['preferences']>): Observable<User> {
    const token = this.getAuthToken();
    if (!token) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    return this.http.patch<User>(`${this.API_URL}/users/preferences`, preferences, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.saveUserToStorage(user);
      }),
      catchError(error => this.handleAuthError('UPDATE_PREFERENCES', error))
    );
  }

  // ===============================================
  // 🛠️ MÉTODOS AUXILIARES
  // ===============================================

  private setCurrentUser(user: User, token: string, refreshToken?: string): void {
    try {
      this.currentUserSubject.next(user);
      this.saveUserToStorage(user);
      localStorage.setItem(this.STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(this.STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
      
      if (refreshToken) {
        localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar dados do usuário:', error);
    }
  }

  private saveUserToStorage(user: User): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.warn('⚠️ Erro ao salvar usuário no localStorage:', error);
    }
  }

  private clearAllUserData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  private getAuthToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.TOKEN);
  }

  private isTokenValid(token: string): boolean {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validateRegisterData(data: RegisterRequest): boolean {
    return !!(
      data.name?.trim().length >= 2 &&
      this.isValidEmail(data.email) &&
      data.password?.length >= 6 &&
      data.acceptTerms
    );
  }

  private getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      timestamp: new Date().toISOString()
    };
  }

  private refreshTokenSilently(): void {
    const refreshToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return;

    this.http.post<LoginResponse>(`${this.API_URL}/auth/refresh`, {
      refreshToken
    }).subscribe({
      next: (response) => {
        if (response.success && response.token) {
          localStorage.setItem(this.STORAGE_KEYS.TOKEN, response.token);
          console.log('🔄 Token renovado automaticamente');
        }
      },
      error: () => {
        console.log('⚠️ Erro ao renovar token, usuário deve fazer login novamente');
        this.logout().subscribe();
      }
    });
  }

  private validateStoredToken(): void {
    const token = this.getAuthToken();
    if (token && !this.isTokenValid(token)) {
      console.log('🔐 Token armazenado inválido, limpando dados');
      this.clearAllUserData();
      this.currentUserSubject.next(null);
    }
  }

  private handleAuthError(operation: string, error: any): Observable<never> {
    console.error(`❌ Erro ${operation}:`, error);
    
    let errorMessage = 'Erro inesperado';
    let errorCode = 'UNKNOWN';

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Dados inválidos';
          errorCode = 'INVALID_DATA';
          break;
        case 401:
          errorMessage = 'Email ou senha incorretos';
          errorCode = 'INVALID_CREDENTIALS';
          break;
        case 403:
          errorMessage = 'Acesso negado';
          errorCode = 'ACCESS_DENIED';
          break;
        case 409:
          errorMessage = 'Email já cadastrado';
          errorCode = 'EMAIL_EXISTS';
          break;
        case 429:
          errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos';
          errorCode = 'RATE_LIMITED';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor';
          errorCode = 'SERVER_ERROR';
          break;
        default:
          errorMessage = 'Erro de conexão';
          errorCode = 'NETWORK_ERROR';
      }
    }

    const authError: AuthError = {
      code: errorCode,
      message: errorMessage,
      details: error
    };

    this.errorSubject.next(authError);
    return throwError(() => authError);
  }

  // ===============================================
  // 🧪 MÉTODOS DE DESENVOLVIMENTO (REMOVER EM PRODUÇÃO)
  // ===============================================

  // ✅ MOCK LOGIN PARA DESENVOLVIMENTO - REMOVER QUANDO TIVER API
  mockLogin(email?: string): Observable<LoginResponse> {
    console.warn('⚠️ USANDO MOCK LOGIN - REMOVER EM PRODUÇÃO');
    
    this.isLoadingSubject.next(true);
    
    const mockUser: User = {
      id: `mock-${Date.now()}`,
      name: email ? email.split('@')[0].replace(/[^a-zA-Z]/g, '') : 'Developer',
      email: email || 'dev@sowlfy.com',
      isPremium: Math.random() > 0.5, // 50% chance premium para testes
      plan: Math.random() > 0.5 ? 'pro' : 'free',
      avatar: `https://ui-avatars.com/api/?name=${email}&size=128&background=667eea&color=fff`,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      stats: {
        level: Math.floor(Math.random() * 20) + 1,
        xp: Math.floor(Math.random() * 5000),
        streak: Math.floor(Math.random() * 30),
        totalQuestions: Math.floor(Math.random() * 500),
        correctAnswers: Math.floor(Math.random() * 400),
        timeStudied: Math.floor(Math.random() * 1000),
        quizzesCompleted: Math.floor(Math.random() * 50),
        averageScore: Math.floor(Math.random() * 40) + 60 // 60-100%
      },
      preferences: {
        soundEnabled: true,
        darkTheme: false,
        emailNotifications: true,
        language: 'pt-BR'
      }
    };

    return timer(1500).pipe( // Simula delay da API
      map(() => ({
        success: true,
        user: mockUser,
        token: this.generateMockToken(mockUser),
        refreshToken: `refresh-${Date.now()}`,
        message: 'Login realizado com sucesso (mock)'
      })),
      tap(response => {
        this.setCurrentUser(response.user, response.token, response.refreshToken);
        this.isLoadingSubject.next(false);
      })
    );
  }

  private generateMockToken(user: User): string {
    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24h
    }));
    const signature = btoa('mock-signature');
    
    return `${header}.${payload}.${signature}`;
  }
}
