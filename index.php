<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once 'functions.php';
header('Content-Type: text/html; charset=utf-8');
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CDN GZAPI</title>
    <link rel="icon" type="image/x-icon" href="images/favicon.ico">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body>
    <div class="explorer-container">
        <!-- Toolbar -->
        <div class="app-toolbar">
            <button class="menu-button" onclick="toggleSidenav()">
                <i class="fa-solid fa-bars"></i>
            </button>
            <span class="toolbar-title"><img src="images/logo_branca.png" alt="File Explorer" style="height: 40px; vertical-align: middle;"></span>
            <div class="spacer"></div>
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
                            <i class="fa-solid fa-house"></i>
                            <span onclick="navigateToPath('/')" style="cursor: pointer;">Home</span>
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
                        <i class="fa-solid fa-chevron-left"></i>
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
                            <i class="fa-solid fa-xmark"></i>
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
    <script src="js/tree-navigation.js"></script>
</body>
</html>