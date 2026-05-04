import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { SchoolService } from '../../services/school.service';
import * as XLSX from 'xlsx';

interface School {
  id: string;
  name: string;
  city: string;
  state?: string;
  totalStudents: number;
  activeStudents: number;
  sharedPassword: string;
  createdAt: any;
  // Assinatura
  subscriptionType?: 'sold' | 'donated'; // Vendido ou Doado
  subscriptionStatus?: 'active' | 'expired' | 'cancelled'; // Status da assinatura
  expiresAt?: any; // Data de expiração
  lastPaymentDate?: any; // Último pagamento
  cancelledAt?: any; // Data do cancelamento
}

interface StudentStats {
  ra: string;
  name: string;
  class: string;
  email: string;
  totalAttempts: number;
  averageScore: number;
  lastAttempt: any;
  status: string;
}

interface NewSchoolForm {
  name: string;
  city: string;
  state: string;
  directorName: string;
  email: string;
  phone: string;
  subscriptionType?: 'sold' | 'donated'; // 💰 Tipo de assinatura
}

interface ExcelSheet {
  sheetName: string;
  students: any[];
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  schools: School[] = [];
  filteredSchools: School[] = [];
  selectedSchool: School | null = null;
  students: StudentStats[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  showPasswordModal = false;

  // Filtros e busca
  searchQuery = '';
  filterStatus: 'all' | 'active' | 'expired' | 'cancelled' = 'all';
  filterType: 'all' | 'sold' | 'donated' = 'all';

  // Estatísticas calculadas
  averageScore = '-';
  participationRate = '-';

  // Criar nova escola
  showCreateSchoolModal = false;
  newSchoolForm: NewSchoolForm = { name: '', city: '', state: '', directorName: '', email: '', phone: '' };
  isCreatingSchool = false;
  createdSchoolData: any = null;

  // Upload CSV/Excel de alunos
  showUploadModal = false;
  isUploadingCsv = false;
  csvFile: File | null = null;
  parsedStudents: any[] = [];
  excelSheets: ExcelSheet[] = [];
  uploadProgress = 0;
  uploadClassName = '';
  isExcelMode = false;
  selectedSheetsToUpload: Set<number> = new Set();

  // 🔐 Alterar Senha
  showChangePasswordModal = false;
  changePasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  isChangingPassword = false;

  constructor(
    private schoolService: SchoolService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    await this.loadSchools();
    this.isLoading = false;

    const action = this.route.snapshot.queryParamMap.get('action');
    if (action === 'changePassword') {
      this.openChangePasswordModal();
    }
  }

  async loadSchools() {
    try {
      const data = await this.schoolService.getAdminSchools();
      this.schools = data.map((s: any) => ({
        id: s.schoolId || s.id,
        name: s.name,
        city: s.city,
        state: s.state,
        totalStudents: s.totalStudents || 0,
        activeStudents: s.activeStudents || 0,
        sharedPassword: s.sharedPassword,
        createdAt: s.createdAt,
        // Assinatura
        subscriptionType: s.subscriptionType || 'donated',
        subscriptionStatus: s.subscriptionStatus || 'active',
        expiresAt: s.expiresAt,
        lastPaymentDate: s.lastPaymentDate,
        cancelledAt: s.cancelledAt
      }));
      await this.checkAndUpdateExpiredSubscriptions();
      this.applyFilters();
    } catch (error: any) {
      this.errorMessage = 'Erro ao carregar escolas';
      console.error(error);
    }
  }

  async checkAndUpdateExpiredSubscriptions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const school of this.schools) {
      // Pular se já cancelada
      if (school.subscriptionStatus === 'cancelled') continue;

      // Verificar se expirou
      if (school.subscriptionStatus === 'active' && school.expiresAt) {
        const expiryDate = school.expiresAt instanceof Date ? school.expiresAt : new Date(school.expiresAt);
        expiryDate.setHours(0, 0, 0, 0);

        if (expiryDate < today) {
          // Atualizar status para 'expired'
          school.subscriptionStatus = 'expired';

          // Persistir no Firestore
          try {
            const response = await this.http.post<any>(
              'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/expireSubscription',
              { schoolId: school.id },
              {
                headers: { 'Content-Type': 'application/json' }
              }
            ).toPromise();

            if (response?.success) {
              console.log(`✅ Assinatura expirada atualizada: ${school.name}`);
            }
          } catch (error) {
            console.error(`Erro ao atualizar expiração: ${school.name}`, error);
          }
        }
      }
    }
  }

  applyFilters() {
    this.filteredSchools = this.schools.filter(school => {
      // Filtro de busca
      const searchLower = this.searchQuery.toLowerCase();
      const matchesSearch = !searchLower || 
        school.name.toLowerCase().includes(searchLower) ||
        school.city.toLowerCase().includes(searchLower);

      // Filtro de status
      const matchesStatus = this.filterStatus === 'all' || school.subscriptionStatus === this.filterStatus;

      // Filtro de tipo
      const matchesType = this.filterType === 'all' || school.subscriptionType === this.filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterStatusChange() {
    this.applyFilters();
  }

  onFilterTypeChange() {
    this.applyFilters();
  }

  // ✅ GERENCIAMENTO DE ASSINATURA
  async toggleSchoolStatus(school: School) {
    if (!school) return;
    
    const isCancelling = school.subscriptionStatus === 'active';
    const action = isCancelling ? 'cancelar' : 'ativar';
    
    if (!confirm(`Tem certeza que deseja ${action} a assinatura de "${school.name}"?`)) {
      return;
    }

    try {
      const endpoint = isCancelling
        ? 'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/cancelSubscription'
        : 'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/renewSubscription';

      const response = await this.http.post<any>(endpoint, 
        { schoolId: school.id },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      if (response?.success) {
        school.subscriptionStatus = isCancelling ? 'cancelled' : 'active';
        if (isCancelling && response.cancelledAt) {
          school.cancelledAt = new Date(response.cancelledAt);
        }
        if (!isCancelling && response.expiresAt) {
          school.expiresAt = new Date(response.expiresAt);
        }
        this.applyFilters();
        this.successMessage = `✅ Assinatura ${action}ada com sucesso!`;
        setTimeout(() => { this.successMessage = ''; }, 3000);
      }
    } catch (error: any) {
      this.errorMessage = `❌ Erro ao ${action} assinatura: ${error.message}`;
      console.error(error);
      setTimeout(() => { this.errorMessage = ''; }, 3000);
    }
  }

  async renewSubscription(school: School) {
    if (!school) return;

    if (!confirm(`Renovar assinatura de "${school.name}" por 30 dias?`)) {
      return;
    }

    try {
      const response = await this.http.post<any>(
        'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/renewSubscription',
        { schoolId: school.id },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      if (response?.success) {
        school.subscriptionStatus = 'active';
        school.expiresAt = new Date(response.expiresAt);
        school.lastPaymentDate = new Date();
        this.applyFilters();
        
        const expiryStr = new Date(response.expiresAt).toLocaleDateString('pt-BR');
        this.successMessage = `✅ Assinatura renovada até ${expiryStr}`;
        setTimeout(() => { this.successMessage = ''; }, 3000);
      }
    } catch (error: any) {
      this.errorMessage = `❌ Erro ao renovar assinatura: ${error.message}`;
      console.error(error);
      setTimeout(() => { this.errorMessage = ''; }, 3000);
    }
  }

  /**
   * ✅ DELETAR ESCOLA
   */
  async deleteSchool(school: School) {
    if (!school) return;

    if (!confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente deletar a escola "${school.name}"?\n\nIsso vai:\n✓ Remover a escola\n✓ Apagar todos os dados dos alunos\n✓ Cancelar a assinatura\n\nEsta ação é IRREVERSÍVEL!`)) {
      return;
    }

    try {
      const response = await this.http.post<any>(
        'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/deleteSchool',
        { schoolId: school.id },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      if (response?.success) {
        // Remover da lista
        const index = this.schools.findIndex(s => s.id === school.id);
        if (index > -1) {
          this.schools.splice(index, 1);
        }
        
        // Limpar escola selecionada
        if (this.selectedSchool?.id === school.id) {
          this.selectedSchool = null;
          this.students = [];
        }
        
        this.applyFilters();
        this.successMessage = `🗑️ Escola deletada com sucesso!`;
        setTimeout(() => { this.successMessage = ''; }, 3000);
      }
    } catch (error: any) {
      this.errorMessage = `❌ Erro ao deletar escola: ${error.message}`;
      console.error(error);
      setTimeout(() => { this.errorMessage = ''; }, 3000);
    }
  }

  getDaysUntilExpiry(expiryDate: any): number {
    if (!expiryDate) return 999;
    const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
    if (isNaN(expiry.getTime())) return 999; // Invalid date
    const today = new Date();
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  formatExpiryDate(date: any): string {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  }

  formatCancelledDate(date: any): string {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  }

  getSubscriptionStatusColor(status: string | undefined): string {
    switch (status) {
      case 'active': return '#27ae60'; // Verde
      case 'expired': return '#e67e22'; // Laranja
      case 'cancelled': return '#e74c3c'; // Vermelho
      default: return '#95a5a6'; // Cinza
    }
  }

  getSubscriptionStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'active': return '🟢 Ativa';
      case 'expired': return '⏰ Expirada';
      case 'cancelled': return '🔴 Cancelada';
      default: return '⚪ Desconhecido';
    }
  }

  selectSchool(school: School) {
    this.selectedSchool = school;
    this.loadStudents();
  }

  async loadStudents() {
    if (!this.selectedSchool) return;

    try {
      // Buscar lista de alunos da escola
      const schoolStudents = await this.schoolService.getSchoolStudents(this.selectedSchool.id);
      
      // Para cada aluno, buscar suas estatísticas
      this.students = [];
      
      for (const student of schoolStudents) {
        try {
          const stats = await this.schoolService.getStudentStats(this.selectedSchool.id, student.id);
          
          this.students.push({
            ra: student.id,
            name: student.name || '-',
            class: student.class || '-',
            email: student.email || '-',
            totalAttempts: stats.totalAttempts || 0,
            averageScore: Number(stats.averageScore) || 0,
            lastAttempt: stats.lastAttempt || null,
            status: student.status || 'active'
          });
        } catch (error) {
          console.error(`Erro ao buscar stats do aluno ${student.id}:`, error);
          // Adicionar aluno sem stats
          this.students.push({
            ra: student.id,
            name: student.name || '-',
            class: student.class || '-',
            email: student.email || '-',
            totalAttempts: 0,
            averageScore: 0,
            lastAttempt: null,
            status: student.status || 'active'
          });
        }
      }

      this.calculateStats();
    } catch (error: any) {
      this.errorMessage = 'Erro ao carregar alunos';
      console.error(error);
    }
  }

  calculateStats() {
    if (this.students.length === 0) {
      this.averageScore = '-';
      this.participationRate = '-';
      return;
    }

    const totalScore = this.students.reduce((sum, s) => sum + (s.averageScore || 0), 0);
    this.averageScore = (totalScore / this.students.length).toFixed(1);

    const activeStudents = this.students.filter(s => s.totalAttempts > 0).length;
    this.participationRate = ((activeStudents / this.students.length) * 100).toFixed(0) + '%';
  }

  showPassword() {
    this.showPasswordModal = true;
  }

  closePasswordModal() {
    this.showPasswordModal = false;
  }

  copyPassword() {
    if (this.selectedSchool?.sharedPassword) {
      navigator.clipboard.writeText(this.selectedSchool.sharedPassword).then(() => {
        this.successMessage = 'Senha copiada!';
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      });
    }
  }

  // 🔐 ALTERAR SENHA DO ADMIN
  openChangePasswordModal() {
    this.showChangePasswordModal = true;
    this.changePasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }

  closeChangePasswordModal() {
    this.showChangePasswordModal = false;
    this.changePasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }

  async changeAdminPassword() {
    // Validações
    if (!this.changePasswordForm.currentPassword) {
      this.errorMessage = '❌ Digite a senha atual!';
      setTimeout(() => { this.errorMessage = ''; }, 3000);
      return;
    }

    if (!this.changePasswordForm.newPassword) {
      this.errorMessage = '❌ Digite a nova senha!';
      setTimeout(() => { this.errorMessage = ''; }, 3000);
      return;
    }

    if (this.changePasswordForm.newPassword.length < 6) {
      this.errorMessage = '❌ Nova senha deve ter no mínimo 6 caracteres!';
      setTimeout(() => { this.errorMessage = ''; }, 3000);
      return;
    }

    if (this.changePasswordForm.newPassword !== this.changePasswordForm.confirmPassword) {
      this.errorMessage = '❌ As senhas não coincidem!';
      setTimeout(() => { this.errorMessage = ''; }, 3000);
      return;
    }

    if (this.changePasswordForm.currentPassword === this.changePasswordForm.newPassword) {
      this.errorMessage = '❌ A nova senha não pode ser igual à anterior!';
      setTimeout(() => { this.errorMessage = ''; }, 3000);
      return;
    }

    this.isChangingPassword = true;
    this.errorMessage = '';

    try {
      // Importar AdminAuthService aqui se necessário
      // Para isso, vamos fazer a chamada HTTP diretamente
      const response = await this.http.post<any>(
        'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/changeAdminPassword',
        {
          email: 'admin@sowlfy.com.br',
          currentPassword: this.changePasswordForm.currentPassword,
          newPassword: this.changePasswordForm.newPassword
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      if (response?.success) {
        this.successMessage = '✅ Senha alterada com sucesso!';
        setTimeout(() => {
          this.closeChangePasswordModal();
          this.successMessage = '';
        }, 2000);
      } else {
        this.errorMessage = response?.error || '❌ Erro ao alterar senha';
        setTimeout(() => { this.errorMessage = ''; }, 3000);
      }
    } catch (error: any) {
      this.errorMessage = `❌ Erro ao alterar senha: ${error.message}`;
      console.error('Erro:', error);
      setTimeout(() => { this.errorMessage = ''; }, 3000);
    } finally {
      this.isChangingPassword = false;
    }
  }

  formatDateTime(date: any): string {
    if (!date) return '-';
    
    try {
      let d: Date;
      
      // Se é um objeto Firestore Timestamp
      if (date && typeof date === 'object' && 'toDate' in date) {
        d = date.toDate();
      }
      // Se é um número (timestamp em milisegundos)
      else if (typeof date === 'number') {
        d = new Date(date);
      }
      // Se é uma string
      else if (typeof date === 'string') {
        d = new Date(date);
      }
      // Se já é uma Date
      else if (date instanceof Date) {
        d = date;
      }
      else {
        return '-';
      }
      
      // Validar se data é válida
      if (isNaN(d.getTime())) {
        return '-';
      }
      
      return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  }

  // ✅ CRIAR NOVA ESCOLA
  openCreateSchoolModal() {
    this.showCreateSchoolModal = true;
    this.newSchoolForm = { 
      name: '', 
      city: '', 
      state: '', 
      directorName: '', 
      email: '', 
      phone: '',
      subscriptionType: 'donated' // 💰 Padrão: doação
    };
    this.createdSchoolData = null;
  }

  closeCreateSchoolModal() {
    this.showCreateSchoolModal = false;
    this.newSchoolForm = { name: '', city: '', state: '', directorName: '', email: '', phone: '', subscriptionType: 'donated' };
    this.createdSchoolData = null;
  }

  async createNewSchool() {
    // Validar campos obrigatórios
    if (!this.newSchoolForm.name || !this.newSchoolForm.city) {
      this.errorMessage = 'Nome e Cidade são obrigatórios!';
      setTimeout(() => { this.errorMessage = ''; }, 3000);
      return;
    }

    this.isCreatingSchool = true;
    this.errorMessage = '';

    try {
      const url = 'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/createSchool';
      const payload = {
        name: this.newSchoolForm.name,
        city: this.newSchoolForm.city,
        state: this.newSchoolForm.state || '',
        directorName: this.newSchoolForm.directorName || '',
        email: this.newSchoolForm.email || '',
        phone: this.newSchoolForm.phone || '',
        subscriptionType: this.newSchoolForm.subscriptionType || 'donated' // 💰 Tipo de assinatura
      };

      const headers = {
        'x-admin-uid': 'admin-' + Date.now()
      };

      const response = await this.http.post<any>(url, payload, { headers }).toPromise();

      if (response) {
        this.createdSchoolData = response;
        this.successMessage = 'Escola criada com sucesso!';
        
        // Recarregar lista de escolas após 2 segundos
        setTimeout(async () => {
          await this.loadSchools();
          this.closeCreateSchoolModal();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao criar escola:', error);
      this.errorMessage = 'Erro ao criar escola. Tente novamente.';
    } finally {
      this.isCreatingSchool = false;
    }
  }

  copyNewSchoolPassword() {
    if (this.createdSchoolData?.sharedPassword) {
      navigator.clipboard.writeText(this.createdSchoolData.sharedPassword).then(() => {
        this.successMessage = 'Senha copiada!';
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      });
    }
  }

  // ✅ UPLOAD CSV/EXCEL DE ALUNOS
  openUploadModal() {
    if (!this.selectedSchool) {
      this.errorMessage = 'Selecione uma escola primeiro!';
      setTimeout(() => { this.errorMessage = ''; }, 3000);
      return;
    }
    this.showUploadModal = true;
    this.csvFile = null;
    this.parsedStudents = [];
    this.excelSheets = [];
    this.uploadClassName = '';
    this.isExcelMode = false;
    this.selectedSheetsToUpload.clear();
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.csvFile = null;
    this.parsedStudents = [];
    this.excelSheets = [];
    this.uploadProgress = 0;
    this.uploadClassName = '';
    this.isExcelMode = false;
    this.selectedSheetsToUpload.clear();
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const isCsv = file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCsv && !isExcel) {
      this.errorMessage = 'Por favor, selecione um arquivo CSV ou XLSX válido!';
      setTimeout(() => { this.errorMessage = ''; }, 3000);
      return;
    }

    this.csvFile = file;
    
    if (isExcel) {
      this.isExcelMode = true;
      this.parseExcel(file);
    } else {
      this.isExcelMode = false;
      this.parseCsv(file);
    }
  }

  parseCsv(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        this.parsedStudents = [];

        // Pular header (linha 0)
        // Formato esperado: nome, ra, email
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const parts = lines[i].split(',').map((v: string) => v.trim());
          
          // Suportar ambos os formatos:
          // Formato 1: nome, ra, email (novo)
          // Formato 2: ra, nome, classe, email (legado)
          let name, ra, email;
          
          if (parts.length >= 3) {
            // Tenta formato 1: nome, ra, email
            if (parts[0] && parts[1] && !isNaN(Number(parts[1]))) {
              name = parts[0];
              ra = parts[1];
              email = parts[2] || '';
            } else {
              // Tenta formato 2: ra, nome, classe, email
              ra = parts[0];
              name = parts[1];
              email = parts[3] || '';
            }
            
            if (name && ra) {
              this.parsedStudents.push({
                ra,
                name,
                email: email || '',
                status: 'active'
              });
            }
          }
        }

        if (this.parsedStudents.length === 0) {
          this.errorMessage = 'Nenhum aluno válido encontrado no CSV!';
          setTimeout(() => { this.errorMessage = ''; }, 3000);
          return;
        }

        this.successMessage = `📊 ${this.parsedStudents.length} alunos encontrados no CSV`;
        setTimeout(() => { this.successMessage = ''; }, 2000);
      } catch (error) {
        this.errorMessage = 'Erro ao processar CSV. Verifique o formato.';
        setTimeout(() => { this.errorMessage = ''; }, 3000);
        console.error(error);
      }
    };
    reader.readAsText(file);
  }

  parseExcel(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const arrayBuffer = e.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        this.excelSheets = [];
        let totalStudents = 0;

        // Iterar sobre todas as abas
        workbook.SheetNames.forEach((sheetName: string) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const students = this.parseStudentsFromSheet(jsonData);
          
          if (students.length > 0) {
            this.excelSheets.push({
              sheetName: sheetName,
              students: students
            });
            totalStudents += students.length;
          }
        });

        if (this.excelSheets.length === 0) {
          this.errorMessage = 'Nenhum aluno válido encontrado no arquivo Excel!';
          setTimeout(() => { this.errorMessage = ''; }, 3000);
          return;
        }

        this.successMessage = `📊 ${this.excelSheets.length} turmas e ${totalStudents} alunos encontrados!`;
        setTimeout(() => { this.successMessage = ''; }, 2000);
      } catch (error) {
        this.errorMessage = 'Erro ao processar Excel. Verifique o formato.';
        setTimeout(() => { this.errorMessage = ''; }, 3000);
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  parseStudentsFromSheet(data: any[]): any[] {
    const students: any[] = [];
    
    data.forEach((row: any) => {
      // Detectar automaticamente quais colunas contêm os dados
      // Esperados: Nome, RA, Email (pode estar em qualquer ordem)
      const keys = Object.keys(row);
      let name = '';
      let ra = '';
      let email = '';

      // Procurar pelas colunas
      keys.forEach((key: string) => {
        const value = String(row[key] || '').trim();
        const keyLower = key.toLowerCase();

        if ((keyLower.includes('nome') || keyLower.includes('name')) && !name) {
          name = value;
        } else if ((keyLower.includes('ra') || keyLower.includes('id') || keyLower.includes('matricula')) && !ra) {
          ra = value;
        } else if ((keyLower.includes('email') || keyLower.includes('mail')) && !email) {
          email = value;
        }
      });

      // Se não encontrou pelos headers, tenta por posição
      if (!name || !ra) {
        const values = keys.map(k => String(row[k] || '').trim());
        if (!name) name = values[0] || '';
        if (!ra) ra = values[1] || '';
        if (!email) email = values[2] || '';
      }

      if (name && ra) {
        students.push({
          ra,
          name,
          email: email || '',
          status: 'active'
        });
      }
    });

    return students;
  }

  toggleSheetSelection(index: number) {
    if (this.selectedSheetsToUpload.has(index)) {
      this.selectedSheetsToUpload.delete(index);
    } else {
      this.selectedSheetsToUpload.add(index);
    }
  }

  selectAllSheets() {
    for (let i = 0; i < this.excelSheets.length; i++) {
      this.selectedSheetsToUpload.add(i);
    }
  }

  deselectAllSheets() {
    this.selectedSheetsToUpload.clear();
  }

  getTotalStudentsInSelectedSheets(): number {
    let total = 0;
    for (const sheetIndex of Array.from(this.selectedSheetsToUpload)) {
      const sheet = this.excelSheets[sheetIndex];
      if (sheet) {
        total += sheet.students.length;
      }
    }
    return total;
  }

  getFirstSelectedSheetIndex(): number {
    const arr = Array.from(this.selectedSheetsToUpload);
    return arr.length > 0 ? arr[0] : 0;
  }

  async uploadStudents() {
    if (!this.selectedSchool) {
      this.errorMessage = 'Selecione uma escola primeiro!';
      return;
    }

    if (this.isExcelMode) {
      await this.uploadExcelSheets();
    } else {
      await this.uploadCsvStudents();
    }
  }

  async uploadCsvStudents() {
    if (!this.selectedSchool || this.parsedStudents.length === 0) {
      this.errorMessage = 'Selecione um arquivo CSV com alunos!';
      return;
    }

    if (!this.uploadClassName.trim()) {
      this.errorMessage = 'Digite a turma/classe dos alunos!';
      return;
    }

    this.isUploadingCsv = true;
    this.errorMessage = '';

    try {
      const url = 'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/uploadStudentsCsv';
      
      // Converter students para formato esperado (com a classe especificada)
      const csvContent = 'RA,Nome,Classe,Email\n' + 
        this.parsedStudents.map(s => `${s.ra},${s.name},${this.uploadClassName},${s.email}`).join('\n');

      const payload = {
        schoolId: this.selectedSchool.id,
        csvContent: csvContent
      };

      const response = await this.http.post<any>(url, payload).toPromise();

      if (response) {
        this.successMessage = `✅ ${this.parsedStudents.length} alunos da turma ${this.uploadClassName} importados com sucesso!`;
        
        // Recarregar estudantes após 2 segundos
        setTimeout(async () => {
          await this.loadSchools();
          this.closeUploadModal();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload de alunos:', error);
      this.errorMessage = error.error?.error || 'Erro ao importar alunos. Tente novamente.';
    } finally {
      this.isUploadingCsv = false;
    }
  }

  async uploadExcelSheets() {
    if (this.selectedSheetsToUpload.size === 0) {
      this.errorMessage = 'Selecione pelo menos uma turma para importar!';
      return;
    }

    this.isUploadingCsv = true;
    this.errorMessage = '';
    let totalUploaded = 0;
    let successfulSheets = 0;

    try {
      const url = 'https://southamerica-east1-angular-buzz-developer.cloudfunctions.net/uploadStudentsCsv';

      // Fazer upload de cada sheet selecionada
      for (const sheetIndex of Array.from(this.selectedSheetsToUpload)) {
        const sheet = this.excelSheets[sheetIndex];
        if (!sheet) continue;

        const csvContent = 'RA,Nome,Classe,Email\n' + 
          sheet.students.map(s => `${s.ra},${s.name},${sheet.sheetName},${s.email}`).join('\n');

        const payload = {
          schoolId: this.selectedSchool!.id,
          csvContent: csvContent
        };

        try {
          const response = await this.http.post<any>(url, payload).toPromise();
          if (response) {
            totalUploaded += sheet.students.length;
            successfulSheets++;
          }
        } catch (error: any) {
          console.error(`Erro ao fazer upload da turma ${sheet.sheetName}:`, error);
          this.errorMessage = `Erro ao importar turma "${sheet.sheetName}". Tente novamente.`;
        }

        // Pequeno delay entre uploads para evitar throttling
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (successfulSheets > 0) {
        this.successMessage = `✅ ${totalUploaded} alunos de ${successfulSheets} turmas importados com sucesso!`;
        
        // Recarregar estudantes após 2 segundos
        setTimeout(async () => {
          await this.loadSchools();
          this.closeUploadModal();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro geral ao fazer upload:', error);
      this.errorMessage = error.error?.error || 'Erro ao importar alunos. Tente novamente.';
    } finally {
      this.isUploadingCsv = false;
    }
  }

}
