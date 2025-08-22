<?php
// File Explorer PHP Backend
header('Content-Type: text/html; charset=utf-8');

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
        '/^\./', // Hidden files starting with dot
        '/~$/', // Backup files ending with ~
        '/\.tmp$/i', // Temporary files
        '/\.log$/i', // Log files
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
            
        case 'get_properties':
            $item = isset($_GET['item']) ? $_GET['item'] : '';
            echo json_encode(getItemProperties($item, $config));
            exit;
            
        case 'search_files':
            $query = isset($_GET['query']) ? $_GET['query'] : '';
            $path = isset($_GET['path']) ? $_GET['path'] : '/';
            echo json_encode(searchFiles($query, $path, $config));
            exit;
            
        case 'check_permissions':
            $item = isset($_GET['item']) ? $_GET['item'] : '';
            echo json_encode(checkPermissions($item, $config));
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
            $relativePath = str_replace($basePath, '', $fullPath);
            $relativePath = str_replace(DIRECTORY_SEPARATOR, '/', $relativePath);
            if (!$relativePath || $relativePath[0] !== '/') {
                $relativePath = '/' . ltrim($relativePath, '/');
            }
            
            $tree[] = array(
                'name' => $item,
                'type' => 'directory',
                'path' => $relativePath,
                'children' => getDirectoryTree($fullPath, $maxDepth, $config, $currentDepth + 1)
            );
        }
    }
    
    return $tree;
}

function getFiles($relativePath, $config) {
    // Normalize the relative path first
    $relativePath = ltrim($relativePath, '/\\');
    $relativePath = str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
    
    // Build the full path
    if (empty($relativePath)) {
        $fullPath = $config['base_path'];
    } else {
        $fullPath = $config['base_path'] . DIRECTORY_SEPARATOR . $relativePath;
    }
    
    // Normalize the full path
    $fullPath = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $fullPath);
    $fullPath = rtrim($fullPath, DIRECTORY_SEPARATOR);
    
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
        $isDirectory = is_dir($itemPath);
        
        $fileInfo = array(
            'name' => $item,
            'path' => $relativePath,
            'size' => is_file($itemPath) ? filesize($itemPath) : 0,
            'modified' => filemtime($itemPath),
            'type' => $isDirectory ? 'directory' : 'file',
            'extension' => is_file($itemPath) ? pathinfo($item, PATHINFO_EXTENSION) : null,
            'icon' => getFileIcon($item, $isDirectory),
            'item_count' => $isDirectory ? countDirectoryItems($itemPath, $config) : null
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
    // Normalize the relative path first
    $relativePath = ltrim($relativePath, '/\\');
    $relativePath = str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
    
    // Build the full path
    $fullPath = $config['base_path'] . DIRECTORY_SEPARATOR . $relativePath;
    
    // Normalize the full path
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
    } elseif (in_array(strtolower($extension), array('mp4', 'avi', 'mov', 'wmv'))) {
        $type = 'video';
        $content = 'data:video/' . $extension . ';base64,' . base64_encode(file_get_contents($fullPath));
    } elseif (in_array(strtolower($extension), array('mp3', 'wav', 'ogg'))) {
        $type = 'audio';
        $content = 'data:audio/' . $extension . ';base64,' . base64_encode(file_get_contents($fullPath));
    } elseif (in_array(strtolower($extension), array('doc', 'docx'))) {
        $type = 'document';
        $content = 'data:application/' . ($extension === 'docx' ? 'vnd.openxmlformats-officedocument.wordprocessingml.document' : 'msword') . ';base64,' . base64_encode(file_get_contents($fullPath));
    } elseif (in_array(strtolower($extension), array('odt', 'ods', 'odp', 'odg', 'odf'))) {
        $type = 'document';
        $mimeTypes = array(
            'odt' => 'vnd.oasis.opendocument.text',
            'ods' => 'vnd.oasis.opendocument.spreadsheet',
            'odp' => 'vnd.oasis.opendocument.presentation',
            'odg' => 'vnd.oasis.opendocument.graphics',
            'odf' => 'vnd.oasis.opendocument.formula'
        );
        $content = 'data:application/' . $mimeTypes[strtolower($extension)] . ';base64,' . base64_encode(file_get_contents($fullPath));
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

function countDirectoryItems($fullPath, $config) {
    $items = @scandir($fullPath);
    
    if ($items === false) {
        return 0;
    }
    
    $count = 0;
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || shouldIgnoreFile($item, $config)) {
            continue;
        }
        $count++;
    }
    
    return $count;
}

