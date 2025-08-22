// Main application JavaScript
class FileExplorer {
  constructor() {
    this.currentPath = "/";
    this.sidenavOpened = true;
    this.files = [];
    this.directoryTree = [];
    this.pathHistory = ["/"];

    this.initializeApp();
  }

  async initializeApp() {
    this.bindEvents();
    await this.loadDirectoryTree();
    await this.loadFiles(this.currentPath);
    this.updateBreadcrumb();
  }

  bindEvents() {
    // Window resize event
    window.addEventListener("resize", () => {
      this.handleResize();
    });

    // Handle mobile responsiveness
    this.handleResize();
  }

  async loadDirectoryTree() {
    try {
      const response = await fetch("index.php?action=get_directory_tree");
      const data = await response.json();

      if (data.error) {
        this.showError("Erro ao carregar árvore de diretórios: " + data.error);
        return;
      }

      this.directoryTree = data;
      this.renderDirectoryTree(data);
    } catch (error) {
      this.showError("Erro de conexão ao carregar árvore de diretórios");
      console.error("Error loading directory tree:", error);
    }
  }

  renderDirectoryTree(tree, container = null, level = 0) {
    if (!container) {
      container = document.getElementById("directoryTree");
      const homeNode = container.querySelector(".tree-node");

      if (homeNode) {
        while (homeNode.nextSibling) {
          homeNode.nextSibling.remove();
        }
      } else {
        container.innerHTML = "";
      }
    }

    tree.forEach((item) => {
      if (item.type === "directory") {
        const nodeEl = document.createElement("div");
        nodeEl.className = "tree-node";
        nodeEl.style.paddingLeft = `${(level + 1) * 20}px`;
        const nodeId = this.generateNodeId(item.path);
        nodeEl.setAttribute("data-node-id", nodeId);
        nodeEl.innerHTML = `
                    <i class="fa-solid ${
                      item.children && item.children.length > 0
                        ? "fa-folder-open"
                        : "fa-folder"
                    }"></i>
                    <span>${item.name}</span>
                `;

        nodeEl.addEventListener("click", (e) => {
          e.stopPropagation();
          this.selectDirectory(item.path, nodeEl);
        });

        container.appendChild(nodeEl);

        if (item.children && item.children.length > 0) {
          this.renderDirectoryTree(item.children, container, level + 1);
        }
      }
    });
  }

  async loadFiles(path) {
    try {
      this.showLoading();
      const response = await fetch(
        `index.php?action=get_files&path=${encodeURIComponent(path)}`
      );

      const data = await response.json();

      if (data.error) {
        this.showError("Erro ao carregar arquivos: " + data.error);
        return;
      }

      console.log(data);
      this.files = data;
      this.renderFiles(data);
    } catch (error) {
      this.showError("Erro de conexão ao carregar arquivos");
      console.error("Error loading files:", error);
    }
  }

