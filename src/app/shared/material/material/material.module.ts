import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialComponent } from './material.component';

// Material Components
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatGridListModule } from '@angular/material/grid-list';

const MaterialComponents = [
  MatCardModule,
  MatButtonModule,
  MatIconModule,
  MatChipsModule,
  MatProgressBarModule,
  MatBadgeModule,
  MatRippleModule,
  MatDividerModule,
  MatProgressSpinnerModule,
  MatSnackBarModule,
  MatTooltipModule,
  MatGridListModule
];

@NgModule({
  imports: [
    CommonModule,
    ...MaterialComponents
  ],
  declarations: [MaterialComponent],
  exports: MaterialComponents
})
export class MaterialModule { }
