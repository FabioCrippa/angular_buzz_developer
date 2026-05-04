import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, collection, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AdminGuard {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    // ✅ VERIFICAR ADMIN TOKEN EM LOCALSTORAGE PRIMEIRO
    const adminToken = localStorage.getItem('sowlfy_admin_token');
    if (adminToken) {
      return true; // Admin autenticado via token
    }

    // ✅ VERIFICAR FIREBASE USER COMO FALLBACK
    const user = this.auth.currentUser;
    
    if (!user) {
      this.router.navigate(['/']);
      return false;
    }

    try {
      // Verificar se está em collection 'admins'
      const adminDoc = await getDoc(
        doc(this.firestore, 'admins', user.uid)
      );

      if (adminDoc.exists()) {
        return true;
      }
    } catch (error) {
      console.error('Admin Guard Error:', error);
    }

    this.router.navigate(['/']);
    return false;
  }
}
