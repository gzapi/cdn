import { Component, OnInit } from '@angular/core';
import { FtpService } from '../../services/ftp.service';

@Component({
  selector: 'app-connection-status',
  template: `
    <div class="connection-status" [ngClass]="statusClass">
      <mat-icon>{{ statusIcon }}</mat-icon>
      <span>{{ statusMessage }}</span>
      <button mat-icon-button (click)="testConnection()" *ngIf="!isConnected">
        <mat-icon>refresh</mat-icon>
      </button>
    </div>
  `,
  styleUrls: ['./connection-status.component.scss']
})
export class ConnectionStatusComponent implements OnInit {
  isConnected = false;
  isLoading = false;
  statusMessage = 'Verificando conexão...';
  statusIcon = 'wifi_off';
  statusClass = 'disconnected';

  constructor(private ftpService: FtpService) { }

  ngOnInit(): void {
    this.testConnection();
  }

  testConnection(): void {
    this.isLoading = true;
    this.statusMessage = 'Verificando conexão...';
    this.statusIcon = 'wifi_off';
    this.statusClass = 'connecting';

    this.ftpService.testConnection().subscribe({
      next: (response: any) => {
        this.isConnected = response.connected;
        this.isLoading = false;
        if (response.connected) {
          this.statusMessage = 'CDN Explorer - Conectado';
          this.statusIcon = 'storage';
          this.statusClass = 'connected';
        } else {
          this.statusMessage = 'Falha na conexão';
          this.statusIcon = 'wifi_off';
          this.statusClass = 'disconnected';
        }
      },
      error: (error) => {
        this.isConnected = false;
        this.isLoading = false;
        this.statusMessage = 'Erro de conexão';
        this.statusIcon = 'error';
        this.statusClass = 'disconnected';
        console.error('Erro ao testar conexão:', error);
      }
    });
  }
}