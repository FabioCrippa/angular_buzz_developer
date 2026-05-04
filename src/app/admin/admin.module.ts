import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './pages/dashboard/dashboard.component';
import { UploadStudentsComponent } from './pages/upload-students/upload-students.component';

@NgModule({
  declarations: [
    AdminDashboardComponent,
    UploadStudentsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
