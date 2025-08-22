import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TreeNode } from '../../services/file.service';

@Component({
  selector: 'app-tree-node',
  template: `
    <div class="tree-item" 
         [style.padding-left.px]="level * 16" 
         (click)="onNodeClick(node)">
      <mat-icon>folder</mat-icon>
      <span>{{ node.name }}</span>
    </div>
    
    <div class="tree-children" *ngIf="hasChildren(node)">
      <app-tree-node 
        *ngFor="let child of node.children"
        [node]="child" 
        [level]="level + 1"
        (nodeSelected)="onChildSelected($event)">
      </app-tree-node>
    </div>
  `,
  styleUrls: ['../directory-tree/directory-tree.component.scss']
})
export class TreeNodeComponent {
  @Input() node!: TreeNode;
  @Input() level = 0;
  @Output() nodeSelected = new EventEmitter<TreeNode>();

  onNodeClick(node: TreeNode): void {
    this.nodeSelected.emit(node);
  }

  onChildSelected(node: TreeNode): void {
    this.nodeSelected.emit(node);
  }

  hasChildren(node: TreeNode): boolean {
    return node.children && node.children.length > 0;
  }
}