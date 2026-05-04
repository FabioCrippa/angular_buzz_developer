// ===============================================
// 🎯 ANONYMOUS ATTEMPT SERVICE
// ===============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AttemptValidationResponse {
  allowed: boolean;
  attempts: number;
  remaining: number;
  message: string;
  resetAt?: number;
  nextResetAt?: number;
}

export interface RemainingAttemptsResponse {
  attempts: number;
  remaining: number;
  maxAttempts: number;
  today: string;
  deviceId: string;
  lastAttempt: string | null;
  resetAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnonymousAttemptService {
  private apiUrl = environment.production
    ? 'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/api'
    : 'http://localhost:5001/angular-buzz-developer/southamerica-east1/api';

  constructor(private http: HttpClient) {}

  // ✅ GERAR DEVICE ID ÚNICO
  getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('sowlfy_device_id');

    if (!deviceId) {
      deviceId = this.generateUUID();
      localStorage.setItem('sowlfy_device_id', deviceId);
    }

    return deviceId;
  }

  // ✅ OBTER IP DO CLIENTE
  async getClientIp(): Promise<string> {
    try {
      const response = await this.http.get<{ ip: string }>('https://api.ipify.org?format=json').toPromise();
      return response?.ip || 'unknown';
    } catch (error) {
      console.warn('Erro ao obter IP:', error);
      return 'unknown';
    }
  }

  // ✅ VALIDAR TENTATIVA (INCREMENTA CONTADOR)
  validateAttempt(deviceId: string, userIp: string): Observable<AttemptValidationResponse> {
    const params = {
      deviceId,
      userIp
    };

    return this.http.get<AttemptValidationResponse>(
      `${this.apiUrl}/v1/anonymous/validate-attempt`,
      { params }
    );
  }

  // ✅ OBTER TENTATIVAS RESTANTES
  getRemainingAttempts(deviceId: string, userIp: string): Observable<RemainingAttemptsResponse> {
    const params = {
      deviceId,
      userIp
    };

    return this.http.get<RemainingAttemptsResponse>(
      `${this.apiUrl}/v1/anonymous/get-remaining-attempts`,
      { params }
    );
  }

  // ✅ GERAR UUID
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
