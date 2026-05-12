import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  CollectionReference
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class SchoolService {
  constructor(
    private firestore: Firestore
  ) {}

  /**
   * Criar nova escola
   */
  async createSchool(schoolData: {
    name: string;
    city: string;
    email: string;
    phone: string;
  }): Promise<{ schoolId: string; sharedPassword: string }> {
    try {
      // Gerar ID único da escola
      const schoolId = `school_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Gerar senha única (ex: VN2024)
      const sharedPassword = this.generateSchoolPassword(schoolData.name);

      // Nota: A criação real de escolas deve usar Cloud Functions
      // Este método é apenas para referência local
      return {
        schoolId,
        sharedPassword
      };
    } catch (error) {
      console.error('Erro ao criar escola:', error);
      throw error;
    }
  }

  /**
   * Obter dados da escola
   */
  async getSchool(schoolId: string): Promise<any> {
    try {
      const schoolDoc = await getDoc(doc(this.firestore, 'schools', schoolId));
      if (schoolDoc.exists()) {
        return schoolDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter escola:', error);
      throw error;
    }
  }

  /**
   * Listar escolas do admin
   */
  async getAdminSchools(): Promise<any[]> {
    try {
      // Para MVP, retornar todas as escolas
      // Em produção, filtrar por adminUid do usuário autenticado
      const schoolsRef = collection(this.firestore, 'schools');
      const snapshot = await getDocs(schoolsRef);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Converter timestamps do Firestore para Date
          createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : data['createdAt'],
          expiresAt: data['expiresAt']?.toDate ? data['expiresAt'].toDate() : data['expiresAt'],
          lastPaymentDate: data['lastPaymentDate']?.toDate ? data['lastPaymentDate'].toDate() : data['lastPaymentDate'],
          cancelledAt: data['cancelledAt']?.toDate ? data['cancelledAt'].toDate() : data['cancelledAt']
        };
      });
    } catch (error) {
      console.error('Erro ao listar escolas:', error);
      throw error;
    }
  }

  /**
   * Upload de CSV com alunos
   */
  async uploadStudents(
    schoolId: string,
    csvContent: string
  ): Promise<{ processedCount: number; students: any[] }> {
    try {
      const lines = csvContent.split('\n');
      const students = [];

      // Pular header e linhas vazias
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 4) continue;

        const ra = values[0];
        const name = values[1];
        const email = values[2];
        const classe = values[3];

        // Salvar aluno
        const studentRef = doc(
          this.firestore,
          `school_students/${schoolId}/students`,
          ra
        );

        await setDoc(studentRef, {
          ra,
          name,
          email,
          class: classe,
          uid: null,
          accessLevel: 'school_premium',
          accessExpiresAt: new Date(Date.now() + 365 * 86400000), // 1 ano
          status: 'active',
          createdAt: new Date(),
          firstLogin: true
        });

        students.push({ ra, name, email, classe });
      }

      // Atualizar contagem na escola
      await updateDoc(doc(this.firestore, 'schools', schoolId), {
        totalStudents: students.length
      });

      return {
        processedCount: students.length,
        students
      };
    } catch (error) {
      console.error('Erro ao fazer upload de alunos:', error);
      throw error;
    }
  }

  /**
   * Listar alunos da escola
   */
  async getSchoolStudents(schoolId: string): Promise<any[]> {
    try {
      const studentsRef = collection(
        this.firestore,
        `school_students/${schoolId}/students`
      );
      const snapshot = await getDocs(studentsRef);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao listar alunos:', error);
      throw error;
    }
  }

  /**
   * Validar login de aluno (RA + Senha)
   */
  async validateStudentLogin(
    schoolId: string,
    ra: string,
    password: string
  ): Promise<{ uid: string; name: string; email: string } | null> {
    try {
      // Obter dados da escola para comparar senha
      const school = await this.getSchool(schoolId);
      if (!school) throw new Error('Escola não encontrada');

      // Validar senha única
      if (password !== school.sharedPassword) {
        throw new Error('Senha incorreta');
      }

      // Obter aluno
      const studentRef = doc(
        this.firestore,
        `school_students/${schoolId}/students`,
        ra
      );
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        throw new Error('RA não encontrado');
      }

      const student = studentSnap.data() as any;

      // Validar status
      if (student['status'] !== 'active') {
        throw new Error('Acesso bloqueado');
      }

      return {
        uid: student['uid'] || ra,
        name: student['name'],
        email: student['email']
      };
    } catch (error) {
      console.error('Erro ao validar login:', error);
      throw error;
    }
  }

  /**
   * Gerar senha única por escola
   * Exemplo: "VN2024" (primeiras letras do nome + ano)
   */
  private generateSchoolPassword(schoolName: string): string {
    const initials = schoolName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substr(0, 2);

    const year = new Date().getFullYear().toString().substr(2);
    return `${initials}${year}`;
  }

  /**
   * Registrar tentativa de quiz
   */
  async recordQuizAttempt(data: {
    schoolId: string;
    ra: string;
    studentName: string;
    score: number;
    totalQuestions: number;
    duration: number;
    questionsAnswered: any[];
  }): Promise<void> {
    try {
      const attemptId = `attempt_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const percentage = (data.score / data.totalQuestions) * 100;

      await setDoc(doc(this.firestore, 'quiz_attempts', attemptId), {
        ...data,
        percentage: Math.round(percentage),
        timestamp: new Date(),
        type: 'pool_fixo'
      });

      // Registrar em histórico do aluno também
      await setDoc(
        doc(
          this.firestore,
          `school_students/${data.schoolId}/students/${data.ra}/attempts`,
          attemptId
        ),
        {
          score: data.score,
          totalQuestions: data.totalQuestions,
          percentage: Math.round(percentage),
          duration: data.duration,
          timestamp: new Date()
        }
      );
    } catch (error) {
      console.error('Erro ao registrar tentativa:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de TODOS os alunos da escola em UMA query (batch)
   * Muito mais eficiente que N queries individuais
   */
  async getAllStudentStats(schoolId: string): Promise<Map<string, any>> {
    try {
      const attemptsRef = collection(this.firestore, 'quiz_attempts');
      const q = query(attemptsRef, where('schoolId', '==', schoolId));
      const snapshot = await getDocs(q);

      const byRa = new Map<string, any[]>();
      for (const d of snapshot.docs) {
        const data = d.data() as any;
        const ra = data['ra'];
        if (!byRa.has(ra)) byRa.set(ra, []);
        byRa.get(ra)!.push(data);
      }

      const result = new Map<string, any>();
      byRa.forEach((attempts, ra) => {
        // Ordenar por timestamp para garantir que lastAttempt seja o mais recente
        const sorted = attempts.slice().sort((a, b) => {
          const tA = a['timestamp']?.toDate ? a['timestamp'].toDate().getTime() : new Date(a['timestamp'] || 0).getTime();
          const tB = b['timestamp']?.toDate ? b['timestamp'].toDate().getTime() : new Date(b['timestamp'] || 0).getTime();
          return tA - tB;
        });
        const totalScore = sorted.reduce((sum, a) => sum + (a['score'] || 0), 0);
        const averageScore = (totalScore / sorted.length).toFixed(1);
        const bestScore = Math.max(...sorted.map(a => a['score'] || 0));
        const totalDuration = sorted.reduce((sum, a) => sum + (a['duration'] || 0), 0);
        const lastAttempt = sorted[sorted.length - 1];
        result.set(ra, { totalAttempts: sorted.length, averageScore, lastAttempt, bestScore, totalDuration });
      });
      return result;
    } catch (error) {
      console.error('Erro ao obter estatísticas batch:', error);
      return new Map();
    }
  }

  /**
   * Obter estatísticas de um aluno
   */
  async getStudentStats(schoolId: string, ra: string): Promise<any> {
    try {
      const attemptsRef = collection(this.firestore, 'quiz_attempts');
      const q = query(
        attemptsRef,
        where('schoolId', '==', schoolId),
        where('ra', '==', ra)
      );
      const snapshot = await getDocs(q);

      const attempts = snapshot.docs.map(doc => doc.data() as any);

      if (attempts.length === 0) {
        return {
          totalAttempts: 0,
          averageScore: 0,
          lastAttempt: null,
          bestScore: 0,
          totalDuration: 0
        };
      }

      const totalScore = attempts.reduce((sum, att) => sum + att['score'], 0);
      const averageScore = (totalScore / attempts.length).toFixed(1);
      const bestScore = Math.max(...attempts.map(att => att['score']));
      const totalDuration = attempts.reduce((sum, att) => sum + att['duration'], 0);
      const lastAttempt = attempts[attempts.length - 1];

      return {
        totalAttempts: attempts.length,
        averageScore,
        lastAttempt,
        bestScore,
        totalDuration,
        attempts
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}
