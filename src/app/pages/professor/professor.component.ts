import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface TeacherData {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
  schoolName: string;
}

interface SimuladoResult {
  id: string;
  ra: string;
  studentName: string;
  className: string;
  simuladoId: string;
  simuladoName: string;
  score: number;
  correct: number;
  total: number;
  timeFormatted: string;
  byArea: any[];
  questionsData: {
    id: number;
    question: string;
    options: { alias: string; name: string }[];
    correct: string;
    studentAnswer: string;
    isCorrect: boolean;
    area: string;
    explanation?: string;
    aula_tema?: string;
  }[];
  completedAt: string | null;
  nota: number;
}

@Component({
  selector: 'app-professor',
  templateUrl: './professor.component.html',
  styleUrls: ['./professor.component.css']
})
export class ProfessorComponent implements OnInit {

  // Auth state
  isLoggedIn = false;
  isLoggingIn = false;
  loginError = '';
  loginForm = { email: '', password: '' };

  // Data
  teacher: TeacherData | null = null;
  allResults: SimuladoResult[] = [];
  isLoadingResults = false;

  // Filters
  filterSimulado = '';
  filterClass = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('teacher_token');
    const teacherDataRaw = localStorage.getItem('teacher_data');
    if (token && teacherDataRaw) {
      try {
        this.teacher = JSON.parse(teacherDataRaw);
        this.isLoggedIn = true;
        this.loadResults();
      } catch {
        localStorage.removeItem('teacher_token');
        localStorage.removeItem('teacher_data');
      }
    }
  }

  async login() {
    if (!this.loginForm.email || !this.loginForm.password) {
      this.loginError = 'Preencha email e senha';
      return;
    }
    this.isLoggingIn = true;
    this.loginError = '';
    try {
      const resp: any = await this.http.post(
        'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/teacherLogin',
        { email: this.loginForm.email, password: this.loginForm.password }
      ).toPromise();

      if (resp?.success) {
        localStorage.setItem('teacher_token', resp.token);
        localStorage.setItem('teacher_data', JSON.stringify(resp.teacher));
        this.teacher = resp.teacher;
        this.isLoggedIn = true;
        this.loadResults();
      } else {
        this.loginError = resp?.error || 'Email ou senha incorretos';
      }
    } catch (e: any) {
      this.loginError = e?.error?.error || 'Email ou senha incorretos';
    }
    this.isLoggingIn = false;
  }

  logout() {
    localStorage.removeItem('teacher_token');
    localStorage.removeItem('teacher_data');
    this.isLoggedIn = false;
    this.teacher = null;
    this.allResults = [];
    this.loginForm = { email: '', password: '' };
  }

  async loadResults() {
    if (!this.teacher) return;
    this.isLoadingResults = true;
    try {
      const token = localStorage.getItem('teacher_token') || '';
      const resp: any = await this.http.post(
        'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/getSchoolSimuladoResults',
        { schoolId: this.teacher.schoolId, teacherToken: token }
      ).toPromise();

      if (resp?.success) {
        this.allResults = (resp.results || []).map((r: any) => ({
          ...r,
          nota: Math.round((r.score / 100) * 10 * 10) / 10
        })).sort((a: SimuladoResult, b: SimuladoResult) => {
          // Sort: simuladoName, then className, then studentName
          if (a.simuladoName !== b.simuladoName) return a.simuladoName.localeCompare(b.simuladoName);
          if (a.className !== b.className) return a.className.localeCompare(b.className);
          return a.studentName.localeCompare(b.studentName);
        });
      }
    } catch (e) {
      console.error('Erro ao carregar resultados:', e);
    }
    this.isLoadingResults = false;
  }

  get simuladoOptions(): string[] {
    const set = new Set(this.allResults.map(r => r.simuladoName || r.simuladoId));
    return Array.from(set).sort();
  }

  get classOptions(): string[] {
    const set = new Set(this.allResults.map(r => r.className));
    return Array.from(set).sort();
  }

  get filteredResults(): SimuladoResult[] {
    return this.allResults.filter(r => {
      if (this.filterSimulado && (r.simuladoName || r.simuladoId) !== this.filterSimulado) return false;
      if (this.filterClass && r.className !== this.filterClass) return false;
      return true;
    });
  }

  formatDate(iso: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // ── TOGGLE DETALHES ──
  expandedRowId: string | null = null;

  toggleRow(id: string): void {
    this.expandedRowId = this.expandedRowId === id ? null : id;
  }

  areaPercent(item: { total: number; correct: number }): number {
    if (!item.total) return 0;
    return Math.round((item.correct / item.total) * 100);
  }

  areaClass(item: { total: number; correct: number }): string {
    const p = this.areaPercent(item);
    if (p >= 70) return 'area-alta';
    if (p >= 50) return 'area-media';
    return 'area-baixa';
  }

  areaLabel(key: string): string {
    const labels: { [k: string]: string } = {
      'desenvolvimento-web': 'Desenvolvimento Web',
      'banco-de-dados': 'Banco de Dados',
      'redes': 'Redes',
      'sistemas-operacionais': 'Sistemas Operacionais',
      'seguranca': 'Segurança',
      'algoritmos': 'Algoritmos',
      'estrutura-de-dados': 'Estrutura de Dados',
      'engenharia-de-software': 'Engenharia de Software',
      'programacao': 'Programação',
      'hardware': 'Hardware',
      'cloud': 'Cloud Computing',
      'inteligencia-artificial': 'Inteligência Artificial',
      'simulados': 'Simulados',
    };
    return labels[key] || key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  notaClass(nota: number): string {
    if (nota >= 7) return 'nota-alta';
    if (nota >= 5) return 'nota-media';
    return 'nota-baixa';
  }
}
