<?php
// File Explorer PHP Backend - Compatible with PHP 5.3+
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuration
$config = array(
    'base_path' => realpath(__DIR__),
    'allowed_extensions' => array(), // Empty array = allow all extensions not in ignore list
    'max_file_size' => 10 * 1024 * 1024, // 10MB
    'max_depth' => 5,
    'ignore_files' => array(
        // System files
        '.DS_Store', 'Thumbs.db', 'desktop.ini', '.directory',
        // Version control
        '.git', '.gitignore', '.gitattributes', '.gitmodules',
        '.svn', '.hg', '.bzr',
        // IDE files
        '.vscode', '.idea', '.atom', '.brackets.json',
        // Log files
        'error_log', 'access_log',
        // Temporary files
        'node_modules', '.cache', 'cache', 'tmp', 'temp',
        // PHP specific
        'composer.lock', 'vendor',
        // Build/dist folders
        'build', 'dist', 'out', 'css', 'js',
        // Other
        '.env', '.htaccess', '.htpasswd'
    ),
    'ignore_extensions' => array('php'),
    'ignore_patterns' => array(
        '/^\\./', // Hidden files starting with dot
        '/~$/', // Backup files ending with ~
        '/\\.tmp$/i', // Temporary files
        '/\\.log$/i', // Log files
        '/^#.*#$/' // Editor temporary files
    )
);

// Handle AJAX requests
if (isset($_GET['action'])) {
    header('Content-Type: application/json');
    
    switch ($_GET['action']) {
        case 'get_directory_tree':
            echo json_encode(getDirectoryTree($config['base_path'], $config['max_depth'], $config));
            exit;
            
        case 'get_files':
            $path = isset($_GET['path']) ? $_GET['path'] : '/';
            echo json_encode(getFiles($path, $config));
            exit;
            
        case 'get_file_content':
            $file = isset($_GET['file']) ? $_GET['file'] : '';
            echo json_encode(getFileContent($file, $config));
            exit;
            
        case 'download':
            $file = isset($_GET['file']) ? $_GET['file'] : '';
            downloadFile($file, $config);
            exit;
            
        default:
            http_response_code(404);
            echo json_encode(array('error' => 'Action not found'));
            exit;
    }
}

function shouldIgnoreFile($filename, $config) {
    // Check exact matches in ignore_files array
    if (in_array($filename, $config['ignore_files'])) {
        return true;
    }
    
    // Check ignored extensions
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if (isset($config['ignore_extensions']) && in_array($extension, $config['ignore_extensions'])) {
        return true;
    }
    
    // Check patterns
    foreach ($config['ignore_patterns'] as $pattern) {
        if (preg_match($pattern, $filename)) {
            return true;
        }
    }
    
    return false;
}

function getDirectoryTree($basePath, $maxDepth, $config, $currentDepth = 0) {
    if ($currentDepth >= $maxDepth) {
        return array();
    }
    
    $tree = array();
    $items = @scandir($basePath);
    
    if ($items === false) {
        return array();
    }
    
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || shouldIgnoreFile($item, $config)) {
            continue;
        }

        $fullPath = $basePath . DIRECTORY_SEPARATOR . $item;
        
        if (is_dir($fullPath)) {
            $tree[] = array(
                'name' => $item,
                'type' => 'directory',
                'path' => str_replace($basePath, '', $fullPath),
                'children' => getDirectoryTree($fullPath, $maxDepth, $config, $currentDepth + 1)
            );
        }
    }
    
    return $tree;
}

function getFiles($relativePath, $config) {
    $fullPath = $config['base_path'] . DIRECTORY_SEPARATOR . ltrim($relativePath, '/\\');
    $fullPath = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $fullPath);
    
    if (!is_dir($fullPath)) {
        return array('error' => 'Directory not found');
    }
    
    $files = array();
    $items = @scandir($fullPath);
    
    if ($items === false) {
        return array('error' => 'Cannot read directory');
    }
    
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || shouldIgnoreFile($item, $config)) {
            continue;
        }
        
        $itemPath = $fullPath . DIRECTORY_SEPARATOR . $item;
        $relativePath = str_replace($config['base_path'], '', $itemPath);
        
        $fileInfo = array(
            'name' => $item,
            'path' => $relativePath,
            'size' => is_file($itemPath) ? filesize($itemPath) : 0,
            'modified' => filemtime($itemPath),
            'type' => is_dir($itemPath) ? 'directory' : 'file',
            'extension' => is_file($itemPath) ? pathinfo($item, PATHINFO_EXTENSION) : null,
            'icon' => getFileIcon($item, is_dir($itemPath))
        );
        
        $files[] = $fileInfo;
    }
    
    // Sort files: directories first, then files
    usort($files, function($a, $b) {
        // If both are directories or both are files, sort alphabetically
        if ($a['type'] === $b['type']) {
            return strcasecmp($a['name'], $b['name']);
        }
        // Directories come before files
        return ($a['type'] === 'directory') ? -1 : 1;
    });
    
    return $files;
}

