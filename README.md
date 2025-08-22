# File Explorer PHP

Sistema de exploração de arquivos desenvolvido em PHP com interface moderna e responsiva.

## Características

- Interface limpa e moderna inspirada no Angular Material
- Navegação por árvore de diretórios
- Visualização de arquivos em grid
- Preview de diferentes tipos de arquivos (imagens, texto, PDF)
- Sistema de busca
- Operações de arquivo (upload, download, renomear, excluir)
- Design responsivo para dispositivos móveis
- Drag & drop para upload de arquivos

## Estrutura do Projeto

```
php-version/
├── css/
│   ├── styles.css          # Estilos principais
│   └── components.css      # Estilos dos componentes
├── js/
│   ├── main.js            # JavaScript principal
│   ├── file-operations.js # Operações com arquivos
│   └── tree-navigation.js # Navegação e busca
├── index.php              # Arquivo principal
└── README.md              # Este arquivo
```

## Requisitos

- PHP 7.4 ou superior
- Servidor web (Apache, Nginx, etc.)
- Permissões de leitura/escrita nos diretórios

## Instalação

1. Clone ou faça download dos arquivos para seu servidor web
2. Configure as permissões necessárias para os diretórios
3. Acesse através do navegador

## Configuração

As configurações principais estão no arquivo `index.php`:

- `base_path`: Diretório base para navegação
- `allowed_extensions`: Extensões de arquivo permitidas
- `max_file_size`: Tamanho máximo de arquivo (em bytes)
- `max_depth`: Profundidade máxima da árvore de diretórios

## Funcionalidades

### Navegação
- Clique nos diretórios na árvore lateral para navegar
- Use o breadcrumb para voltar a diretórios anteriores
- Duplo clique em pastas para navegar

### Visualização de Arquivos
- Clique em "Visualizar" para ver o conteúdo do arquivo
- Suporte para imagens, texto, PDF e outros formatos
- Preview inline sem necessidade de download

### Busca
- Use a barra de busca na árvore lateral
- Busca por nome de arquivo
- Resultados clickáveis para navegação rápida

### Operações com Arquivos
- Upload via drag & drop ou botão
- Download de arquivos individuais
- Renomeação e exclusão (com confirmação)
- Criação de novas pastas

## Personalização

### Cores e Tema
Edite o arquivo `css/styles.css` para personalizar:
- Cores principais (`--primary-color`)
- Backgrounds e bordas
- Espaçamentos e tipografia

### Ícones
O projeto usa Google Material Icons. Para trocar ícones:
1. Encontre o ícone desejado em https://fonts.google.com/icons
2. Substitua o nome do ícone no código

## Segurança

- Validação de tipos de arquivo permitidos
- Verificação de tamanho máximo de arquivo
- Proteção contra directory traversal
- Sanitização de nomes de arquivo

## Compatibilidade

- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Responsivo para dispositivos móveis
- PHP 7.4+

## Licença

Este projeto é de código aberto e pode ser usado livremente.