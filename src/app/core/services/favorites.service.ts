// ===============================================
// ⭐ FAVORITES.SERVICE.TS - GESTÃO DE FAVORITOS NO FIRESTORE
// ===============================================

import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy, Timestamp } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// ===============================================
// 📝 INTERFACES
// ===============================================

export interface FavoriteQuestion {
  questionId: number;
  area: string;
  subject?: string;
  difficulty?: string;
  addedAt: Date;
  userId: string;
}

export interface FavoritesStats {
  total: number;
  byArea: { [key: string]: number };
  byDifficulty: { [key: string]: number };
  lastUpdated: Date;
}

// ===============================================
// 💎 FAVORITES SERVICE
// ===============================================

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  
  private favoritesSubject = new BehaviorSubject<Set<number>>(new Set());
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(private firestore: Firestore) {}

  // ===============================================
  // 📥 CARREGAR FAVORITOS DO FIRESTORE
  // ===============================================

  async loadFavorites(userId: string): Promise<Set<number>> {
    try {
      if (!userId) {
        console.warn('⚠️ UserID não fornecido para carregar favoritos');
        return new Set();
      }

      const favoritesRef = collection(this.firestore, `users/${userId}/favorites`);
      const snapshot = await getDocs(favoritesRef);
      
      const favoriteIds = new Set<number>();
      snapshot.forEach(doc => {
        const data = doc.data() as FavoriteQuestion;
        favoriteIds.add(data.questionId);
      });

      console.log(`⭐ Favoritos carregados do Firestore:`, favoriteIds.size);
      this.favoritesSubject.next(favoriteIds);
      
      return favoriteIds;
    } catch (error) {
      console.error('❌ Erro ao carregar favoritos do Firestore:', error);
      return new Set();
    }
  }

  // ===============================================
  // ➕ ADICIONAR FAVORITO
  // ===============================================

  async addFavorite(userId: string, questionId: number, area: string, subject?: string, difficulty?: string): Promise<boolean> {
    try {
      if (!userId) {
        console.warn('⚠️ UserID não fornecido para adicionar favorito');
        return false;
      }

      const favoriteRef = doc(this.firestore, `users/${userId}/favorites/${questionId}`);
      
      const favoriteData: FavoriteQuestion = {
        questionId,
        area,
        subject,
        difficulty,
        addedAt: new Date(),
        userId
      };

      await setDoc(favoriteRef, {
        ...favoriteData,
        addedAt: Timestamp.fromDate(favoriteData.addedAt)
      });

      // Atualizar estado local
      const currentFavorites = this.favoritesSubject.value;
      currentFavorites.add(questionId);
      this.favoritesSubject.next(currentFavorites);

      console.log(`💖 Favorito adicionado: ${questionId}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao adicionar favorito:', error);
      return false;
    }
  }

  // ===============================================
  // ➖ REMOVER FAVORITO
  // ===============================================

  async removeFavorite(userId: string, questionId: number): Promise<boolean> {
    try {
      if (!userId) {
        console.warn('⚠️ UserID não fornecido para remover favorito');
        return false;
      }

      const favoriteRef = doc(this.firestore, `users/${userId}/favorites/${questionId}`);
      await deleteDoc(favoriteRef);

      // Atualizar estado local
      const currentFavorites = this.favoritesSubject.value;
      currentFavorites.delete(questionId);
      this.favoritesSubject.next(currentFavorites);

      console.log(`⭐ Favorito removido: ${questionId}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover favorito:', error);
      return false;
    }
  }

  // ===============================================
  // ✅ VERIFICAR SE É FAVORITO
  // ===============================================

  isFavorite(questionId: number): boolean {
    return this.favoritesSubject.value.has(questionId);
  }

  // ===============================================
  // 📊 OBTER ESTATÍSTICAS DE FAVORITOS
  // ===============================================

  async getFavoritesStats(userId: string): Promise<FavoritesStats> {
    try {
      if (!userId) {
        return this.getEmptyStats();
      }

      const favoritesRef = collection(this.firestore, `users/${userId}/favorites`);
      const snapshot = await getDocs(favoritesRef);
      
      const byArea: { [key: string]: number } = {};
      const byDifficulty: { [key: string]: number } = {};
      let lastUpdated = new Date(0);

      snapshot.forEach(doc => {
        const data = doc.data() as FavoriteQuestion;
        
        // Contar por área
        byArea[data.area] = (byArea[data.area] || 0) + 1;
        
        // Contar por dificuldade
        if (data.difficulty) {
          byDifficulty[data.difficulty] = (byDifficulty[data.difficulty] || 0) + 1;
        }
        
        // Última atualização
        if (data.addedAt > lastUpdated) {
          lastUpdated = data.addedAt;
        }
      });

      return {
        total: snapshot.size,
        byArea,
        byDifficulty,
        lastUpdated
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de favoritos:', error);
      return this.getEmptyStats();
    }
  }

  // ===============================================
  // 📋 OBTER TODOS OS FAVORITOS COM DETALHES
  // ===============================================

  async getAllFavorites(userId: string): Promise<FavoriteQuestion[]> {
    try {
      if (!userId) {
        console.warn('⚠️ UserID não fornecido para obter favoritos');
        return [];
      }

      const favoritesRef = collection(this.firestore, `users/${userId}/favorites`);
      const snapshot = await getDocs(favoritesRef);
      
      const favorites: FavoriteQuestion[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        favorites.push({
          questionId: data['questionId'],
          area: data['area'],
          subject: data['subject'],
          difficulty: data['difficulty'],
          addedAt: data['addedAt']?.toDate() || new Date(),
          userId: data['userId']
        });
      });

      // Ordenar por data de adição (mais recentes primeiro)
      favorites.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

      console.log(`📋 Favoritos obtidos: ${favorites.length}`);
      return favorites;
    } catch (error) {
      console.error('❌ Erro ao obter favoritos:', error);
      return [];
    }
  }

  // ===============================================
  // 🔄 MIGRAR DO LOCALSTORAGE PARA FIRESTORE
  // ===============================================

  async migrateFromLocalStorage(userId: string, area: string = 'matematica'): Promise<number> {
    try {
      const savedFavorites = localStorage.getItem('favoriteQuestions');
      if (!savedFavorites) {
        console.log('📭 Nenhum favorito encontrado no localStorage');
        return 0;
      }

      const favoriteIds: number[] = JSON.parse(savedFavorites);
      console.log(`🔄 Migrando ${favoriteIds.length} favoritos do localStorage para Firestore...`);

      let migratedCount = 0;
      for (const questionId of favoriteIds) {
        const success = await this.addFavorite(userId, questionId, area);
        if (success) {
          migratedCount++;
        }
      }

      // Limpar localStorage após migração bem-sucedida
      if (migratedCount > 0) {
        localStorage.removeItem('favoriteQuestions');
        console.log(`✅ ${migratedCount} favoritos migrados com sucesso!`);
      }

      return migratedCount;
    } catch (error) {
      console.error('❌ Erro ao migrar favoritos:', error);
      return 0;
    }
  }

  // ===============================================
  // 🧹 LIMPAR FAVORITOS (PARA TESTES)
  // ===============================================

  async clearAllFavorites(userId: string): Promise<boolean> {
    try {
      if (!userId) {
        return false;
      }

      const favoritesRef = collection(this.firestore, `users/${userId}/favorites`);
      const snapshot = await getDocs(favoritesRef);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      this.favoritesSubject.next(new Set());
      console.log('🧹 Todos os favoritos foram removidos');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar favoritos:', error);
      return false;
    }
  }

  // ===============================================
  // 🛠️ MÉTODOS AUXILIARES
  // ===============================================

  private getEmptyStats(): FavoritesStats {
    return {
      total: 0,
      byArea: {},
      byDifficulty: {},
      lastUpdated: new Date()
    };
  }

  // Obter favoritos atuais (síncrono)
  getCurrentFavorites(): Set<number> {
    return this.favoritesSubject.value;
  }

  // Limpar cache local
  clearLocalCache(): void {
    this.favoritesSubject.next(new Set());
  }
}
