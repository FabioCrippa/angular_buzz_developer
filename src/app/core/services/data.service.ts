import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  
  constructor(private http: HttpClient) {}

  // Busca o arquivo index.json
  getIndex(): Observable<any> {
    return this.http.get('/assets/data/index.json');
  }

  // Busca questões de uma área/matéria específica
  getQuestions(area: string, subject: string): Observable<any> {
    return this.http.get(`/assets/data/areas/${area}/${subject}.json`);
  }

  // Busca todas as questões de uma área (se necessário no futuro)
  getAreaQuestions(area: string): Observable<any[]> {
    return this.http.get<any[]>(`/assets/data/areas/${area}/`);
  }
}
