// Tree navigation and search functionality

class TreeNavigation {
    constructor() {
        this.expandedNodes = new Set();
        this.searchResults = [];
        this.currentSearchTerm = '';
        
        this.initializeNavigation();
    }
    
    initializeNavigation() {
        this.createSearchBar();
        this.bindNavigationEvents();
        
        // Load expanded state from localStorage
        this.loadExpandedState();
    }
    
    createSearchBar() {
        const directoryTree = document.querySelector('.directory-tree');
        if (!directoryTree) return;
        
        const searchContainer = document.createElement('div');
        searchContainer.className = 'tree-search';
        searchContainer.innerHTML = `
            <div class="form-group">
                <div class="search-input-container">
                    <input type="text" class="form-control search-input" placeholder="Buscar arquivos..." id="treeSearchInput">
                    <i class="material-icons search-icon">search</i>
                    <button class="clear-search" id="clearSearchBtn" style="display: none;">
                        <i class="material-icons">clear</i>
                    </button>
                </div>
            </div>
            <div class="search-results" id="searchResults" style="display: none;"></div>
        `;
        
        // Insert search bar after tree header
        const treeHeader = directoryTree.querySelector('.tree-header');
        if (treeHeader) {
            treeHeader.insertAdjacentElement('afterend', searchContainer);
        }
        
        // Add styles
        this.addSearchStyles();
        
        // Bind search events
        this.bindSearchEvents();
    }
    
    addSearchStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tree-search {
                padding: 8px 0;
                border-bottom: 1px solid #e0e0e0;
                margin-bottom: 8px;
            }
            
            .search-input-container {
                position: relative;
                display: flex;
                align-items: center;
            }
            
            .search-input {
                padding-left: 36px;
                padding-right: 36px;
                font-size: 14px;
            }
            
            .search-icon {
                position: absolute;
                left: 8px;
                color: #666;
                font-size: 20px;
                pointer-events: none;
            }
            
            .clear-search {
                position: absolute;
                right: 8px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 50%;
                color: #666;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .clear-search:hover {
                background-color: #f5f5f5;
            }
            
            .search-results {
                max-height: 200px;
                overflow-y: auto;
                margin-top: 8px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                background: white;
            }
            
