import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-demo-banner',
  template: `
    <div class="demo-banner" *ngIf="showBanner">
      <mat-icon>info</mat-icon>
      <div class="banner-content">
        <strong>Dados Realistas - Servidor {{ ftpConfig.host }}</strong>
        <span>Simulando estrutura baseada na configuração FTP real: {{ ftpConfig.rootPath }}</span>
      </div>
      <button mat-icon-button (click)="closeBanner()" class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styleUrls: ['./demo-banner.component.scss']
})
export class DemoBannerComponent {
  showBanner = true;
  ftpConfig = environment.ftpConfig;

  closeBanner(): void {
    this.showBanner = false;
  }
}