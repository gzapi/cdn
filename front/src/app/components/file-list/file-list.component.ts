import { Component, Input, OnInit } from '@angular/core';
import { FileService, FileItem, DirectoryResponse } from '../../services/file.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss']
})
export class FileListComponent implements OnInit {
  @Input() currentPath = '';
  
  files: FileItem[] = [];
  directories: FileItem[] = [];
  loading = true;
  parentPath = '';
  selectedFile: FileItem | null = null;
  showPreview = false;

  constructor(
    private fileService: FileService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadFiles();
  }

  ngOnChanges(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.loading = true;
    this.fileService.getFiles(this.currentPath).subscribe({
      next: (response: DirectoryResponse) => {
        this.files = response.items.filter(item => !item.isDirectory);
        this.directories = response.items.filter(item => item.isDirectory);
        this.parentPath = response.parentPath;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar arquivos:', error);
        this.snackBar.open('Erro ao carregar arquivos', 'Fechar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onFileClick(file: FileItem): void {
    if (file.isDirectory) {
      this.currentPath = file.path;
      this.loadFiles();
    } else {
      // Para arquivos, decidir entre visualizar ou fazer download
      if (this.canPreview(file)) {
        // Arquivos visualizáveis: abrir no browser
        this.viewFile(file);
      } else {
        // Outros arquivos: fazer download
        this.downloadFile(file);
      }
    }
  }

  downloadFile(file: FileItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const downloadUrl = this.fileService.downloadFile(file.path);
    
    // Cria elemento temporário para download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Mostra notificação de download
    this.snackBar.open(`Download iniciado: ${file.name}`, 'Fechar', { duration: 3000 });
  }

  viewFile(file: FileItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const viewUrl = this.fileService.getViewUrl(file.path);
    window.open(viewUrl, '_blank');
    
    // Mostra notificação de visualização
    this.snackBar.open(`Abrindo: ${file.name}`, 'Fechar', { duration: 2000 });
  }

  copyLink(file: FileItem, event: Event): void {
    event.stopPropagation();
    const viewUrl = this.fileService.getViewUrl(file.path);
    navigator.clipboard.writeText(viewUrl).then(() => {
      this.snackBar.open('Link copiado para a área de transferência', 'Fechar', { duration: 2000 });
    });
  }

  canPreview(file: FileItem): boolean {
    return this.fileService.canPreview(file.mimeType);
  }

  getPathSegments(): string[] {
    if (!this.currentPath) return [];
    
    // Remove o rootPath do início para mostrar apenas o caminho relativo
    const rootPath = environment.ftpConfig.rootPath || '/dominios/cdn.gzapi.com.br';
    let displayPath = this.currentPath;
    
    if (displayPath.startsWith(rootPath)) {
      displayPath = displayPath.replace(rootPath, '');
    }
    
    // Remove barras iniciais e divide em segmentos
    displayPath = displayPath.replace(/^\/+/, '');
    return displayPath ? displayPath.split(/[/\\]/).filter(segment => segment.length > 0) : [];
  }

  navigateToSegment(index: number): void {
    const rootPath = environment.ftpConfig.rootPath || '/dominios/cdn.gzapi.com.br';
    
    if (index === -1) {
      // Navegar para raiz
      this.currentPath = rootPath;
    } else {
      const segments = this.getPathSegments();
      const relativePath = segments.slice(0, index + 1).join('/');
      this.currentPath = rootPath + (relativePath ? '/' + relativePath : '');
    }
    this.loadFiles();
  }

  goToParent(): void {
    const segments = this.getPathSegments();
    const rootPath = environment.ftpConfig.rootPath || '/dominios/cdn.gzapi.com.br';
    
    if (segments.length > 0) {
      // Remove o último segmento
      const parentSegments = segments.slice(0, -1);
      const relativePath = parentSegments.join('/');
      this.currentPath = rootPath + (relativePath ? '/' + relativePath : '');
      this.loadFiles();
    }
  }

  isFeatureEnabled(feature: string): boolean {
    return this.fileService.isFeatureEnabled(feature as any);
  }

  onPreviewChange(showPreview: boolean): void {
    this.showPreview = showPreview;
    if (!showPreview) {
      this.selectedFile = null;
    }
  }

  refreshFiles(): void {
    this.fileService.refreshData();
    this.loadFiles();
  }

}