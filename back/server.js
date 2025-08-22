require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const mime = require("mime-types");
const { Client } = require("basic-ftp");

const app = express();
const PORT = process.env.PORT || 27003;

// Configurações do arquivo .env
const FTP_CONFIG = {
  host: process.env.FTP_HOST,
  port: process.env.FTP_PORT,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  rootPath: process.env.FTP_ROOT_PATH,
};

const SECURITY_CONFIG = {
  maxFileSizeMB: process.env.MAX_FILE_SIZE_MB,
  allowedExtensions: process.env.ALLOWED_EXTENSIONS?.split(","),
  maxTreeDepth: process.env.MAX_TREE_DEPTH,
  defaultRootPath: process.env.FTP_ROOT_PATH,
};

const EXCLUSION_CONFIG = {
  excludeFolders: process.env.EXCLUDE_FOLDERS?.split(",").map(f => f.trim()),
  excludeFiles: process.env.EXCLUDE_FILES?.split(",").map(f => f.trim()),
  excludeExtensions: process.env.EXCLUDE_EXTENSIONS?.split(",").map(e => e.trim())
};

app.use(cors());
app.use(express.json());

// Função para filtrar arquivos e pastas baseado nas configurações de exclusão
function shouldExcludeItem(name, isDirectory) {
  // Verificar se é uma pasta excluída
  if (isDirectory && EXCLUSION_CONFIG.excludeFolders.includes(name)) {
    return true;
  }
  
  // Verificar se é um arquivo específico excluído
  if (!isDirectory && EXCLUSION_CONFIG.excludeFiles.includes(name)) {
    return true;
  }
  
  // Verificar extensão de arquivo
  if (!isDirectory) {
    const ext = path.extname(name).toLowerCase().replace('.', '');
    if (EXCLUSION_CONFIG.excludeExtensions.includes(ext)) {
      return true;
    }
  }
  
  return false;
}

// Função para conectar ao FTP
async function createFtpConnection() {
  const client = new Client();
  try {
    await client.access({
      host: FTP_CONFIG.host,
      port: FTP_CONFIG.port,
      user: FTP_CONFIG.user,
      password: FTP_CONFIG.password,
      secure: false
    });
    return client;
  } catch (error) {
    console.error("Erro ao conectar FTP:", error.message);
    throw error;
  }
}

// Função para listar arquivos via FTP
async function listFtpDirectory(dirPath = "/") {
  const client = await createFtpConnection();
  try {
    console.log(`🔍 Conectando ao path: ${dirPath}`);
    const files = await client.list(dirPath);
    
    // Filtrar arquivos excluídos e mapear para o formato correto
    const fileList = files
      .filter(file => !shouldExcludeItem(file.name, file.isDirectory))
      .map(file => ({
        name: file.name,
        path: path.posix.join(dirPath, file.name),
        isDirectory: file.isDirectory,
        size: file.isDirectory ? null : file.size,
        sizeFormatted: file.isDirectory ? "-" : formatFileSize(file.size),
        modified: file.modifiedAt || new Date(),
        icon: file.isDirectory ? "folder" : getFileIcon(file.name),
        mimeType: file.isDirectory ? null : getCorrectMimeType(file.name)
      }));

    const directories = fileList.filter(item => item.isDirectory).sort((a, b) => a.name.localeCompare(b.name));
    const filesOnly = fileList.filter(item => !item.isDirectory).sort((a, b) => a.name.localeCompare(b.name));

    return {
      currentPath: dirPath,
      parentPath: path.posix.dirname(dirPath),
      items: [...directories, ...filesOnly]
    };
  } finally {
    client.close();
  }
}

// Função para construir árvore FTP (simplificada para não fazer recursão)
async function buildFtpTree(dirPath = "/") {
  const client = await createFtpConnection();
  try {
    const files = await client.list(dirPath);
    const directories = files
      .filter(file => file.isDirectory)
      .filter(dir => !shouldExcludeItem(dir.name, true));
    
    const tree = directories.map(dir => ({
      name: dir.name,
      path: path.posix.join(dirPath, dir.name),
      children: [] // Não expandimos subdiretórios por performance
    }));
    
    return tree.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error(`Erro ao listar ${dirPath}:`, error.message);
    return [];
  } finally {
    client.close();
  }
}

const getFileIcon = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const fileType = mime.lookup(ext) || "";

  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "movie";
  if (fileType.startsWith("audio/")) return "audiotrack";
  if (ext === ".pdf") return "picture_as_pdf";
  if (ext === ".md") return "article";
  if ([".doc", ".docx"].includes(ext)) return "description";
  if ([".xls", ".xlsx"].includes(ext)) return "table_chart";
  if ([".ppt", ".pptx"].includes(ext)) return "slideshow";
  if ([".zip", ".rar", ".7z"].includes(ext)) return "archive";
  if ([".js", ".ts", ".html", ".css", ".json", ".xml"].includes(ext)) return "code";
  if ([".txt", ".log"].includes(ext)) return "article";

  return "insert_drive_file";
};

// Função personalizada para obter MIME type correto
function getCorrectMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  // MIME types personalizados para casos específicos
  const customMimeTypes = {
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.htm': 'text/html'
  };
  
  return customMimeTypes[ext] || mime.lookup(filename) || "application/octet-stream";
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

