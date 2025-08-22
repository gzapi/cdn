# File Explorer

Um explorer de arquivos moderno construído 100% em Angular + Material Design com conexão FTP direta do browser.

## Funcionalidades

- 🗂️ **Navegação em árvore**: Sidebar com estrutura hierárquica de diretórios
- 📁 **Listagem de arquivos**: Visualização em grid dos arquivos e pastas
- ⬇️ **Download**: Download direto de arquivos
- 👁️ **Visualização inline**: Preview de imagens, vídeos, PDFs e áudios
- 🔗 **Copiar link**: Gerar link compartilhável para arquivos
- 🎨 **Design responsivo**: Interface moderna com Material Design

## Tecnologias

### Frontend (100% Client-side)
- Angular 17
- Angular Material
- TypeScript
- SCSS
- FTP Client Libraries
- WebDAV Support

## Estrutura do Projeto

```
cdn/
├── back/           # Backend Node.js + Express
│   ├── server.js   # Servidor principal
│   └── package.json
├── front/          # Frontend Angular + Material
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── file-explorer/
│   │   │   │   ├── directory-tree/
│   │   │   │   ├── file-list/
│   │   │   │   └── file-preview/
│   │   │   └── services/
│   │   │       └── file.service.ts
│   │   └── styles.scss
│   ├── angular.json
│   └── package.json
└── README.md
```

## Como executar

### Instalação e Execução

```bash
cd front
npm install
ng serve
```

A aplicação será executada em `http://localhost:4200`

### Configuração FTP

Edite o arquivo `src/environments/environment.ts`:

```typescript
ftpConfig: {
  host: 'seu-servidor-ftp.com',
  port: 21,
  user: 'seu-usuario',
  password: 'sua-senha',
  secure: false,
  rootPath: '/caminho/raiz'
}
```

## Funcionalidades Implementadas

### ✅ Concluído
- Navegação em árvore expansível
- Listagem de arquivos em grid
- Preview de imagens, vídeos e PDFs (simulado)
- Sistema de download (simulado)
- Cópia de links
- Interface responsiva
- Status de conexão FTP
- Configuração por environment

### ⚠️ Limitações Atuais
- **Conexão FTP real**: Browsers têm limitações de segurança para FTP direto
- **Dados simulados**: Atualmente usa dados mock para demonstração
- **CORS**: Pode precisar de proxy ou WebDAV para FTP real

## Cores do tema

O projeto utiliza um esquema de cores customizado baseado na identidade visual:

- Primary: #5e84a4
- Accent: #94accc  
- Background: #f5f5f5

## Funcionalidades de segurança

- ✅ Apenas operações de leitura (navegação, download, visualização)
- ❌ **NÃO** inclui operações de escrita (upload, mkdir, delete)
- 🔒 Validação de tipos MIME
- 🛡️ Sanitização de URLs para preview

## Navegadores suportados

- Chrome/Edge (recomendado)
- Firefox
- Safari

## Desenvolvimento

Para desenvolvimento com hot reload:

```bash
# Backend
cd back && npm run dev

# Frontend  
cd front && ng serve --watch
```