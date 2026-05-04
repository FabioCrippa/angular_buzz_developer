import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchoolDashboardRoutingModule } from './school-dashboard-routing.module';
import { SchoolDashboardComponent } from './school-dashboard.component';

@NgModule({
  declarations: [SchoolDashboardComponent],
  imports: [CommonModule, SchoolDashboardRoutingModule],
})
export class SchoolDashboardModule {}