app.get("/api/files", async (req, res) => {
  try {
    let directoryPath = req.query.path || FTP_CONFIG.rootPath;
    
    console.log(`📂 Listando diretório FTP: ${directoryPath}`);
    
    const result = await listFtpDirectory(directoryPath);
    res.json(result);
  } catch (error) {
    console.error("Erro ao listar diretório FTP:", error.message);
    res.status(500).json({ error: "Erro ao listar diretório: " + error.message });
  }
});

app.get("/api/download/*", async (req, res) => {
  const client = await createFtpConnection();
  try {
    const filePath = req.params[0];
    const fullPath = path.posix.join(FTP_CONFIG.rootPath, filePath).replace(/\\/g, "/");
    
    console.log(`📥 Download FTP: ${fullPath}`);
    
    const filename = path.basename(filePath);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", getCorrectMimeType(filePath));

    await client.downloadTo(res, fullPath);
  } catch (error) {
    console.error("Erro ao baixar arquivo FTP:", error.message);
    res.status(404).json({ error: "Arquivo não encontrado: " + error.message });
  } finally {
    client.close();
  }
});

app.get("/api/view/*", async (req, res) => {
  const client = await createFtpConnection();
  try {
    const filePath = req.params[0];
    const fullPath = path.posix.join(FTP_CONFIG.rootPath, filePath).replace(/\\/g, "/");
    
    console.log(`👁️ Visualizar FTP: ${fullPath}`);
    
    const mimeType = getCorrectMimeType(filePath);
    res.setHeader("Content-Type", mimeType);

    await client.downloadTo(res, fullPath);
  } catch (error) {
    console.error("Erro ao visualizar arquivo FTP:", error.message);
    res.status(404).json({ error: "Arquivo não encontrado: " + error.message });
  } finally {
    client.close();
  }
});

app.get("/api/info/*", async (req, res) => {
  const client = await createFtpConnection();
  try {
    const filePath = req.params[0];
    const fullPath = path.posix.join(FTP_CONFIG.rootPath, filePath).replace(/\\/g, "/");
    
    console.log(`ℹ️ Info FTP: ${fullPath}`);
    
    // Get file listing to find the specific file info
    const dirPath = path.posix.dirname(fullPath);
    const fileName = path.posix.basename(fullPath);
    const files = await client.list(dirPath);
    const fileInfo = files.find(f => f.name === fileName);
    
    if (!fileInfo) {
      return res.status(404).json({ error: "Arquivo não encontrado" });
    }

    res.json({
      name: fileInfo.name,
      path: fullPath,
      size: fileInfo.isDirectory ? null : fileInfo.size,
      sizeFormatted: fileInfo.isDirectory ? "-" : formatFileSize(fileInfo.size),
      modified: fileInfo.modifiedAt || new Date(),
      created: fileInfo.modifiedAt || new Date(),
      isDirectory: fileInfo.isDirectory,
      mimeType: fileInfo.isDirectory ? null : getCorrectMimeType(fileInfo.name),
      extension: path.extname(fileInfo.name),
      icon: fileInfo.isDirectory ? "folder" : getFileIcon(fileInfo.name),
    });
  } catch (error) {
    console.error("Erro ao obter info do arquivo FTP:", error.message);
    res.status(404).json({ error: "Arquivo não encontrado: " + error.message });
  } finally {
    client.close();
  }
});

app.get("/api/tree", async (req, res) => {
  try {
    let treePath = req.query.path || FTP_CONFIG.rootPath;
    console.log(`🌳 Construindo árvore FTP: ${treePath}`);
    
    const tree = await buildFtpTree(treePath);
    const rootName = FTP_CONFIG.host?.replace('cpanel.', '') || 'CDN Server';
    
    res.json({
      root: {
        name: rootName,
        path: treePath,
        children: tree || []
      }
    });
  } catch (error) {
    console.error("Erro ao gerar árvore FTP:", error.message);
    res.status(500).json({ error: "Erro ao gerar árvore de diretórios: " + error.message });
  }
});

// Endpoint para visualizar configurações de exclusão
app.get("/api/exclusions", (req, res) => {
  res.json({
    excludeFolders: EXCLUSION_CONFIG.excludeFolders,
    excludeFiles: EXCLUSION_CONFIG.excludeFiles,
    excludeExtensions: EXCLUSION_CONFIG.excludeExtensions,
    totalExclusions: EXCLUSION_CONFIG.excludeFolders.length + 
                    EXCLUSION_CONFIG.excludeFiles.length + 
                    EXCLUSION_CONFIG.excludeExtensions.length
  });
});

// Endpoint para testar conexão FTP
app.get("/api/test-connection", async (req, res) => {
  try {
    const client = await createFtpConnection();
    await client.list(FTP_CONFIG.rootPath);
    client.close();
    res.json({ connected: true, message: "Conexão FTP estabelecida com sucesso" });
  } catch (error) {
    console.error("Erro ao testar conexão FTP:", error.message);
    res.status(500).json({ connected: false, message: "Falha na conexão FTP: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📁 Diretório raiz: ${SECURITY_CONFIG.defaultRootPath}`);
  console.log(`🔐 Configurações FTP: ${FTP_CONFIG.host}:${FTP_CONFIG.port}`);
  console.log(`📂 FTP Root Path: ${FTP_CONFIG.rootPath}`);
  console.log(`🚫 Exclusões configuradas:`);
  console.log(`   📁 Pastas: ${EXCLUSION_CONFIG.excludeFolders.length} itens`);
  console.log(`   📄 Arquivos: ${EXCLUSION_CONFIG.excludeFiles.length} itens`);
  console.log(`   📎 Extensões: ${EXCLUSION_CONFIG.excludeExtensions.length} itens`);
});
