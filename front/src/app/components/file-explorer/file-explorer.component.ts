import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss']
})
export class FileExplorerComponent implements OnInit {
  currentPath = '';
  sidenavOpened = true;

  constructor() { }

  ngOnInit(): void {
    // Inicializa com o rootPath configurado no environment
    this.currentPath = environment.ftpConfig.rootPath || '/dominios/cdn.gzapi.com.br';
  }

  onPathSelected(path: string): void {
    this.currentPath = path;
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }
}