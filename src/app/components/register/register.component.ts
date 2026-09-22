import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email = '';
  password = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  async onRegister() {
    this.loading = true;
    try {
      const data = await this.authService.signUp(this.email, this.password);
      if (data?.session) {
        this.toast.success('Registro completado');
        this.router.navigate(['/dashboard']);
      } else {
        this.toast.success('Registro completado. Revisa tu email para confirmar tu cuenta.');
        this.router.navigate(['/login']);
      }
    } catch (error: any) {
      this.toast.error('Error: ' + (error.message || 'No se pudo completar el registro'));
    } finally {
      this.loading = false;
    }
  }
}