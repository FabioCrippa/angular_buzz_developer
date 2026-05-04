import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './guards/admin.guard';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminDashboardComponent } from './pages/dashboard/dashboard.component';
import { UploadStudentsComponent } from './pages/upload-students/upload-students.component';

const routes: Routes = [
  // ✅ ROTAS PROTEGIDAS COM AUTH
  {
    path: 'admin',
    canActivate: [AdminAuthGuard],
    children: [
      {
        path: 'dashboard',
        component: AdminDashboardComponent
      },
      {
        path: 'upload-students',
        component: UploadStudentsComponent
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
