// File operations JavaScript module

class FileOperations {
    constructor() {
        this.uploadQueue = [];
        this.isUploading = false;
    }
    
    // File upload functionality
    async uploadFiles(files, targetPath = '/') {
        for (const file of files) {
            this.uploadQueue.push({ file, targetPath });
        }
        
        if (!this.isUploading) {
            this.processUploadQueue();
        }
    }
    
    async processUploadQueue() {
        if (this.uploadQueue.length === 0) {
            this.isUploading = false;
            return;
        }
        
        this.isUploading = true;
        const { file, targetPath } = this.uploadQueue.shift();
        
        try {
            await this.uploadSingleFile(file, targetPath);
            fileExplorer.showSuccess(`Upload concluído: ${file.name}`);
        } catch (error) {
            fileExplorer.showError(`Erro no upload de ${file.name}: ${error.message}`);
        }
        
        // Process next file in queue
        setTimeout(() => this.processUploadQueue(), 100);
    }
    
    async uploadSingleFile(file, targetPath) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetPath', targetPath);
        formData.append('action', 'upload_file');
        
        const response = await fetch('index.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        return result;
    }
    
    // File deletion
    async deleteFile(filePath) {
        if (!confirm('Tem certeza que deseja excluir este arquivo?')) {
            return;
        }
        
        try {
            const response = await fetch('index.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete_file',
                    file: filePath
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            fileExplorer.showSuccess('Arquivo excluído com sucesso!');
            await fileExplorer.refreshContent();
        } catch (error) {
            fileExplorer.showError('Erro ao excluir arquivo: ' + error.message);
        }
    }
    
    // Create new folder
    async createFolder(folderName, targetPath = '/') {
        if (!folderName || folderName.trim() === '') {
            fileExplorer.showError('Nome da pasta não pode estar vazio');
            return;
        }
        
        try {
            const response = await fetch('index.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create_folder',
                    name: folderName.trim(),
                    path: targetPath
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            fileExplorer.showSuccess('Pasta criada com sucesso!');
            await fileExplorer.refreshContent();
            await fileExplorer.loadDirectoryTree();
        } catch (error) {
            fileExplorer.showError('Erro ao criar pasta: ' + error.message);
        }
    }
    
    // Rename file/folder
    async renameItem(oldPath, newName) {
        if (!newName || newName.trim() === '') {
            fileExplorer.showError('Novo nome não pode estar vazio');
            return;
        }
        
        try {
            const response = await fetch('index.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'rename_item',
                    oldPath: oldPath,
                    newName: newName.trim()
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            fileExplorer.showSuccess('Item renomeado com sucesso!');
            await fileExplorer.refreshContent();
            await fileExplorer.loadDirectoryTree();
        } catch (error) {
            fileExplorer.showError('Erro ao renomear item: ' + error.message);
        }
    }
    
    // Copy file/folder
    async copyItem(sourcePath, targetPath) {
        try {
            const response = await fetch('index.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'copy_item',
                    source: sourcePath,
                    target: targetPath
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            fileExplorer.showSuccess('Item copiado com sucesso!');
            await fileExplorer.refreshContent();
        } catch (error) {
            fileExplorer.showError('Erro ao copiar item: ' + error.message);
        }
    }
    
    // Move file/folder
    async moveItem(sourcePath, targetPath) {
        try {
            const response = await fetch('index.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'move_item',
                    source: sourcePath,
                    target: targetPath
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            fileExplorer.showSuccess('Item movido com sucesso!');
            await fileExplorer.refreshContent();
            await fileExplorer.loadDirectoryTree();
        } catch (error) {
            fileExplorer.showError('Erro ao mover item: ' + error.message);
        }
    }
    
    // Get file/folder properties
    async getItemProperties(itemPath) {
        try {
            const response = await fetch(`index.php?action=get_properties&item=${encodeURIComponent(itemPath)}`);
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            return result;
        } catch (error) {
            fileExplorer.showError('Erro ao obter propriedades: ' + error.message);
            return null;
        }
    }
    
    // Search files
    async searchFiles(query, searchPath = '/') {
        if (!query || query.trim() === '') {
            return [];
        }
        
        try {
            const response = await fetch(`index.php?action=search_files&query=${encodeURIComponent(query.trim())}&path=${encodeURIComponent(searchPath)}`);
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            return result;
        } catch (error) {
            fileExplorer.showError('Erro na busca: ' + error.message);
            return [];
        }
    }
    
    // Check file permissions
    async checkPermissions(itemPath) {
        try {
            const response = await fetch(`index.php?action=check_permissions&item=${encodeURIComponent(itemPath)}`);
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            return result;
        } catch (error) {
            console.error('Error checking permissions:', error);
            return {
                readable: false,
                writable: false,
                executable: false
            };
        }
    }
    
    // Compress files/folders
    async compressItems(items, archiveName, targetPath = '/') {
        try {
            const response = await fetch('index.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'compress_items',
                    items: items,
                    archiveName: archiveName,
                    targetPath: targetPath
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            fileExplorer.showSuccess('Arquivos comprimidos com sucesso!');
            await fileExplorer.refreshContent();
        } catch (error) {
            fileExplorer.showError('Erro ao comprimir arquivos: ' + error.message);
        }
    }
    
    // Extract archive
    async extractArchive(archivePath, targetPath = '/') {
        try {
            const response = await fetch('index.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'extract_archive',
                    archive: archivePath,
                    targetPath: targetPath
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            fileExplorer.showSuccess('Arquivo extraído com sucesso!');
            await fileExplorer.refreshContent();
        } catch (error) {
            fileExplorer.showError('Erro ao extrair arquivo: ' + error.message);
        }
    }
}

// Drag and Drop functionality
class DragDropHandler {
    constructor() {
        this.initializeDragDrop();
    }
    
    initializeDragDrop() {
        const mainContent = document.querySelector('.main-content');
        
        if (!mainContent) return;
        
        mainContent.addEventListener('dragover', this.handleDragOver.bind(this));
        mainContent.addEventListener('drop', this.handleDrop.bind(this));
        mainContent.addEventListener('dragenter', this.handleDragEnter.bind(this));
        mainContent.addEventListener('dragleave', this.handleDragLeave.bind(this));
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }
    
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.add('drag-over');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Only remove class if we're leaving the main content area
        if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
            document.body.classList.remove('drag-over');
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        document.body.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        
        if (files.length > 0) {
            fileOperations.uploadFiles(files, fileExplorer.currentPath);
        }
    }
}

// Context menu functionality
class ContextMenu {
    constructor() {
        this.currentElement = null;
        this.initializeContextMenu();
    }
    
    initializeContextMenu() {
        // Create context menu element
        this.createContextMenuElement();
        
        // Bind events
        document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        document.addEventListener('click', this.hideContextMenu.bind(this));
    }
    
    createContextMenuElement() {
        const contextMenu = document.createElement('div');
        contextMenu.id = 'contextMenu';
        contextMenu.className = 'dropdown-menu';
        contextMenu.style.position = 'fixed';
        contextMenu.style.display = 'none';
        contextMenu.style.zIndex = '1000';
        
        document.body.appendChild(contextMenu);
    }
    
    handleContextMenu(e) {
        const fileCard = e.target.closest('.file-card');
        const directoryTree = e.target.closest('.directory-tree');
        const mainContent = e.target.closest('.main-content');
        
        if (fileCard) {
            e.preventDefault();
            this.showFileContextMenu(e, fileCard);
        } else if (directoryTree) {
            e.preventDefault();
            this.showDirectoryContextMenu(e);
        } else if (mainContent) {
            e.preventDefault();
            this.showMainContextMenu(e);
        }
    }
    
    showFileContextMenu(e, fileCard) {
        const fileName = fileCard.querySelector('.file-name').textContent;
        const isDirectory = fileCard.querySelector('.folder-icon') !== null;
        
        const menuItems = [
            {
                label: 'Abrir',
                icon: 'open_in_new',
                action: () => {
                    if (isDirectory) {
                        fileExplorer.navigateToPath(fileName);
                    } else {
                        fileExplorer.previewFile(fileName);
                    }
                }
            },
            {
                label: 'Renomear',
                icon: 'edit',
                action: () => this.showRenameDialog(fileName)
            },
            {
                label: 'Copiar',
                icon: 'content_copy',
                action: () => this.copyItem(fileName)
            },
            {
                label: 'Cortar',
                icon: 'content_cut',
                action: () => this.cutItem(fileName)
            },
            { divider: true },
            {
                label: 'Propriedades',
                icon: 'info',
                action: () => this.showProperties(fileName)
            },
            { divider: true },
            {
                label: 'Excluir',
                icon: 'delete',
                action: () => fileOperations.deleteFile(fileName),
                class: 'text-error'
            }
        ];
        
        this.showContextMenu(e, menuItems);
    }
    
    showDirectoryContextMenu(e) {
        const menuItems = [
            {
                label: 'Nova Pasta',
                icon: 'create_new_folder',
                action: () => this.showCreateFolderDialog()
            },
            {
                label: 'Atualizar',
                icon: 'refresh',
                action: () => fileExplorer.refreshContent()
            }
        ];
        
        this.showContextMenu(e, menuItems);
    }
    
    showMainContextMenu(e) {
        const menuItems = [
            {
                label: 'Nova Pasta',
                icon: 'create_new_folder',
                action: () => this.showCreateFolderDialog()
            },
            {
                label: 'Upload de Arquivos',
                icon: 'upload',
                action: () => this.showUploadDialog()
            },
            { divider: true },
            {
                label: 'Colar',
                icon: 'content_paste',
                action: () => this.pasteItem(),
                disabled: !this.hasClipboardData()
            },
            { divider: true },
            {
                label: 'Atualizar',
                icon: 'refresh',
                action: () => fileExplorer.refreshContent()
            }
        ];
        
        this.showContextMenu(e, menuItems);
    }
    
    showContextMenu(e, items) {
        const contextMenu = document.getElementById('contextMenu');
        
        // Build menu HTML
        let menuHtml = '';
        items.forEach(item => {
            if (item.divider) {
                menuHtml += '<div class="dropdown-divider"></div>';
            } else {
                const disabled = item.disabled ? 'disabled' : '';
                const className = item.class ? item.class : '';
                menuHtml += `
                    <button class="dropdown-item ${className}" ${disabled} onclick="contextMenu.executeAction('${item.action}')">
                        <i class="material-icons">${item.icon}</i>
                        ${item.label}
                    </button>
                `;
            }
        });
        
        contextMenu.innerHTML = menuHtml;
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        
        // Store actions for execution
        this.menuActions = items.reduce((acc, item) => {
            if (item.action && !item.divider) {
                acc[item.action.toString()] = item.action;
            }
            return acc;
        }, {});
    }
    
    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }
    
    executeAction(actionKey) {
        if (this.menuActions && this.menuActions[actionKey]) {
            this.menuActions[actionKey]();
        }
        this.hideContextMenu();
    }
    
    // Dialog methods
    showRenameDialog(currentName) {
        const newName = prompt('Novo nome:', currentName);
        if (newName && newName !== currentName) {
            fileOperations.renameItem(currentName, newName);
        }
    }
    
    showCreateFolderDialog() {
        const folderName = prompt('Nome da nova pasta:');
        if (folderName) {
            fileOperations.createFolder(folderName, fileExplorer.currentPath);
        }
    }
    
    showUploadDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                fileOperations.uploadFiles(files, fileExplorer.currentPath);
            }
        };
        input.click();
    }
    
    showProperties(itemPath) {
        // Implementation for showing properties dialog
        fileOperations.getItemProperties(itemPath).then(properties => {
            if (properties) {
                // Show properties in a modal or alert
                alert(`Propriedades de ${itemPath}:\n\nTamanho: ${properties.size}\nModificado: ${properties.modified}\nPermissões: ${properties.permissions}`);
            }
        });
    }
    
    // Clipboard operations
    copyItem(itemPath) {
        this.clipboard = { action: 'copy', item: itemPath };
        fileExplorer.showSuccess(`${itemPath} copiado para a área de transferência`);
    }
    
    cutItem(itemPath) {
        this.clipboard = { action: 'cut', item: itemPath };
        fileExplorer.showSuccess(`${itemPath} cortado para a área de transferência`);
    }
    
    pasteItem() {
        if (!this.clipboard) return;
        
        const { action, item } = this.clipboard;
        const targetPath = fileExplorer.currentPath;
        
        if (action === 'copy') {
            fileOperations.copyItem(item, targetPath);
        } else if (action === 'cut') {
            fileOperations.moveItem(item, targetPath);
            this.clipboard = null; // Clear after cut
        }
    }
    
    hasClipboardData() {
        return this.clipboard !== null && this.clipboard !== undefined;
    }
}

// Initialize modules when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fileOperations = new FileOperations();
    window.dragDropHandler = new DragDropHandler();
    window.contextMenu = new ContextMenu();
    
    // Add drag-over styles
    const style = document.createElement('style');
    style.textContent = `
        body.drag-over {
            background-color: rgba(25, 118, 210, 0.1);
        }
        
        body.drag-over::after {
            content: 'Solte os arquivos aqui para fazer upload';
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(25, 118, 210, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            font-size: 18px;
            z-index: 10000;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
});