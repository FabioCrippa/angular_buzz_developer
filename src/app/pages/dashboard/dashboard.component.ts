import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

interface QuestionData {
  metadata: {
    area: string;
    subject: string;
    name: string;
    description: string;
    questionCount: number;
  };
  questions: any[];
}

interface IndexData {
  appInfo: {
    name: string;
    version: string;
    description: string;
  };
  stats: {
    totalQuestions: number;
    byArea: { [key: string]: number };
  };
  structure: { [key: string]: string[] };
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  // Dados do dashboard
  appInfo: any = {};
  totalQuestions: number = 0;
  areas: any[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.isLoading = true;
    this.hasError = false;

    // Carregar index.json primeiro
    this.http.get<IndexData>('assets/data/index.json').subscribe({
      next: (indexData) => {
        this.appInfo = indexData.appInfo;
        this.totalQuestions = indexData.stats.totalQuestions;
        
        // Preparar dados das áreas
        this.areas = Object.entries(indexData.stats.byArea).map(([area, count]) => ({
          name: area,
          displayName: this.getAreaDisplayName(area),
          questionCount: count,
          subjects: indexData.structure[area] || [],
          available: count > 0
        }));

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados do dashboard:', error);
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar dados do dashboard. Tente recarregar a página.';
        this.isLoading = false;
      }
    });
  }

  private getAreaDisplayName(area: string): string {
    const displayNames: { [key: string]: string } = {
      'desenvolvimento-web': 'Desenvolvimento Web',
      'metodologias': 'Metodologias Ágeis',
      'seguranca': 'Segurança',
      'design': 'Design & UX',
      'entrevista': 'Preparação para Entrevista',
      'portugues': 'Português',
      'matematica': 'Matemática',
      'informatica': 'Informática'
    };
    
    return displayNames[area] || area;
  }

  // Método para navegar para uma área específica
  navigateToArea(area: string) {
    if (this.areas.find(a => a.name === area)?.available) {
      // Implementar navegação aqui
      console.log(`Navegando para área: ${area}`);
    }
  }

  // Método para recarregar dados
  reloadData() {
    this.loadDashboardData();
  }
}
