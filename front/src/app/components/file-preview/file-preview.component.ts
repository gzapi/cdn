import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FileService, FileItem } from '../../services/file.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss']
})
export class FilePreviewComponent implements OnInit {
  @Input() file!: FileItem;
  @Input() showPreview = false;
  @Output() showPreviewChange = new EventEmitter<boolean>();
  
  previewUrl: SafeResourceUrl | null = null;
  isImage = false;
  isVideo = false;
  isPdf = false;
  isAudio = false;

  constructor(
    private fileService: FileService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.updatePreview();
  }

  ngOnChanges(): void {
    this.updatePreview();
  }

  private updatePreview(): void {
    if (!this.file || !this.showPreview) {
      this.previewUrl = null;
      return;
    }

    const mimeType = this.file.mimeType || '';
    this.isImage = mimeType.startsWith('image/');
    this.isVideo = mimeType.startsWith('video/');
    this.isAudio = mimeType.startsWith('audio/');
    this.isPdf = mimeType === 'application/pdf';

    if (this.canPreview()) {
      const url = this.fileService.getViewUrl(this.file.path);
      this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }

  canPreview(): boolean {
    return this.isImage || this.isVideo || this.isPdf || this.isAudio;
  }

  getPreviewType(): string {
    if (this.isImage) return 'image';
    if (this.isVideo) return 'video';
    if (this.isAudio) return 'audio';
    if (this.isPdf) return 'pdf';
    return 'none';
  }

  closePreview(): void {
    this.showPreviewChange.emit(false);
  }
}