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
        nodeEl.innerHTML = `
                    <i class="material-icons">${
                      item.children && item.children.length > 0
                        ? "folder"
                        : "folder_open"
                    }</i>
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
      const modifiedDate = new Date(file.modified * 1000).toLocaleDateString(
        "pt-BR"
      );

      fileCard.innerHTML = `
                <i class="material-icons ${iconClass}">${file.icon}</i>
                <div class="file-name">${file.name}</div>
                <div class="file-info">
                    ${
                      file.type === "file" ? fileSize + " • " : ""
                    }${modifiedDate}
                </div>
                <div class="file-actions">
                    ${
                      file.type === "file"
                        ? '<button class="file-action-btn" onclick="fileExplorer.previewFile(\'' +
                          file.path +
                          "')\">Visualizar</button>"
                        : ""
                    }
                    <button class="file-action-btn" onclick="fileExplorer.downloadFile('${
                      file.path
                    }')">Download</button>
                </div>
            `;

      fileCard.addEventListener("click", () => {
        if (file.type === "directory") {
          this.navigateToPath(file.path);
        } else {
          this.previewFile(file.path);
        }
      });

      fileGrid.appendChild(fileCard);
    });
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
  }

  selectDirectory(path, element) {
    // Remove previous selection
    document.querySelectorAll(".tree-node.selected").forEach((node) => {
      node.classList.remove("selected");
    });

    // Add selection to current element
    element.classList.add("selected");

    // Navigate to selected directory
    this.navigateToPath(path);
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
      success: "check_circle",
      error: "error",
      warning: "warning",
      info: "info",
    };

    toast.innerHTML = `
            <i class="material-icons toast-icon">${
              icons[type] || icons.info
            }</i>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="material-icons">close</i>
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
});