  renderFiles(files) {
    const fileGrid = document.getElementById("fileGrid");
    fileGrid.innerHTML = "";

    if (files.length === 0) {
      fileGrid.innerHTML =
        '<div class="text-center text-muted p-4">Nenhum arquivo encontrado neste diretório.</div>';
      return;
    }

    files.forEach((file) => {
      const fileCard = document.createElement("div");
      fileCard.className = "file-card";

      const iconClass = file.type === "directory" ? "folder-icon" : "file-icon";
      const fileSize =
        file.type === "file" ? this.formatFileSize(file.size) : "";
      const itemCount =
        file.type === "directory" && file.item_count !== null
          ? `${file.item_count} ${file.item_count === 1 ? "item" : "itens"}`
          : "";
      const modifiedDate = new Date(file.modified * 1000).toLocaleDateString(
        "pt-BR"
      );

      fileCard.innerHTML = `
                <i class="${file.icon} ${iconClass}"></i>
                <div class="file-name">${file.name}</div>
                <div class="file-info">
                    ${
                      file.type === "file"
                        ? fileSize + " • " + modifiedDate
                        : itemCount + (itemCount ? " • " : "") + modifiedDate
                    }
                </div>
                <div class="file-actions">
                    ${
                      file.type === "file"
                        ? (this.canPreviewFile(file.extension || "")
                            ? '<button title="Visualizar" class="file-action-btn" onclick="fileExplorer.previewFile(\'' +
                              file.path +
                              '\')"><i class="fa-regular fa-eye"></i></button>'
                            : "") +
                          '<button title="Copiar URL" class="file-action-btn" onclick="fileExplorer.copyFileUrl(\'' +
                          file.path +
                          '\')"><i class="fa-solid fa-copy"></i></button>' +
                          '<button class="file-action-btn" title="Download" onclick="fileExplorer.downloadFile(\'' +
                          file.path +
                          '\')"><i class="fa-solid fa-download"></i></button>'
                        : '<button  class="file-action-btn" title="Ir para ' +
                          file.name +
                          '" onclick="fileExplorer.navigateToPath(\'' +
                          file.path +
                          "')\"><i class='fa-solid fa-chevron-right'></i></button>"
                    }
                </div>
            `;

      fileGrid.appendChild(fileCard);
    });
  }

  canPreviewFile(extension) {
    const previewableExtensions = [
      "txt",
      "md",
      "json",
      "xml",
      "html",
      "css",
      "js",
      "php",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "pdf",
      "mp4",
      "avi",
      "mov",
      "wmv",
      "mp3",
      "wav",
      "ogg",
    ];
    return previewableExtensions.includes(extension.toLowerCase());
  }

  async previewFile(filePath) {
    try {
      const response = await fetch(
        `index.php?action=get_file_content&file=${encodeURIComponent(filePath)}`
      );
      const data = await response.json();

      if (data.error) {
        this.showToast(
          "Não foi possível visualizar o arquivo. Iniciando download...",
          "warning"
        );
        this.downloadFile(filePath);
        return;
      }

      this.showPreview(filePath, data);
    } catch (error) {
      this.showToast("Erro de conexão. Iniciando download...", "warning");
      this.downloadFile(filePath);
      console.error("Error previewing file:", error);
    }
  }

  showPreview(filePath, fileData) {
    const previewContainer = document.getElementById("previewContainer");
    const previewTitle = document.getElementById("previewTitle");
    const previewContent = document.getElementById("previewContent");

    const fileName = filePath.split("/").pop();
    previewTitle.textContent = `Preview: ${fileName}`;

    let contentHtml = "";

    switch (fileData.type) {
      case "image":
        contentHtml = `<img src="${fileData.content}" alt="${fileName}" class="preview-image">`;
        break;

      case "pdf":
        contentHtml = `<iframe src="${fileData.content}" class="preview-pdf"></iframe>`;
        break;

      case "video":
        contentHtml = `<video controls class="preview-video">
          <source src="${fileData.content}" type="video/${fileData.extension}">
          Seu navegador não suporta reprodução de vídeo.
        </video>`;
        break;

      case "audio":
        contentHtml = `<audio controls class="preview-audio">
          <source src="${fileData.content}" type="audio/${fileData.extension}">
          Seu navegador não suporta reprodução de áudio.
        </audio>`;
        break;

      case "document":
        contentHtml = `<div class="preview-document">
          <p>Arquivo Word detectado: ${fileName}</p>
          <p>O navegador não consegue exibir documentos Word diretamente.</p>
          <button onclick="window.open('${fileData.content}', '_blank')" class="download-btn">
            <i class="fa-solid fa-download"></i> Baixar arquivo
          </button>
        </div>`;
        break;

      case "text":
      default:
        const escapedContent = this.escapeHtml(fileData.content);
        contentHtml = `<div class="preview-text">${escapedContent}</div>`;
        break;
    }

    previewContent.innerHTML = contentHtml;
    previewContainer.style.display = "block";
    previewContainer.scrollIntoView({ behavior: "smooth" });
  }

