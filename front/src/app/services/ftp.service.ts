import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface FtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure?: boolean;
  rootPath?: string;
}

export interface FtpFileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number | null;
  sizeFormatted: string;
  modified: Date;
  icon: string;
  mimeType: string | null;
}

export interface FtpDirectoryResponse {
  currentPath: string;
  parentPath: string;
  items: FtpFileItem[];
}

export interface FtpTreeNode {
  name: string;
  path: string;
  children: FtpTreeNode[];
}

@Injectable({
  providedIn: 'root'
})
export class FtpService {
  private apiUrl = environment.apiUrl;
  private ftpConfig: FtpConfig;

  constructor(private http: HttpClient) {
    this.ftpConfig = environment.ftpConfig;
  }

  // Método para forçar refresh dos dados
  refreshData(): void {
    // Não há cache no lado frontend - dados sempre vêm frescos do backend
  }

  getFiles(path: string = '/'): Observable<FtpDirectoryResponse> {
    const rootPath = this.ftpConfig.rootPath || '/dominios/cdn.gzapi.com.br';
    const fullPath = path.startsWith(rootPath) 
      ? path 
      : rootPath + (path === '/' ? '' : path);
    
    return this.http.get<FtpDirectoryResponse>(`${this.apiUrl}/files`, {
      params: { path: fullPath }
    });
  }

  getDirectoryTree(path: string = '/'): Observable<{root: FtpTreeNode}> {
    const rootPath = this.ftpConfig.rootPath || '/dominios/cdn.gzapi.com.br';
    const fullPath = path.startsWith(rootPath) 
      ? path 
      : rootPath + (path === '/' ? '' : path);
    
    return this.http.get<{root: FtpTreeNode}>(`${this.apiUrl}/tree`, {
      params: { path: fullPath }
    });
  }

  downloadFile(path: string): string {
    // Remove the root path from the file path to send only the relative path
    const rootPath = this.ftpConfig.rootPath || '/dominios/cdn.gzapi.com.br';
    let relativePath = path;
    if (path.startsWith(rootPath)) {
      relativePath = path.replace(rootPath, '');
    }
    // Remove leading slash for the URL parameter
    relativePath = relativePath.replace(/^\/+/, '');
    return `${this.apiUrl}/download/${relativePath}`;
  }

  getViewUrl(path: string): string {
    // Remove the root path from the file path to send only the relative path
    const rootPath = this.ftpConfig.rootPath || '/dominios/cdn.gzapi.com.br';
    let relativePath = path;
    if (path.startsWith(rootPath)) {
      relativePath = path.replace(rootPath, '');
    }
    // Remove leading slash for the URL parameter
    relativePath = relativePath.replace(/^\/+/, '');
    return `${this.apiUrl}/view/${relativePath}`;
  }

  getFileInfo(path: string): Observable<any> {
    // Remove the root path from the file path to send only the relative path
    const rootPath = this.ftpConfig.rootPath || '/dominios/cdn.gzapi.com.br';
    let relativePath = path;
    if (path.startsWith(rootPath)) {
      relativePath = path.replace(rootPath, '');
    }
    // Remove leading slash for the URL parameter
    relativePath = relativePath.replace(/^\/+/, '');
    return this.http.get<any>(`${this.apiUrl}/info/${relativePath}`);
  }

  testConnection(): Observable<{connected: boolean, message: string}> {
    return this.http.get<{connected: boolean, message: string}>(`${this.apiUrl}/test-connection`);
  }
}