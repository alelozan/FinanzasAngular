import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  async onLogin() {
    this.loading = true;
    try {
      await this.authService.signIn(this.email, this.password);
      // Una vez logueado, vamos al dashboard
      alert('Inicio de sesión exitoso');
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      alert('Error de inicio de sesión: ' + error.message);
    } finally {
      this.loading = false;
    }
  }
}