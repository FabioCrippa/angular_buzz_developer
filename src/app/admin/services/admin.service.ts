import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(
    private firestore: Firestore,
    private auth: AuthService
  ) {}

  /**
   * Criar admin (superadmin só)
   */
  async createAdmin(email: string, name: string): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) throw new Error('Não autenticado');

      // Verificar se já existe admin
      const adminDoc = await getDoc(doc(this.firestore, 'admins', currentUser.uid));
      if (!adminDoc.exists()) {
        throw new Error('Apenas superadmins podem criar novos admins');
      }

      // Aqui entra lógica de criptografia de senha, etc
      // Por enquanto, apenas criar documento
      await setDoc(doc(this.firestore, 'admins', currentUser.uid), {
        email,
        name,
        role: 'admin',
        createdAt: new Date(),
        active: true
      });
    } catch (error) {
      console.error('Erro ao criar admin:', error);
      throw error;
    }
  }

  /**
   * Verificar se usuário é admin
   */
  async isAdmin(uid: string): Promise<boolean> {
    try {
      const adminDoc = await getDoc(doc(this.firestore, 'admins', uid));
      return adminDoc.exists();
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }
  }

  /**
   * Obter dados do admin
   */
  async getAdminData(uid: string): Promise<any> {
    try {
      const adminDoc = await getDoc(doc(this.firestore, 'admins', uid));
      if (adminDoc.exists()) {
        return adminDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter dados do admin:', error);
      throw error;
    }
  }
}
