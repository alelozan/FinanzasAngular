import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

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
    private router: Router,
    private toast: ToastService
  ) {}

  async onLogin() {
    this.loading = true;
    try {
      await this.authService.signIn(this.email, this.password);
      this.toast.success('Inicio de sesión exitoso');
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.toast.error('Error de inicio de sesión: ' + (error.message || 'Credenciales incorrectas'));
    } finally {
      this.loading = false;
    }
  }
}