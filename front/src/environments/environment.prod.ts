export const environment = {
  production: true,
  apiUrl: '/api', // Em produção, usar path relativo (mesmo domínio)
  ftpConfig: {
    host: 'cpanel.gz2.com.br',
    port: 21,
    user: 'gzapicom',
    password: 'tU&EV@Ot@33s5v',
    secure: false,
    rootPath: '/dominios/cdn.gzapi.com.br'
  },
  features: {
    enablePreview: true,
    enableDownload: true,
    enableLinkCopy: true,
    maxFileSize: 100 * 1024 * 1024, // 100MB em bytes
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'mp4', 'mp3', 'zip', 'rar']
  },
  ui: {
    maxTreeDepth: 3,
    itemsPerPage: 50,
    enableDebugMode: false
  }
};