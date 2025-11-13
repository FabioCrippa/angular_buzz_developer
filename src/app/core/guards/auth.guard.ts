// ===============================================
// 🛡️ AUTH.GUARD.TS - CORREÇÃO
// ===============================================

// filepath: c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app\core\guards\auth.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): Observable<boolean> {
    if (this.authService.isAuthenticated()) {
      // ✅ CORRIGIDO: Usar refreshUserData() em vez de refreshSession()
      this.authService.refreshUserData().subscribe({
        next: () => console.log('✅ Dados do usuário atualizados'),
        error: (error) => {
          console.warn('⚠️ Erro ao atualizar dados:', error);
          // Se der erro, não bloquear o acesso, apenas avisar
        }
      });
      
      return of(true);
    }

    // ✅ USUÁRIO NÃO AUTENTICADO
    console.log('🔐 Usuário não autenticado, redirecionando para home');
    this.router.navigate(['/'], {
      queryParams: { returnUrl: url }
    });
    
    return of(false);
  }
}
