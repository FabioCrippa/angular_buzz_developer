import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SchoolDashboardComponent } from './school-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: SchoolDashboardComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SchoolDashboardRoutingModule {}
