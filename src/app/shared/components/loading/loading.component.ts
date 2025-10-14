import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css']
})
export class LoadingComponent {
  @Input() message: string = '';
  @Input() overlay: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  get spinnerClass(): string {
    return `spinner ${this.size}`;
  }
}
