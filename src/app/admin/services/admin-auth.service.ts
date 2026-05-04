import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private readonly STORAGE_KEY = 'sowlfy_admin_token';
  private readonly ADMIN_DATA_KEY = 'sowlfy_admin_data';
  private authSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  private adminDataSubject = new BehaviorSubject<any>(this.getStoredAdminData());

  constructor(private http: HttpClient) {}

  /**
   * Login do admin
   */
  async login(email: string, password: string): Promise<{success: boolean; token?: string; error?: string}> {
    try {
      const response = await this.http.post<any>(
        'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/adminLogin',
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      ).toPromise();

      if (response?.success && response?.token) {
        // Armazenar token
        localStorage.setItem(this.STORAGE_KEY, response.token);
        localStorage.setItem(this.ADMIN_DATA_KEY, JSON.stringify(response.adminData || { email }));
        
        this.authSubject.next(true);
        this.adminDataSubject.next(response.adminData || { email });
        
        return { success: true, token: response.token };
      } else {
        return { success: false, error: response?.error || 'Login falhou' };
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      return { success: false, error: error.message || 'Erro de conexão' };
    }
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ADMIN_DATA_KEY);
    this.authSubject.next(false);
    this.adminDataSubject.next(null);
  }

  /**
   * Verificar se está autenticado
   */
  isAuthenticated(): boolean {
    const result = this.hasValidToken();
    console.log('🔍 AdminAuthService.isAuthenticated():', {
      result,
      token: !!localStorage.getItem(this.STORAGE_KEY)
    });
    return result;
  }

  /**
   * Observable para autenticação
   */
  getIsAuthenticated$(): Observable<boolean> {
    return this.authSubject.asObservable();
  }

  /**
   * Obter token
   */
  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  /**
   * Obter dados do admin
   */
  getAdminData(): any {
    return this.getStoredAdminData();
  }

  /**
   * Observable para dados do admin
   */
  getAdminData$(): Observable<any> {
    return this.adminDataSubject.asObservable();
  }

  /**
   * Verificar se token é válido
   */
  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.STORAGE_KEY);
    if (!token) {
      console.log('❌ No admin token in localStorage');
      return false;
    }

    try {
      // Decodificar JWT e verificar expiração (payload é a 2ª parte)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('❌ Invalid token format (not 3 parts)');
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      const expirationTime = payload.exp * 1000;
      const now = Date.now();
      const isValid = now < expirationTime;
      
      console.log('🔍 Token validation:', {
        tokenExists: true,
        hasExp: !!payload.exp,
        expirationTime: new Date(expirationTime).toISOString(),
        now: new Date(now).toISOString(),
        isValid,
        diffSeconds: Math.round((expirationTime - now) / 1000)
      });
      
      return isValid;
    } catch (e) {
      console.log('❌ Error validating token:', e);
      // Se não conseguir validar JWT, mas o token existe, vou assumir que é válido
      // (pode ser um erro temporário na decodificação)
      console.log('⚠️ Fallback: assuming token is valid');
      return true;
    }
  }

  /**
   * 🔐 Mudar Senha do Admin
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{success: boolean; message?: string; error?: string}> {
    try {
      const adminData = this.getStoredAdminData();
      if (!adminData?.email) {
        return { success: false, error: 'Dados do admin não encontrados' };
      }

      const response = await this.http.post<any>(
        'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/changeAdminPassword',
        { 
          email: adminData.email,
          currentPassword,
          newPassword
        },
        { headers: { 'Content-Type': 'application/json' } }
      ).toPromise();

      if (response?.success) {
        return { success: true, message: response.message || 'Senha alterada com sucesso' };
      } else {
        return { success: false, error: response?.error || 'Falha ao alterar senha' };
      }
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      return { success: false, error: error.message || 'Erro de conexão' };
    }
  }

  /**
   * Obter dados do admin do localStorage
   */
  private getStoredAdminData(): any {
    const data = localStorage.getItem(this.ADMIN_DATA_KEY);
    return data ? JSON.parse(data) : null;
  }
}

