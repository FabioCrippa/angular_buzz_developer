import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthGuard implements CanActivate {
  constructor(
    private adminAuthService: AdminAuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // ✅ DEBUG: Verificar token direto no localStorage
    const adminToken = localStorage.getItem('sowlfy_admin_token');
    console.log('🔐 AdminAuthGuard - Verificando acesso', {
      adminToken: !!adminToken,
      isAuthenticated: this.adminAuthService.isAuthenticated(),
      url: state.url
    });

    if (this.adminAuthService.isAuthenticated()) {
      console.log('✅ AdminAuthGuard - Acesso permitido');
      return true;
    }

    console.log('❌ AdminAuthGuard - Acesso negado, redirecionando para /login');
    // Redirecionar para login unificado
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
