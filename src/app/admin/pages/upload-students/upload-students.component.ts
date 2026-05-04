import { Component, OnInit } from '@angular/core';
import { SchoolService } from '../../services/school.service';

@Component({
  selector: 'app-upload-students',
  templateUrl: './upload-students.component.html',
  styleUrls: ['./upload-students.component.css']
})
export class UploadStudentsComponent implements OnInit {
  csvFile: File | null = null;
  selectedSchoolId = '';
  schools: any[] = [];
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  uploadedStudents: any[] = [];
  showSuccessModal = false;

  constructor(
    private schoolService: SchoolService
  ) {}

  ngOnInit() {
    this.loadSchools();
  }

  async loadSchools() {
    try {
      this.schools = await this.schoolService.getAdminSchools();
      if (this.schools.length > 0) {
        this.selectedSchoolId = this.schools[0].id;
      }
    } catch (error) {
      this.errorMessage = 'Erro ao carregar escolas';
      console.error(error);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        this.errorMessage = 'Apenas arquivos CSV são permitidos';
        return;
      }
      this.csvFile = file;
      this.errorMessage = '';
    }
  }

  async uploadCSV() {
    if (!this.csvFile) {
      this.errorMessage = 'Selecione um arquivo CSV';
      return;
    }

    if (!this.selectedSchoolId) {
      this.errorMessage = 'Selecione uma escola';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Ler arquivo
      const csvContent = await this.csvFile.text();

      // Fazer upload
      const result = await this.schoolService.uploadStudents(
        this.selectedSchoolId,
        csvContent
      );

      this.uploadedStudents = result.students;
      this.successMessage = `✅ ${result.processedCount} alunos cadastrados com sucesso!`;
      this.showSuccessModal = true;
      this.csvFile = null;

      // Limpar input file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Recarregar escolas
      await this.loadSchools();
    } catch (error: any) {
      this.errorMessage = 'Erro ao fazer upload: ' + error.message;
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  closeModal() {
    this.showSuccessModal = false;
  }

  downloadTemplate() {
    const csv = `RA,Nome,Email,Classe
001234,João Silva,joao.silva@school.com,8º A
001235,Maria Santos,maria.santos@school.com,8º A
001236,Pedro Costa,pedro.costa@school.com,8º B`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'template-alunos.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  downloadStudentList() {
    let csv = 'RA,Nome,Classe,Email\n';
    this.uploadedStudents.forEach(student => {
      csv += `${student.ra},${student.name},${student.classe},${student.email}\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'alunos-cadastrados.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
