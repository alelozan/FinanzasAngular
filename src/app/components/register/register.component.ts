import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // 1. Importar esto
import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router'; // 1. Importar

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink], // 2. Añadir aquí
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

async onRegister() {
  try {
    await this.authService.signUp(this.email, this.password);
    alert('Registro completado. Por favor, inicia sesión.');
    this.router.navigate(['/login']); // Redirigir al login tras el éxito
  } catch (error: any) {
    alert('Error: ' + error.message);
  }
}


  
}