function getFileIcon($filename, $isDirectory) {
    if ($isDirectory) {
        return 'fa-solid fa-folder';
    }
    
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    
    $icons = array(
        'avi'   => 'fa-solid fa-file-video',
        'css'   => 'fa-solid fa-file-code',
        'doc'   => 'fa-solid fa-file-word',
        'docx'  => 'fa-solid fa-file-word',
        'gif'   => 'fa-solid fa-file-image',
        'html'  => 'fa-solid fa-file-code',
        'ico'   => 'fa-solid fa-file-image',
        'jpeg'  => 'fa-solid fa-file-image',
        'jpg'   => 'fa-solid fa-file-image',
        'js'    => 'fa-solid fa-file-code',
        'json'  => 'fa-solid fa-file-code',
        'md'    => 'fa-solid fa-file-lines',
        'mp3'   => 'fa-solid fa-file-audio',
        'mp4'   => 'fa-solid fa-file-video',
        'opus'  => 'fa-solid fa-file-audio',
        'pdf'   => 'fa-solid fa-file-pdf',
        'php'   => 'fa-solid fa-file-code',
        'png'   => 'fa-solid fa-file-image',
        'rar'   => 'fa-solid fa-file-archive',
        'txt'   => 'fa-solid fa-file-lines',
        'wav'   => 'fa-solid fa-file-audio',
        'xml'   => 'fa-solid fa-file-code',
        'zip'   => 'fa-solid fa-file-archive'
    );

    return isset($icons[$extension]) ? $icons[$extension] : 'fa-solid fa-file';
}

function formatFileSize($bytes) {
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}

function downloadFile($relativePath, $config) {
    // Normalize the relative path first
    $relativePath = ltrim($relativePath, '/\\');
    $relativePath = str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
    
    // Build the full path
    $fullPath = $config['base_path'] . DIRECTORY_SEPARATOR . $relativePath;
    
    // Normalize the full path
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

function getItemProperties($relativePath, $config) {
    $fullPath = $config['base_path'] . DIRECTORY_SEPARATOR . ltrim($relativePath, '/\\');
    
    if (!file_exists($fullPath)) {
        return array('error' => 'Item not found');
    }
    
    $properties = array(
        'name' => basename($fullPath),
        'path' => $relativePath,
        'size' => is_file($fullPath) ? filesize($fullPath) : 0,
        'modified' => date('Y-m-d H:i:s', filemtime($fullPath)),
        'type' => is_dir($fullPath) ? 'directory' : 'file',
        'permissions' => substr(sprintf('%o', fileperms($fullPath)), -4),
        'readable' => is_readable($fullPath),
        'writable' => is_writable($fullPath),
        'executable' => is_executable($fullPath)
    );
    
    if (is_file($fullPath)) {
        $properties['extension'] = pathinfo($fullPath, PATHINFO_EXTENSION);
        $properties['size_formatted'] = formatFileSize($properties['size']);
    }
    
    return $properties;
}

function searchFiles($query, $searchPath, $config) {
    if (empty($query) || strlen(trim($query)) < 2) {
        return array();
    }
    
    $basePath = $config['base_path'] . DIRECTORY_SEPARATOR . ltrim($searchPath, '/\\');
    
    if (!is_dir($basePath)) {
        return array('error' => 'Search path not found');
    }
    
    $results = array();
    $query = strtolower(trim($query));
    
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($basePath, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    
    foreach ($iterator as $file) {
        $filename = $file->getFilename();
        
        if (stripos($filename, $query) !== false) {
            $relativePath = str_replace($config['base_path'], '', $file->getPathname());
            $relativePath = str_replace('\\', '/', $relativePath);
            
            $results[] = array(
                'name' => $filename,
                'path' => $relativePath,
                'type' => $file->isDir() ? 'directory' : 'file',
                'size' => $file->isFile() ? $file->getSize() : 0,
                'modified' => $file->getMTime()
            );
        }
        
        if (count($results) >= 50) {
            break; // Limit results
        }
    }
    
    return $results;
}

function checkPermissions($relativePath, $config) {
    $fullPath = $config['base_path'] . DIRECTORY_SEPARATOR . ltrim($relativePath, '/\\');
    
    if (!file_exists($fullPath)) {
        return array('error' => 'Item not found');
    }
    
    return array(
        'readable' => is_readable($fullPath),
        'writable' => is_writable($fullPath),
        'executable' => is_executable($fullPath),
        'permissions' => substr(sprintf('%o', fileperms($fullPath)), -4)
    );
}
?>