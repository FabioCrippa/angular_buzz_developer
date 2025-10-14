import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user && this.authService.isAuthenticated()) {
          // Usuário autenticado - permitir acesso
          this.authService.refreshSession(); // Atualizar sessão
          return true;
        } else {
          // Usuário não autenticado - redirecionar para login
          this.handleUnauthorizedAccess(url);
          return false;
        }
      })
    );
  }

  private handleUnauthorizedAccess(attemptedUrl: string): void {
    // Salvar URL que o usuário tentou acessar
    if (attemptedUrl && attemptedUrl !== '/') {
      localStorage.setItem('redirectAfterLogin', attemptedUrl);
    }

    // Mostrar mensagem
    this.snackBar.open(
      'Faça login para acessar esta página',
      'Login',
      {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['warning-snackbar']
      }
    ).onAction().subscribe(() => {
      this.router.navigate(['/login']);
    });

    // Redirecionar para login
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }
}
