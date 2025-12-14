// ===============================================
// 🔐 AUTH.SERVICE.TS - VERSÃO PRODUÇÃO COMPLETA
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app\core\services\auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, timer, from } from 'rxjs';
import { map, catchError, tap, retry, timeout, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ✅ FIREBASE IMPORTS
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser, updateProfile } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc, collection, Timestamp } from '@angular/fire/firestore';

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
  
  private readonly API_URL = `${environment.apiUrl}/api`;
  
  private readonly STORAGE_KEYS = {
    USER: 'sowlfy_user',
    TOKEN: 'sowlfy_token', 
    REFRESH_TOKEN: 'sowlfy_refresh_token',
    LAST_LOGIN: 'sowlfy_last_login',
    THEME: 'sowlfy_theme'
  };

  // ✅ FIREBASE INJECTIONS
  constructor(
    private http: HttpClient,
    private auth: Auth,
    private firestore: Firestore
  ) {
    this.initializeAuthState();
  }

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

  // ===============================================
  // 🚀 INICIALIZAÇÃO
  // ===============================================

  private initializeAuthState(): void {
    // ✅ MONITORA MUDANÇAS NO ESTADO DE AUTENTICAÇÃO DO FIREBASE
    this.auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const user = await this.loadUserFromFirestore(firebaseUser.uid);
        if (user) {
          this.setCurrentUser(user, token);
        }
      } else {
        this.clearAllUserData();
      }
    });
  }

  private async loadUserFromFirestore(uid: string): Promise<User | null> {
    try {
      const userRef = doc(this.firestore, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          id: uid,
          name: data['name'],
          email: data['email'],
          isPremium: data['isPremium'] || false,
          plan: data['plan'] || 'free',
          avatar: data['avatar'],
          createdAt: data['createdAt']?.toDate(),
          lastLoginAt: new Date(),
          stats: data['stats'] || this.getDefaultStats(),
          preferences: data['preferences'] || this.getDefaultPreferences(),
          subscription: data['subscription']
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao carregar usuário do Firestore:', error);
      return null;
    }
  }

  private getDefaultStats() {
    return {
      level: 1,
      xp: 0,
      streak: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      timeStudied: 0,
      quizzesCompleted: 0,
      averageScore: 0
    };
  }

  private getDefaultPreferences() {
    return {
      soundEnabled: true,
      darkTheme: false,
      emailNotifications: true,
      language: 'pt-BR' as const
    };
  }

  // ===============================================
  // 🔐 AUTENTICAÇÃO PRINCIPAL
  // ===============================================
  // 🔐 AUTENTICAÇÃO COM FIREBASE
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

    // ✅ LOGIN COM FIREBASE AUTHENTICATION
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (credential) => {
        const token = await credential.user.getIdToken();
        const user = await this.loadUserFromFirestore(credential.user.uid);
        
        if (!user) {
          throw new Error('Usuário não encontrado no Firestore');
        }

        // ✅ ATUALIZA ÚLTIMO LOGIN
        await this.updateLastLogin(credential.user.uid);

        return {
          success: true,
          user,
          token,
          refreshToken: token,
          message: 'Login realizado com sucesso!'
        };
      }),
      tap(response => {
        this.setCurrentUser(response.user, response.token, response.refreshToken);
      }),
      catchError(error => {
        const authError = this.handleFirebaseError(error);
        this.errorSubject.next(authError);
        return throwError(() => authError);
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

    const email = userData.email.toLowerCase().trim();
    const name = userData.name.trim();

    // ✅ CADASTRO COM FIREBASE AUTHENTICATION
    return from(createUserWithEmailAndPassword(this.auth, email, userData.password)).pipe(
      switchMap(async (credential) => {
        // ✅ ATUALIZA PERFIL DO FIREBASE
        await updateProfile(credential.user, { displayName: name });

        // ✅ CRIA DOCUMENTO NO FIRESTORE
        const user: User = {
          id: credential.user.uid,
          name,
          email,
          isPremium: false,
          plan: 'free',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          stats: this.getDefaultStats(),
          preferences: this.getDefaultPreferences()
        };

        await this.createUserDocument(credential.user.uid, user);

        const token = await credential.user.getIdToken();

        return {
          success: true,
          user,
          token,
          refreshToken: token,
          message: 'Cadastro realizado com sucesso!'
        };
      }),
      tap(response => {
        this.setCurrentUser(response.user, response.token, response.refreshToken);
      }),
      catchError(error => {
        const authError = this.handleFirebaseError(error);
        this.errorSubject.next(authError);
        return throwError(() => authError);
      }),
      tap(() => this.isLoadingSubject.next(false))
    );
  }

  private async createUserDocument(uid: string, user: User): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, {
      name: user.name,
      email: user.email,
      isPremium: false,
      plan: 'free',
      createdAt: Timestamp.fromDate(user.createdAt),
      lastLoginAt: Timestamp.fromDate(user.lastLoginAt),
      stats: user.stats,
      preferences: user.preferences
    });
  }

  private async updateLastLogin(uid: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', uid);
      await updateDoc(userRef, {
        lastLoginAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
    }
  }

  private handleFirebaseError(error: any): AuthError {
    const errorCode = error.code || 'UNKNOWN_ERROR';
    
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Este email já está cadastrado',
      'auth/invalid-email': 'Email inválido',
      'auth/weak-password': 'Senha muito fraca. Use no mínimo 6 caracteres',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet'
    };

    return {
      code: errorCode,
      message: errorMessages[errorCode] || 'Erro ao processar autenticação',
      details: error
    };
  }

  logout(everywhere: boolean = false): Observable<boolean> {
    this.isLoadingSubject.next(true);

    // ✅ LOGOUT DO FIREBASE
    return from(signOut(this.auth)).pipe(
      tap(() => {
        this.clearAllUserData();
        this.currentUserSubject.next(null);
      }),
      map(() => true),
      catchError(() => {
        // ✅ MESMO COM ERRO, LIMPAR DADOS LOCAIS
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
    // ✅ VERIFICA PRIMEIRO O LOCALSTORAGE PARA EVITAR PROBLEMAS DE TIMING
    const token = this.getAuthToken();
    const storedUser = localStorage.getItem(this.STORAGE_KEYS.USER);
    
    // Se tem token E dados de usuário salvos, considera autenticado
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Se currentUserSubject ainda está null, popula ele
        if (!this.currentUserSubject.value && userData) {
          this.currentUserSubject.next(userData);
        }
        return true;
      } catch (error) {
        return false;
      }
    }
    
    // Fallback: verifica o Subject (pode ser null em carregamento inicial)
    const user = this.currentUserSubject.value;
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
