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
  
  // ✅ CONFIGURAR PARA SEU BACKEND REAL
  private readonly API_URL = 'http://localhost:3000/api'; // ← DESENVOLVIMENTO
  // private readonly API_URL = 'https://api.sowlfy.com/v1'; // ← PRODUÇÃO
  
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
        } else {
          this.clearAllUserData();
        }
      } catch (error) {
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
      return throwError(() => ({ code: 'INVALID_DATA', message: 'Email e senha são obrigatórios' }));
    }

    if (!this.isValidEmail(email)) {
      return throwError(() => ({ code: 'INVALID_DATA', message: 'Email inválido' }));
    }

    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    const payload = {
      email: email.toLowerCase().trim(),
      password,
      rememberMe,
      deviceInfo: this.getDeviceInfo()
    };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    }).pipe(
      timeout(10000), // 10s timeout
      retry(1), // 1 retry em caso de erro de rede
      tap(response => {
        if (response.success && response.user && response.token) {
          this.setCurrentUser(response.user, response.token, response.refreshToken);
        }
      }),
      catchError(error => {
        // ✅ FALLBACK LOCAL SE API NÃO DISPONÍVEL
        if (error.status === 0 || error.name === 'TimeoutError') {
          return this.handleLocalAuth(email, password, 'login').pipe(
            tap(response => {
              if (response.success && response.user && response.token) {
                this.setCurrentUser(response.user, response.token, response.refreshToken);
              }
            })
          );
        }
        return this.handleAuthError('LOGIN', error);
      }),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  register(userData: RegisterRequest): Observable<LoginResponse> {
    if (!this.validateRegisterData(userData)) {
      return throwError(() => ({ code: 'INVALID_DATA', message: 'Dados de cadastro inválidos' }));
    }

    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    const payload = {
      ...userData,
      email: userData.email.toLowerCase().trim(),
      name: userData.name.trim(),
      deviceInfo: this.getDeviceInfo()
    };

    return this.http.post<LoginResponse>(`${this.API_URL}/auth/register`, payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    }).pipe(
      timeout(15000), // 15s timeout para registro
      retry(1),
      tap(response => {
        if (response.success && response.user && response.token) {
          this.setCurrentUser(response.user, response.token, response.refreshToken);
        }
      }),
      catchError(error => {
        // ✅ FALLBACK LOCAL SE API NÃO DISPONÍVEL  
        if (error.status === 0 || error.name === 'TimeoutError') {
          return this.handleLocalAuth(userData.email, userData.password, 'register', userData).pipe(
            tap(response => {
              if (response.success && response.user && response.token) {
                this.setCurrentUser(response.user, response.token, response.refreshToken);
              }
            })
          );
        }
        return this.handleAuthError('REGISTER', error);
      }),
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
    
    // Se tem usuário e token, consideraautenticado
    // Token validation é feita no background
    return !!(user && token);
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
    }
  }

  private saveUserToStorage(user: User): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
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
        }
      },
      error: () => {
        this.logout().subscribe();
      }
    });
  }

  private validateStoredToken(): void {
    const token = this.getAuthToken();
    if (token && !this.isTokenValid(token)) {
      this.clearAllUserData();
      this.currentUserSubject.next(null);
    }
  }

  private handleAuthError(operation: string, error: any): Observable<never> {
    
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
  // 🔄 AUTENTICAÇÃO LOCAL (FALLBACK)
  // ===============================================

  private handleLocalAuth(email: string, password: string, type: 'login' | 'register', userData?: RegisterRequest): Observable<LoginResponse> {
    
    // Simular delay de rede
    return timer(1000).pipe(
      map(() => {
        const storedUsers = this.getStoredUsers();
        
        if (type === 'login') {
          // ✅ VERIFICAR SE USUÁRIO EXISTE LOCALMENTE
          const existingUser = storedUsers.find(u => u.email === email.toLowerCase());
          
          if (!existingUser) {
            throw { code: 'INVALID_CREDENTIALS', message: 'Usuário não encontrado' };
          }
          
          // ✅ VERIFICAR SENHA (SIMULADO)
          const storedPassword = localStorage.getItem(`sowlfy_pwd_${email.toLowerCase()}`);
          if (storedPassword !== password) {
            throw { code: 'INVALID_CREDENTIALS', message: 'Senha incorreta' };
          }
          
          const user = this.createUserFromData(existingUser);
          const token = this.generateLocalToken(user);
          
          return {
            success: true,
            user,
            token,
            refreshToken: `refresh-local-${Date.now()}`,
            message: 'Login realizado com sucesso (modo local)'
          };
          
        } else {
          // ✅ REGISTRO LOCAL
          const existingUser = storedUsers.find(u => u.email === email.toLowerCase());
          
          if (existingUser) {
            throw { code: 'EMAIL_EXISTS', message: 'Email já cadastrado' };
          }
          
          const newUserData = {
            id: `local-${Date.now()}`,
            name: userData!.name,
            email: email.toLowerCase(),
            createdAt: new Date().toISOString(),
            plan: 'free' as const,
            isPremium: false
          };
          
          // ✅ SALVAR USUÁRIO E SENHA LOCALMENTE
          storedUsers.push(newUserData);
          localStorage.setItem('sowlfy_users', JSON.stringify(storedUsers));
          localStorage.setItem(`sowlfy_pwd_${email.toLowerCase()}`, password);
          
          const user = this.createUserFromData(newUserData);
          const token = this.generateLocalToken(user);
          
          return {
            success: true,
            user,
            token,
            refreshToken: `refresh-local-${Date.now()}`,
            message: 'Cadastro realizado com sucesso (modo local)'
          };
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  private getStoredUsers(): any[] {
    try {
      const stored = localStorage.getItem('sowlfy_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private createUserFromData(userData: any): User {
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      isPremium: userData.isPremium || false,
      plan: userData.plan || 'free',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&size=128&background=667eea&color=fff`,
      createdAt: new Date(userData.createdAt || Date.now()),
      lastLoginAt: new Date(),
      stats: {
        level: 1,
        xp: 0,
        streak: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        timeStudied: 0,
        quizzesCompleted: 0,
        averageScore: 0
      },
      preferences: {
        soundEnabled: true,
        darkTheme: false,
        emailNotifications: true,
        language: 'pt-BR'
      }
    };
  }

  private generateLocalToken(user: User): string {
    const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24h
    }));
    const signature = btoa('local-signature');
    
    return `${header}.${payload}.${signature}`;
  }
}