function getFileContent($relativePath, $config) {
    $fullPath = $config['base_path'] . DIRECTORY_SEPARATOR . ltrim($relativePath, '/\\');
    $fullPath = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $fullPath);
    
    if (!is_file($fullPath)) {
        return array('error' => 'File not found');
    }
    
    $extension = pathinfo($fullPath, PATHINFO_EXTENSION);
    $size = filesize($fullPath);
    
    if ($size > $config['max_file_size']) {
        return array('error' => 'File too large');
    }
    
    // Check if file type is allowed (if allowed_extensions is not empty)
    if (!empty($config['allowed_extensions']) && !in_array(strtolower($extension), $config['allowed_extensions'])) {
        return array('error' => 'File type not allowed');
    }
    
    $content = '';
    $type = 'text';
    
    if (in_array(strtolower($extension), array('jpg', 'jpeg', 'png', 'gif'))) {
        $type = 'image';
        $content = 'data:image/' . $extension . ';base64,' . base64_encode(file_get_contents($fullPath));
    } elseif ($extension === 'pdf') {
        $type = 'pdf';
        $content = 'data:application/pdf;base64,' . base64_encode(file_get_contents($fullPath));
    } else {
        $content = file_get_contents($fullPath);
    }
    
    return array(
        'content' => $content,
        'type' => $type,
        'size' => $size,
        'extension' => $extension
    );
}

function getFileIcon($filename, $isDirectory) {
    if ($isDirectory) {
        return 'folder';
    }
    
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    
    $icons = array(
        'txt' => 'description',
        'md' => 'description',
        'doc' => 'description',
        'docx' => 'description',
        'pdf' => 'picture_as_pdf',
        'jpg' => 'image',
        'jpeg' => 'image',
        'png' => 'image',
        'gif' => 'image',
        'mp4' => 'video_file',
        'avi' => 'video_file',
        'mp3' => 'audio_file',
        'wav' => 'audio_file',
        'opus' => 'audio_file',
        'zip' => 'archive',
        'rar' => 'archive',
        'html' => 'code',
        'css' => 'code',
        'js' => 'code',
        'php' => 'code',
        'json' => 'code',
        'xml' => 'code'
    );
    
    return isset($icons[$extension]) ? $icons[$extension] : 'insert_drive_file';
}

function downloadFile($relativePath, $config) {
    $fullPath = $config['base_path'] . DIRECTORY_SEPARATOR . ltrim($relativePath, '/\\');
    $fullPath = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $fullPath);
    
    if (!is_file($fullPath)) {
        http_response_code(404);
        echo json_encode(array('error' => 'File not found'));
        return;
    }
    
    $filename = basename($fullPath);
    $size = filesize($fullPath);
    
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . $size);
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    
    readfile($fullPath);
}

// Set HTML header for regular page requests
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Explorer</title>
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body>
    <div class="explorer-container">
        <!-- Toolbar -->
        <div class="app-toolbar">
            <button class="menu-button" onclick="toggleSidenav()">
                <i class="material-icons">menu</i>
            </button>
            <span class="toolbar-title">File Explorer</span>
            <div class="spacer"></div>
            <div class="connection-status">
                <span class="status-indicator online"></span>
                <span class="status-text">Conectado</span>
            </div>
            <button class="refresh-button" onclick="refreshContent()">
                <i class="material-icons">refresh</i>
            </button>
        </div>

        <!-- Main Content Area -->
        <div class="sidenav-container">
            <!-- Sidebar -->
            <div class="sidebar" id="sidebar">
                <div class="directory-tree">
                    <div class="tree-header">
                        <h3>Diretórios</h3>
                    </div>
                    <div class="tree-content" id="directoryTree">
                        <div class="tree-node">
                            <i class="material-icons">home</i>
                            <span onclick="navigateToPath('/')" style="cursor: pointer; color: #2196F3;">Home</span>
                        </div>
                        <!-- Directory tree will be populated here -->
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="main-content">
                <!-- Breadcrumb -->
                <div class="breadcrumb">
                    <button class="back-button" id="backButton" onclick="goBack()" style="display: none;" title="Voltar">
                        <i class="material-icons">arrow_back</i>
                    </button>
                    <span onclick="navigateToPath('/')" class="breadcrumb-item">Home</span>
                    <span class="breadcrumb-separator" id="breadcrumbSeparator" style="display: none;">/</span>
                    <span class="breadcrumb-current" id="currentPath"></span>
                </div>

                <!-- File Grid -->
                <div class="file-grid" id="fileGrid">
                    <!-- Files will be populated here -->
                </div>

                <!-- File Preview -->
                <div class="preview-container" id="previewContainer" style="display: none;">
                    <div class="preview-header">
                        <h3 id="previewTitle">Preview</h3>
                        <button onclick="closePreview()" class="close-preview">
                            <i class="material-icons">close</i>
                        </button>
                    </div>
                    <div class="preview-content" id="previewContent">
                        <!-- Preview content will be shown here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="js/main.js"></script>
    <script src="js/file-operations.js"></script>
    <script src="js/tree-navigation.js"></script>
</body>
</html>