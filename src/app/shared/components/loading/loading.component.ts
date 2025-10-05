import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" [class.overlay]="overlay">
      <div class="loading-content">
        <div class="spinner" [ngClass]="spinnerClass"></div>
        <p class="loading-text" *ngIf="message">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .loading-container.overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
      backdrop-filter: blur(4px);
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner.small {
      width: 24px;
      height: 24px;
      border-width: 3px;
    }

    .spinner.medium {
      width: 40px;
      height: 40px;
      border-width: 4px;
    }

    .spinner.large {
      width: 60px;
      height: 60px;
      border-width: 6px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      margin-top: 1rem;
      color: #666;
      font-size: 14px;
      text-align: center;
    }

    .overlay .loading-content {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class LoadingComponent {
  @Input() message: string = '';
  @Input() overlay: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  get spinnerClass(): string {
    return `spinner ${this.size}`;
  }
}
