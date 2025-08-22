import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `<app-file-explorer></app-file-explorer>`,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'File Explorer';
}