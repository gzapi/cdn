import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTreeModule } from '@angular/material/tree';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppComponent } from './app.component';
import { FileExplorerComponent } from './components/file-explorer/file-explorer.component';
import { DirectoryTreeComponent } from './components/directory-tree/directory-tree.component';
import { FileListComponent } from './components/file-list/file-list.component';
import { FilePreviewComponent } from './components/file-preview/file-preview.component';
import { ConnectionStatusComponent } from './components/connection-status/connection-status.component';
import { DemoBannerComponent } from './components/demo-banner/demo-banner.component';
import { FileService } from './services/file.service';
import { FtpService } from './services/ftp.service';

@NgModule({
  declarations: [
    AppComponent,
    FileExplorerComponent,
    DirectoryTreeComponent,
    FileListComponent,
    FilePreviewComponent,
    ConnectionStatusComponent,
    DemoBannerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTreeModule,
    MatExpansionModule,
    MatTooltipModule
  ],
  providers: [FileService, FtpService],
  bootstrap: [AppComponent]
})
export class AppModule { }