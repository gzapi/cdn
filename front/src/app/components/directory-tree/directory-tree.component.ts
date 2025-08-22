import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { FileService, TreeNode, TreeResponse } from '../../services/file.service';
import { environment } from '../../../environments/environment';

interface ExpandableTreeNode extends TreeNode {
  expanded?: boolean;
  level?: number;
  isDirectory?: boolean;
}

@Component({
  selector: 'app-directory-tree',
  templateUrl: './directory-tree.component.html',
  styleUrls: ['./directory-tree.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('in', style({
        opacity: 1,
        transform: 'translateY(0)',
        maxHeight: '1000px'
      })),
      state('out', style({
        opacity: 0,
        transform: 'translateY(-10px)',
        maxHeight: '0px'
      })),
      transition('in => out', animate('200ms ease-in')),
      transition('out => in', animate('200ms ease-out'))
    ])
  ]
})
export class DirectoryTreeComponent implements OnInit {
  @Output() pathSelected = new EventEmitter<string>();
  
  treeData: ExpandableTreeNode | null = null;
  loading = true;
  selectedPath: string | null = null;

  constructor(private fileService: FileService) { }

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree(path?: string): void {
    this.loading = true;
    const rootPath = environment.ftpConfig.rootPath || '/dominios/cdn.gzapi.com.br';
    const treePath = path || rootPath;
    this.fileService.getDirectoryTree(treePath).subscribe({
      next: (response: TreeResponse) => {
        this.treeData = this.prepareTreeData(response.root, 0);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar árvore:', error);
        this.loading = false;
      }
    });
  }

  private prepareTreeData(node: TreeNode, level: number): ExpandableTreeNode {
    const hasChildren = node.children && node.children.length > 0;
    const isDir = hasChildren || this.looksLikeDirectory(node.name);
    
    return {
      ...node,
      expanded: level === 0, // Root sempre expandido
      level: level,
      isDirectory: isDir,
      children: node.children.map(child => this.prepareTreeData(child, level + 1))
    };
  }

  onNodeClick(node: ExpandableTreeNode): void {
    this.selectedPath = node.path;
    this.pathSelected.emit(node.path);
  }

  onToggleExpand(node: ExpandableTreeNode, event: Event): void {
    event.stopPropagation();
    node.expanded = !node.expanded;
  }

  hasChildren(node: ExpandableTreeNode): boolean {
    return node.children && node.children.length > 0;
  }

  isExpanded(node: ExpandableTreeNode): boolean {
    return node.expanded || false;
  }

  isDirectory(node: ExpandableTreeNode): boolean {
    return node.isDirectory || false;
  }

  isSelected(node: ExpandableTreeNode): boolean {
    return this.selectedPath === node.path;
  }

  private looksLikeDirectory(name: string): boolean {
    // Se não tem extensão, provavelmente é diretório
    const hasExtension = name.includes('.') && name.lastIndexOf('.') > name.lastIndexOf('/');
    return !hasExtension;
  }
}