            .search-result-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s;
            }
            
            .search-result-item:hover {
                background-color: #f5f5f5;
            }
            
            .search-result-item:last-child {
                border-bottom: none;
            }
            
            .search-result-icon {
                margin-right: 8px;
                color: #5e84a4;
                font-size: 16px;
            }
            
            .search-result-info {
                flex: 1;
            }
            
            .search-result-name {
                font-weight: 500;
                font-size: 14px;
                margin-bottom: 2px;
            }
            
            .search-result-path {
                font-size: 12px;
                color: #666;
            }
            
            .search-no-results {
                padding: 16px;
                text-align: center;
                color: #666;
                font-style: italic;
            }
            
            .tree-node-expandable {
                position: relative;
            }
            
            .tree-node-expand-icon {
                position: absolute;
                left: -20px;
                cursor: pointer;
                font-size: 16px;
                color: #666;
                transition: transform 0.2s;
            }
            
            .tree-node-expand-icon.expanded {
                transform: rotate(90deg);
            }
            
            .tree-node-children {
                margin-left: 20px;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }
            
            .tree-node-children.collapsed {
                max-height: 0;
            }
            
            .tree-node-children.expanded {
                max-height: 1000px;
            }
            
            .breadcrumb-navigation {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 8px;
            }
            
            .breadcrumb-nav-item {
                padding: 4px 8px;
                background: #f5f5f5;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .breadcrumb-nav-item:hover {
                background-color: #e0e0e0;
            }
            
            .breadcrumb-nav-separator {
                color: #666;
                font-size: 12px;
            }
        `;
        document.head.appendChild(style);
    }
    
    bindSearchEvents() {
        const searchInput = document.getElementById('treeSearchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
                
                // Show/hide clear button
                if (e.target.value) {
                    clearSearchBtn.style.display = 'flex';
                } else {
                    clearSearchBtn.style.display = 'none';
                }
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                } else if (e.key === 'Escape') {
                    this.clearSearch();
                }
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }
    
    bindNavigationEvents() {
        // Handle tree node expansion
        document.addEventListener('click', (e) => {
            const expandIcon = e.target.closest('.tree-node-expand-icon');
            if (expandIcon) {
                e.stopPropagation();
                this.toggleNodeExpansion(expandIcon);
            }
        });
        
        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.closest('.directory-tree')) {
                this.handleKeyboardNavigation(e);
            }
        });
    }
    
    async performSearch(query) {
        this.currentSearchTerm = query.trim();
        
        if (!this.currentSearchTerm) {
            this.hideSearchResults();
            return;
        }
        
        if (this.currentSearchTerm.length < 2) {
            return; // Don't search for less than 2 characters
        }
        
        try {
            this.showSearchLoading();
            const results = await fileOperations.searchFiles(this.currentSearchTerm, fileExplorer.currentPath);
            this.displaySearchResults(results);
        } catch (error) {
            this.showSearchError('Erro na busca: ' + error.message);
        }
    }
    
    displaySearchResults(results) {
        const searchResultsContainer = document.getElementById('searchResults');
        if (!searchResultsContainer) return;
        
        if (results.length === 0) {
            searchResultsContainer.innerHTML = `
                <div class="search-no-results">
                    Nenhum resultado encontrado para "${this.currentSearchTerm}"
                </div>
            `;
        } else {
            let resultsHtml = '';
            results.forEach(result => {
                const icon = this.getFileIcon(result.name, result.type === 'directory');
                resultsHtml += `
                    <div class="search-result-item" data-path="${result.path}">
                        <i class="material-icons search-result-icon">${icon}</i>
                        <div class="search-result-info">
                            <div class="search-result-name">${result.name}</div>
                            <div class="search-result-path">${result.path}</div>
                        </div>
                    </div>
                `;
            });
            searchResultsContainer.innerHTML = resultsHtml;
            
            // Bind click events to search results
            this.bindSearchResultEvents();
        }
        
        searchResultsContainer.style.display = 'block';
    }
    
    bindSearchResultEvents() {
        const searchResults = document.querySelectorAll('.search-result-item');
        searchResults.forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                const isDirectory = item.querySelector('.search-result-icon').textContent === 'folder';
                
                if (isDirectory) {
                    fileExplorer.navigateToPath(path);
                } else {
                    // Navigate to parent directory and then preview file
                    const parentPath = path.substring(0, path.lastIndexOf('/'));
                    fileExplorer.navigateToPath(parentPath).then(() => {
                        fileExplorer.previewFile(path);
                    });
                }
                
                this.clearSearch();
            });
        });
    }
    
    showSearchLoading() {
        const searchResultsContainer = document.getElementById('searchResults');
        if (searchResultsContainer) {
            searchResultsContainer.innerHTML = `
                <div class="search-no-results">
                    <i class="material-icons" style="animation: spin 1s linear infinite;">refresh</i>
                    Buscando...
                </div>
            `;
            searchResultsContainer.style.display = 'block';
        }
    }
    
    showSearchError(message) {
        const searchResultsContainer = document.getElementById('searchResults');
        if (searchResultsContainer) {
            searchResultsContainer.innerHTML = `
                <div class="search-no-results" style="color: #f44336;">
                    <i class="material-icons">error</i>
                    ${message}
                </div>
            `;
            searchResultsContainer.style.display = 'block';
        }
    }
    
    hideSearchResults() {
        const searchResultsContainer = document.getElementById('searchResults');
        if (searchResultsContainer) {
            searchResultsContainer.style.display = 'none';
        }
    }
    
    clearSearch() {
        const searchInput = document.getElementById('treeSearchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        
        if (searchInput) {
            searchInput.value = '';
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
        }
        
        this.currentSearchTerm = '';
        this.hideSearchResults();
    }
    
    toggleNodeExpansion(expandIcon) {
        const treeNode = expandIcon.closest('.tree-node');
        const nodeId = treeNode.dataset.nodeId;
        const childrenContainer = treeNode.querySelector('.tree-node-children');
        
        if (!childrenContainer) return;
        
        const isExpanded = this.expandedNodes.has(nodeId);
        
        if (isExpanded) {
            // Collapse
            expandIcon.classList.remove('expanded');
            childrenContainer.classList.remove('expanded');
            childrenContainer.classList.add('collapsed');
            this.expandedNodes.delete(nodeId);
        } else {
            // Expand
            expandIcon.classList.add('expanded');
            childrenContainer.classList.add('expanded');
            childrenContainer.classList.remove('collapsed');
            this.expandedNodes.add(nodeId);
        }
        
        // Save state
        this.saveExpandedState();
    }
    
    handleKeyboardNavigation(e) {
        const focusedNode = document.querySelector('.tree-node.focused');
        
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.focusPreviousNode(focusedNode);
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.focusNextNode(focusedNode);
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                if (focusedNode) {
                    const expandIcon = focusedNode.querySelector('.tree-node-expand-icon');
                    if (expandIcon && !expandIcon.classList.contains('expanded')) {
                        this.toggleNodeExpansion(expandIcon);
                    }
                }
                break;
                
            case 'ArrowLeft':
                e.preventDefault();
                if (focusedNode) {
                    const expandIcon = focusedNode.querySelector('.tree-node-expand-icon');
                    if (expandIcon && expandIcon.classList.contains('expanded')) {
                        this.toggleNodeExpansion(expandIcon);
                    }
                }
                break;
                
            case 'Enter':
                e.preventDefault();
                if (focusedNode) {
                    focusedNode.click();
                }
                break;
        }
    }
    
    focusPreviousNode(currentNode) {
        const allNodes = Array.from(document.querySelectorAll('.tree-node'));
        const currentIndex = allNodes.indexOf(currentNode);
        
        if (currentIndex > 0) {
            this.setNodeFocus(allNodes[currentIndex - 1]);
        }
    }
    
    focusNextNode(currentNode) {
        const allNodes = Array.from(document.querySelectorAll('.tree-node'));
        const currentIndex = allNodes.indexOf(currentNode);
        
        if (currentIndex < allNodes.length - 1) {
            this.setNodeFocus(allNodes[currentIndex + 1]);
        }
    }
    
    setNodeFocus(node) {
        // Remove focus from all nodes
        document.querySelectorAll('.tree-node.focused').forEach(n => {
            n.classList.remove('focused');
        });
        
        // Add focus to target node
        node.classList.add('focused');
        node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    getFileIcon(filename, isDirectory) {
        if (isDirectory) {
            return 'folder';
        }
        
        const extension = filename.split('.').pop().toLowerCase();
        
        const iconMap = {
            'txt': 'description',
            'md': 'description',
            'doc': 'description',
            'docx': 'description',
            'pdf': 'picture_as_pdf',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'mp4': 'video_file',
            'avi': 'video_file',
            'mp3': 'audio_file',
            'wav': 'audio_file',
            'zip': 'archive',
            'rar': 'archive',
            'html': 'code',
            'css': 'code',
            'js': 'code',
            'php': 'code',
            'json': 'code',
            'xml': 'code'
        };
        
        return iconMap[extension] || 'insert_drive_file';
    }
    
    createBreadcrumbNavigation(path) {
        const pathParts = path.split('/').filter(part => part);
        const breadcrumbContainer = document.querySelector('.breadcrumb-navigation');
        
        if (!breadcrumbContainer) return;
        
        let breadcrumbHtml = `
            <div class="breadcrumb-nav-item" onclick="fileExplorer.navigateToPath('/')">
                <i class="material-icons">home</i>
            </div>
        `;
        
        let currentPath = '';
        pathParts.forEach((part, index) => {
            currentPath += '/' + part;
            
            if (index > 0) {
                breadcrumbHtml += '<span class="breadcrumb-nav-separator">></span>';
            }
            
            breadcrumbHtml += `
                <div class="breadcrumb-nav-item" onclick="fileExplorer.navigateToPath('${currentPath}')">
                    ${part}
                </div>
            `;
        });
        
        breadcrumbContainer.innerHTML = breadcrumbHtml;
    }
    
    saveExpandedState() {
        localStorage.setItem('treeExpandedNodes', JSON.stringify([...this.expandedNodes]));
    }
    
    loadExpandedState() {
        try {
            const saved = localStorage.getItem('treeExpandedNodes');
            if (saved) {
                this.expandedNodes = new Set(JSON.parse(saved));
            }
        } catch (error) {
            console.warn('Failed to load expanded state:', error);
        }
    }
    
    // Utility methods for external use
    expandToPath(path) {
        const pathParts = path.split('/').filter(part => part);
        let currentPath = '';
        
        pathParts.forEach(part => {
            currentPath += '/' + part;
            const nodeId = this.generateNodeId(currentPath);
            this.expandedNodes.add(nodeId);
        });
        
        this.saveExpandedState();
        // Re-render tree with expanded state
        fileExplorer.loadDirectoryTree();
    }
    
    generateNodeId(path) {
        return path.replace(/[^a-zA-Z0-9]/g, '_');
    }
    
    highlightCurrentPath(currentPath) {
        // Remove previous highlights
        document.querySelectorAll('.tree-node.current-path').forEach(node => {
            node.classList.remove('current-path');
        });
        
        // Add highlight to current path
        const nodeId = this.generateNodeId(currentPath);
        const currentNode = document.querySelector(`[data-node-id="${nodeId}"]`);
        
        if (currentNode) {
            currentNode.classList.add('current-path');
            currentNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

// Initialize tree navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.treeNavigation = new TreeNavigation();
    
    // Add current path highlighting styles
    const style = document.createElement('style');
    style.textContent = `
        .tree-node.current-path {
            background-color: #e3f2fd;
            color: #1976d2;
            font-weight: 500;
        }
        
        .tree-node.focused {
            outline: 2px solid #1976d2;
            outline-offset: -2px;
            border-radius: 4px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});