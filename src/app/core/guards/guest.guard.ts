import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    // ✅ VERIFICAR ADMIN OU ESTUDANTE NO LOCALSTORAGE PRIMEIRO
    const adminToken = localStorage.getItem('sowlfy_admin_token');
    if (adminToken) {
      console.log('🚫 GuestGuard: Admin autenticado, redirecionando para admin/dashboard');
      this.router.navigate(['/admin/dashboard']);
      return false;
    }

    const studentToken = localStorage.getItem('student_token');
    if (studentToken) {
      console.log('🚫 GuestGuard: Estudante autenticado, redirecionando para quizz');
      this.router.navigate(['/quizz']);
      return false;
    }
    
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user && this.authService.isAuthenticated()) {
          // ✅ Usuário já está logado - redirecionar para dashboard
          console.log('🚫 GuestGuard: Usuário autenticado, redirecionando para dashboard');
          this.router.navigate(['/dashboard']);
          return false;
        } else {
          // ✅ Usuário não está logado - permitir acesso à página de guest (login/register)
          return true;
        }
      })
    );
  }
}
