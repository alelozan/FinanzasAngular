import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toastsSignal()"
        class="toast"
        [ngClass]="'toast-' + toast.type"
        (click)="toastService.dismiss(toast.id)"
      >
        <span class="toast-icon">
          <ng-container [ngSwitch]="toast.type">
            <span *ngSwitchCase="'success'">&#10003;</span>
            <span *ngSwitchCase="'error'">&#10007;</span>
            <span *ngSwitchCase="'warning'">&#9888;</span>
            <span *ngSwitchDefault>&#8505;</span>
          </ng-container>
        </span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 380px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1.2rem;
      border-radius: 10px;
      color: #fff;
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .toast-success { background: #10b981; }
    .toast-error { background: #ef4444; }
    .toast-warning { background: #f59e0b; }
    .toast-info { background: #0ea5e9; }
    .toast-icon { font-size: 1.1rem; font-weight: 700; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