  closePreview() {
    const previewContainer = document.getElementById("previewContainer");
    previewContainer.style.display = "none";
  }

  copyFileUrl(filePath) {
    const baseUrl = window.location.origin + window.location.pathname;
    const fileUrl = `${baseUrl}?action=download&file=${encodeURIComponent(
      filePath
    )}`;

    navigator.clipboard
      .writeText(fileUrl)
      .then(() => {
        this.showToast("URL copiada para a área de transferência!", "success");
      })
      .catch((err) => {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement("textarea");
        textArea.value = fileUrl;
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999);

        try {
          document.execCommand("copy");
          this.showToast(
            "URL copiada para a área de transferência!",
            "success"
          );
        } catch (err) {
          this.showToast("Erro ao copiar URL", "error");
        }

        document.body.removeChild(textArea);
      });
  }

  downloadFile(filePath) {
    const link = document.createElement("a");
    link.href = `index.php?action=download&file=${encodeURIComponent(
      filePath
    )}`;
    link.download = filePath.split("/").pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async navigateToPath(path) {
    // Add current path to history if it's different from the new path
    if (
      this.currentPath !== path &&
      !this.pathHistory.includes(this.currentPath)
    ) {
      this.pathHistory.push(this.currentPath);
    }

    this.currentPath = path;
    await this.loadFiles(path);
    this.updateBreadcrumb();
    this.closePreview();

    // Update tree selection and expand to path
    this.updateTreeSelection(path);
  }

  selectDirectory(path, element) {
    // Remove previous selection
    document.querySelectorAll(".tree-node.selected").forEach((node) => {
      node.classList.remove("selected");
    });

    // Add selection to current element
    element.classList.add("selected");

    // Update folder icons
    this.updateFolderIcons();

    // Navigate to selected directory
    this.navigateToPath(path);
  }

  updateTreeSelection(path) {
    // Update folder icons first
    this.updateFolderIcons();
    
    // Remove previous selection
    document.querySelectorAll(".tree-node.selected").forEach((node) => {
      node.classList.remove("selected");
    });

    // Find and select the current path in tree
    if (window.treeNavigation) {
      window.treeNavigation.expandToPath(path);
      // Add a small delay to ensure tree is rendered
      setTimeout(() => {
        window.treeNavigation.highlightCurrentPath(path);
        // Update icons after selection
        this.updateFolderIcons();
      }, 100);
    } else {
      // Fallback if treeNavigation is not available yet
      this.findAndSelectTreeNode(path);
      // Update icons after selection
      this.updateFolderIcons();
    }
  }

  findAndSelectTreeNode(path) {
    // Try to find the node by data-node-id
    const nodeId = this.generateNodeId(path);
    let targetNode = document.querySelector(`[data-node-id="${nodeId}"]`);
    
    // If not found by ID, try to match by path content
    if (!targetNode && path !== "/") {
      const pathParts = path.split("/").filter(part => part);
      const currentFolderName = pathParts[pathParts.length - 1];
      
      const allNodes = document.querySelectorAll(".tree-node");
      for (const node of allNodes) {
        const span = node.querySelector("span");
        if (span && span.textContent.trim() === currentFolderName) {
          targetNode = node;
          break;
        }
      }
    }
    
    // Select the found node
    if (targetNode) {
      targetNode.classList.add("selected");
      targetNode.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  updateFolderIcons() {
    // Get all folder icons in tree nodes (excluding home icon)
    const treeNodes = document.querySelectorAll(".tree-node");
    
    treeNodes.forEach(node => {
      const icon = node.querySelector("i");
      if (!icon) return;
      
      // Skip the home icon
      if (icon.classList.contains("fa-house")) return;
      
      // Check if this node is selected
      if (node.classList.contains("selected")) {
        // Selected folder should show folder-open
        if (icon.classList.contains("fa-folder")) {
          icon.classList.remove("fa-folder");
          icon.classList.add("fa-folder-open");
        }
      } else {
        // Non-selected folders should show folder
        if (icon.classList.contains("fa-folder-open")) {
          icon.classList.remove("fa-folder-open");
          icon.classList.add("fa-folder");
        }
      }
    });
  }

  updateBreadcrumb() {
    const currentPathElement = document.getElementById("currentPath");
    const backButton = document.getElementById("backButton");
    const breadcrumbSeparator = document.getElementById("breadcrumbSeparator");
    const pathParts = this.currentPath.split("/").filter((part) => part);

    if (pathParts.length === 0) {
      currentPathElement.textContent = "";
      backButton.style.display = "none";
      breadcrumbSeparator.style.display = "none";
    } else {
      currentPathElement.textContent = pathParts[pathParts.length - 1];
      backButton.style.display = "inline-flex";
      breadcrumbSeparator.style.display = "inline";
    }
  }

  goBack() {
    if (this.pathHistory.length > 1) {
      // Remove current path and go to previous one
      this.pathHistory.pop();
      const previousPath = this.pathHistory[this.pathHistory.length - 1];
      this.currentPath = previousPath;
      this.loadFiles(previousPath);
      this.updateBreadcrumb();
      this.closePreview();
    } else {
      // Go to root if no history
      this.navigateToPath("/");
    }
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
    const sidebar = document.getElementById("sidebar");

    if (this.sidenavOpened) {
      sidebar.classList.remove("closed");
    } else {
      sidebar.classList.add("closed");
    }
  }

  async refreshContent() {
    await this.loadDirectoryTree();
    await this.loadFiles(this.currentPath);
    this.showSuccess("Conteúdo atualizado com sucesso!");
  }

  showLoading() {
    const fileGrid = document.getElementById("fileGrid");
    fileGrid.innerHTML =
      '<div class="loading text-center p-4">Carregando arquivos...</div>';
  }

  showError(message) {
    this.showToast(message, "error");
  }

  showSuccess(message) {
    this.showToast(message, "success");
  }

  showToast(message, type = "info") {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toastContainer";
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icons = {
      success: "fa-solid fa-circle-check",
      error: "fa-solid fa-circle-exclamation",
      warning: "fa-solid fa-triangle-exclamation",
      info: "fa-solid fa-circle-info",
    };

    toast.innerHTML = `
            <i class="${icons[type] || icons.info} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

    toastContainer.appendChild(toast);

    // Show toast
    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  generateNodeId(path) {
    return path.replace(/[^a-zA-Z0-9]/g, "_");
  }

  formatFileSize(bytes) {
    if (bytes >= 1073741824) {
      return (bytes / 1073741824).toFixed(2) + " GB";
    } else if (bytes >= 1048576) {
      return (bytes / 1048576).toFixed(2) + " MB";
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + " KB";
    } else {
      return bytes + " bytes";
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  handleResize() {
    const sidebar = document.getElementById("sidebar");
    const isMobile = window.innerWidth < 768;

    if (isMobile && this.sidenavOpened) {
      sidebar.classList.add("mobile-open");
    } else {
      sidebar.classList.remove("mobile-open");
    }
  }
}

// Global functions for button clicks
function toggleSidenav() {
  fileExplorer.toggleSidenav();
}

function refreshContent() {
  fileExplorer.refreshContent();
}

function navigateToPath(path) {
  fileExplorer.navigateToPath(path);
}

function closePreview() {
  fileExplorer.closePreview();
}

function goBack() {
  fileExplorer.goBack();
}

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.fileExplorer = new FileExplorer();

  // Highlight initial path after everything loads
  setTimeout(() => {
    if (window.fileExplorer) {
      window.fileExplorer.updateTreeSelection(window.fileExplorer.currentPath);
    }
  }, 500);
});
