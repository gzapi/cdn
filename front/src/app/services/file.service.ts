import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FtpService, FtpDirectoryResponse, FtpTreeNode } from './ftp.service';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number | null;
  sizeFormatted: string;
  modified: Date;
  icon: string;
  mimeType: string | null;
}

export interface DirectoryResponse {
  currentPath: string;
  parentPath: string;
  items: FileItem[];
}

export interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
}

export interface TreeResponse {
  root: TreeNode;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  sizeFormatted: string;
  modified: Date;
  created: Date;
  isDirectory: boolean;
  mimeType: string | null;
  extension: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  constructor(private ftpService: FtpService) { }

  getFiles(path?: string): Observable<DirectoryResponse> {
    return this.ftpService.getFiles(path || '/');
  }

  getDirectoryTree(path?: string): Observable<TreeResponse> {
    return this.ftpService.getDirectoryTree(path || '/');
  }

  getFileInfo(path: string): Observable<FileInfo> {
    return this.ftpService.getFileInfo(path);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadFile(path: string): string {
    return this.ftpService.downloadFile(path);
  }

  getViewUrl(path: string): string {
    return this.ftpService.getViewUrl(path);
  }

  copyLinkToClipboard(path: string): void {
    const url = this.getViewUrl(path);
    navigator.clipboard.writeText(url).then(() => {
      console.log('Link copiado para a área de transferência');
    });
  }

  canPreview(mimeType: string | null): boolean {
    if (!mimeType || !environment.features.enablePreview) return false;
    
    // Tipos de arquivo que podem ser visualizados no browser
    const previewableTypes = [
      // Imagens
      'image/',
      // Vídeos  
      'video/',
      // Áudios
      'audio/',
      // Documentos
      'application/pdf',
      // Texto
      'text/',
      'text/plain',
      'text/markdown',
      'text/html',
      'text/css',
      'text/javascript',
      // Código
      'application/json',
      'application/xml'
    ];
    
    return previewableTypes.some(type => mimeType.startsWith(type) || mimeType === type);
  }

  isFeatureEnabled(feature: keyof typeof environment.features): boolean {
    return environment.features[feature] as boolean;
  }

  getMaxFileSize(): number {
    return environment.features.maxFileSize;
  }

  getAllowedExtensions(): string[] {
    return environment.features.allowedExtensions;
  }

  refreshData(): void {
    this.ftpService.refreshData();
  }
}