import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SchoolService } from '../../admin/services/school.service';

interface StudentAttempt {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  duration: number;
  timestamp: Date;
}

interface StudentStats {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  lastAttempt?: Date;
  attempts: StudentAttempt[];
}

@Component({
  selector: 'app-school-dashboard',
  templateUrl: './school-dashboard.component.html',
  styleUrls: ['./school-dashboard.component.css'],
})
export class SchoolDashboardComponent implements OnInit {
  studentName: string = '';
  studentRa: string = '';
  schoolId: string = '';

  stats: StudentStats = {
    totalAttempts: 0,
    averageScore: 0,
    bestScore: 0,
    attempts: [],
  };

  isLoading: boolean = true;
  error: string = '';
  showLogoutConfirm: boolean = false;

  constructor(
    private schoolService: SchoolService,
    private router: Router
  ) {
    this.loadStudentData();
  }

  ngOnInit(): void {
    this.loadStudentStats();
  }

  loadStudentData(): void {
    const stored = localStorage.getItem('school_student_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.studentName = data.studentName || '';
        this.studentRa = data.studentRa || '';
        this.schoolId = data.schoolId || '';

        if (!this.studentRa || !this.schoolId) {
          this.router.navigate(['/login']);
        }
      } catch (e) {
        console.error('Erro ao carregar dados do aluno:', e);
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadStudentStats(): void {
    if (!this.schoolId || !this.studentRa) {
      this.isLoading = false;
      return;
    }

    this.schoolService
      .getStudentStats(this.schoolId, this.studentRa)
      .then((stats: StudentStats) => {
        this.stats = stats;
        this.isLoading = false;
      })
      .catch((error: any) => {
        console.error('Erro ao carregar estatísticas:', error);
        this.error = 'Erro ao carregar dados do aluno';
        this.isLoading = false;
      });
  }

  startQuiz(): void {
    // Salvar contexto da escola para que o quiz saiba registrar a tentativa
    localStorage.setItem('quiz_context', JSON.stringify({
      schoolId: this.schoolId,
      studentRa: this.studentRa,
      studentName: this.studentName,
    }));

    this.router.navigate(['/quiz']);
  }

  logout(): void {
    if (this.showLogoutConfirm) {
      localStorage.removeItem('school_student_data');
      localStorage.removeItem('quiz_context');
      this.router.navigate(['/login']);
    } else {
      this.showLogoutConfirm = true;
      setTimeout(() => {
        this.showLogoutConfirm = false;
      }, 3000);
    }
  }

  formatDate(date: any): string {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getScoreColor(percentage: number): string {
    if (percentage >= 80) return '#4CAF50'; // Verde
    if (percentage >= 60) return '#FF9800'; // Laranja
    return '#F44336'; // Vermelho
  }
}
