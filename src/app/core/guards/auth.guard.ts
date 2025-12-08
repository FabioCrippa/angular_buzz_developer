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
      // ✅ USUÁRIO LOGADO, PERMITIR ACESSO
      this.authService.refreshUserData().subscribe({
        next: () => {},
        error: (error) => {
          // Se der erro, não bloquear o acesso, apenas avisar
        }
      });
      
      return of(true);
    }

    // ✅ USUÁRIO NÃO AUTENTICADO - REDIRECIONAMENTO INTELIGENTE
    
    // ✅ SALVAR URL PARA REDIRECT APÓS LOGIN
    localStorage.setItem('sowlfy_redirect_after_login', url);
    
    // ✅ REDIRECIONAR PARA HOME COM INFORMAÇÃO SOBRE LOGIN NECESSÁRIO
    this.router.navigate(['/'], {
      queryParams: { 
        returnUrl: url,
        authRequired: 'true',
        message: 'login_required'
      }
    });
    
    return of(false);
  }
}
