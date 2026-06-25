import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section style="padding: 2rem; text-align: center">
      <h1>403</h1>
      <p>No tienes permiso para acceder a esta página.</p>
      <a routerLink="/">Volver al inicio</a>
    </section>
  `,
})
export class ForbiddenComponent {}
