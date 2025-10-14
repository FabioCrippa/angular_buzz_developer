import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  createdAt: Date;
  lastLogin: Date;
  stats: {
    totalQuestions: number;
    correctAnswers: number;
    streak: number;
    level: number;
    timeStudied: number; // em minutos
    favoriteCount: number;
    quizzesTaken: number;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    autoSave: boolean;
    rememberMe?: boolean; // Novo campo para lembrar usuário
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public user$ = this.currentUser$;

  constructor(private router: Router) {
    this.loadUserFromStorage();
  }

  // ===============================================
  // 🔐 AUTENTICAÇÃO PRINCIPAL
  // ===============================================

  login(email: string, password: string, rememberMe: boolean = false): Observable<{ success: boolean; message: string; user?: User }> {
    return new Observable(observer => {
      // Simular delay de API
      setTimeout(() => {
        const validation = this.validateCredentials(email, password);
        
        if (validation.isValid) {
          const user = this.createMockUser(email);
          user.lastLogin = new Date();
          
          // ✅ SALVAR PREFERÊNCIA DE REMEMBER ME
          if (user.preferences) {
            user.preferences.rememberMe = rememberMe;
          }
          
          this.setCurrentUser(user, rememberMe);
          
          observer.next({
            success: true,
            message: `Bem-vindo de volta, ${user.name}!`,
            user: user
          });
        } else {
          observer.next({
            success: false,
            message: validation.message
          });
        }
        observer.complete();
      }, 1500); // Simula chamada real de API
    });
  }

  register(userData: { name: string; email: string; password: string; confirmPassword: string }): Observable<{ success: boolean; message: string; user?: User }> {
    return new Observable(observer => {
      setTimeout(() => {
        const validation = this.validateRegistration(userData);
        
        if (validation.isValid) {
          const user = this.createMockUser(userData.email, userData.name);
          this.setCurrentUser(user);
          
          observer.next({
            success: true,
            message: `Conta criada com sucesso! Bem-vindo, ${user.name}!`,
            user: user
          });
        } else {
          observer.next({
            success: false,
            message: validation.message
          });
        }
        observer.complete();
      }, 1500);
    });
  }

  logout(): void {
    const currentUser = this.getCurrentUser();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
    
    // Opcional: Salvar dados de sessão
    if (currentUser) {
      const sessionData = {
        lastLogout: new Date(),
        sessionDuration: Date.now() - new Date(currentUser.lastLogin).getTime()
      };
      localStorage.setItem(`session_${currentUser.id}`, JSON.stringify(sessionData));
    }
    
    this.router.navigate(['/']);
  }

  // ===============================================
  // 👤 GESTÃO DE USUÁRIO
  // ===============================================

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const token = localStorage.getItem('authToken');
    return user !== null && token !== null;
  }

  isPremium(): boolean {
    const user = this.getCurrentUser();
    return user?.isPremium || false;
  }

  updateUserStats(updates: Partial<User['stats']>): void {
    const user = this.getCurrentUser();
    if (!user) return;

    user.stats = { ...user.stats, ...updates };
    this.setCurrentUser(user);
  }

  updateUserPreferences(preferences: Partial<User['preferences']>): void {
    const user = this.getCurrentUser();
    if (!user) return;

    user.preferences = { ...user.preferences, ...preferences };
    this.setCurrentUser(user);
  }

  upgradeToPremium(): Observable<{ success: boolean; message: string }> {
    return new Observable(observer => {
      setTimeout(() => {
        const user = this.getCurrentUser();
        if (user) {
          user.isPremium = true;
          this.setCurrentUser(user);
          observer.next({
            success: true,
            message: 'Parabéns! Sua conta foi upgradada para Premium!'
          });
        } else {
          observer.next({
            success: false,
            message: 'Erro ao fazer upgrade. Faça login novamente.'
          });
        }
        observer.complete();
      }, 1000);
    });
  }

  // ===============================================
  // 🔧 VALIDAÇÕES
  // ===============================================

  private validateCredentials(email: string, password: string): { isValid: boolean; message: string } {
    if (!email || !password) {
      return { isValid: false, message: 'Preencha todos os campos' };
    }

    if (!this.isValidEmail(email)) {
      return { isValid: false, message: 'Email inválido' };
    }

    if (password.length < 4) {
      return { isValid: false, message: 'Senha deve ter pelo menos 4 caracteres' };
    }

    // Mock: Simular usuários existentes
    const mockUsers = ['admin@test.com', 'user@test.com', 'demo@buzzdeveloper.com'];
    const mockPasswords = ['1234', 'admin', 'test', 'demo'];
    
    if (mockUsers.includes(email) && mockPasswords.includes(password)) {
      return { isValid: true, message: 'Credenciais válidas' };
    }

    // Para demo: aceitar qualquer combinação válida
    return { isValid: true, message: 'Login aceito para demo' };
  }

  private validateRegistration(userData: { name: string; email: string; password: string; confirmPassword: string }): { isValid: boolean; message: string } {
    if (!userData.name || !userData.email || !userData.password || !userData.confirmPassword) {
      return { isValid: false, message: 'Preencha todos os campos' };
    }

    if (userData.name.length < 2) {
      return { isValid: false, message: 'Nome deve ter pelo menos 2 caracteres' };
    }

    if (!this.isValidEmail(userData.email)) {
      return { isValid: false, message: 'Email inválido' };
    }

    if (userData.password.length < 6) {
      return { isValid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
    }

    if (userData.password !== userData.confirmPassword) {
      return { isValid: false, message: 'Senhas não coincidem' };
    }

    return { isValid: true, message: 'Dados válidos' };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ===============================================
  // 📊 DADOS MOCK REALISTAS
  // ===============================================

  private createMockUser(email: string, name?: string): User {
    const userId = this.generateId();
    const userName = name || this.generateNameFromEmail(email);
    
    return {
      id: userId,
      name: userName,
      email: email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
      isPremium: Math.random() > 0.7, // 30% chance de ser premium
      createdAt: this.getRandomPastDate(90), // Conta criada até 90 dias atrás
      lastLogin: new Date(),
      stats: {
        totalQuestions: Math.floor(Math.random() * 500) + 50,
        correctAnswers: Math.floor(Math.random() * 300) + 30,
        streak: Math.floor(Math.random() * 15) + 1,
        level: Math.floor(Math.random() * 10) + 1,
        timeStudied: Math.floor(Math.random() * 3000) + 120, // em minutos
        favoriteCount: Math.floor(Math.random() * 50) + 5,
        quizzesTaken: Math.floor(Math.random() * 100) + 10
      },
      preferences: {
        theme: Math.random() > 0.5 ? 'light' : 'dark',
        notifications: Math.random() > 0.3,
        autoSave: Math.random() > 0.2
      }
    };
  }

  private generateNameFromEmail(email: string): string {
    const baseName = email.split('@')[0];
    const names = [
      'Ana Silva', 'João Santos', 'Maria Oliveira', 'Pedro Costa', 'Carla Souza',
      'Lucas Lima', 'Fernanda Alves', 'Rafael Pereira', 'Juliana Rodrigues', 'Bruno Ferreira',
      'Camila Martins', 'Diego Ribeiro', 'Larissa Barbosa', 'Thiago Nascimento', 'Gabriela Cardoso'
    ];
    
    // Se o email contém um nome reconhecível, usar ele
    if (baseName.length > 3 && !baseName.includes('.')) {
      return baseName.charAt(0).toUpperCase() + baseName.slice(1);
    }
    
    // Senão, escolher um nome aleatório
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomPastDate(maxDaysAgo: number): Date {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - daysAgo);
    return pastDate;
  }

  // ===============================================
  // 💾 PERSISTÊNCIA
  // ===============================================

  private setCurrentUser(user: User, rememberMe: boolean = false): void {
    // Salvar usuário
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // ✅ TOKEN COM TEMPO DIFERENTE BASEADO EM REMEMBER ME
    const token = this.generateAuthToken(user, rememberMe);
    localStorage.setItem('authToken', token);
    
    // Atualizar BehaviorSubject
    this.currentUserSubject.next(user);
  }

  private loadUserFromStorage(): void {
    try {
      const userData = localStorage.getItem('currentUser');
      const token = localStorage.getItem('authToken');
      
      if (userData && token) {
        const user = JSON.parse(userData);
        // Validar se o token ainda é válido (mock)
        if (this.isValidToken(token)) {
          this.currentUserSubject.next(user);
        } else {
          // Token expirado, limpar dados
          this.logout();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar usuário do storage:', error);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    }
  }

  // ✅ ATUALIZAR generateAuthToken para suportar rememberMe
  private generateAuthToken(user: User, rememberMe: boolean = false): string {
    const expirationTime = rememberMe 
      ? (30 * 24 * 60 * 60 * 1000) // 30 dias se remember me
      : (7 * 24 * 60 * 60 * 1000);  // 7 dias normal
    
    const tokenData = {
      userId: user.id,
      email: user.email,
      isPremium: user.isPremium,
      issuedAt: Date.now(),
      expiresAt: Date.now() + expirationTime,
      rememberMe: rememberMe
    };
    
    return btoa(JSON.stringify(tokenData));
  }

  private isValidToken(token: string): boolean {
    try {
      const tokenData = JSON.parse(atob(token));
      return tokenData.expiresAt > Date.now();
    } catch {
      return false;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // ===============================================
  // 🔒 SECURITY HELPERS
  // ===============================================

  canAccessPremiumContent(): boolean {
    return this.isAuthenticated() && this.isPremium();
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  refreshSession(): void {
    const user = this.getCurrentUser();
    if (user) {
      user.lastLogin = new Date();
      this.setCurrentUser(user);
    }
  }
}
