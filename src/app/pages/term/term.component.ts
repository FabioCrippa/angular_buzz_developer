import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-term',
  templateUrl: './term.component.html',
  styleUrls: ['./term.component.css']
})
export class TermComponent {

  constructor(private router: Router) {}

  closeTerm(): void {
    this.router.navigate(['/home']);
  }
}
