# Sistema de Exclusão de Arquivos

Este sistema permite filtrar automaticamente pastas, arquivos específicos e extensões indesejadas na listagem do explorador de arquivos FTP.

## Configuração via Environment (.env)

Adicione as seguintes variáveis no arquivo `.env`:

```env
# Configurações de exclusão (separados por vírgula)
# Pastas a serem excluídas
EXCLUDE_FOLDERS=.well-known,.cpanel,.trash,.htpasswds,.spamassassin,.sitepad,.softaculous,.koality,.cagefs,.caldav,.cl.selector,logs,lscache,mail,public_ftp,ssl,tmp,www,etc

# Arquivos específicos a serem excluídos
EXCLUDE_FILES=.bash_logout,.bash_profile,.bashrc,.lastlogin,.htaccess,access-logs,.spamassassinboxenable,.spamassassinenable,.wp-toolkit-identifier,.imunify_patch_id,.myimunify_id

# Extensões de arquivos a serem excluídas (sem o ponto)
EXCLUDE_EXTENSIONS=log,tmp,cache,bak,old,swp
```

## Como Personalizar

### Adicionar/Remover Pastas
Para excluir uma pasta específica, adicione seu nome na variável `EXCLUDE_FOLDERS`:
```env
EXCLUDE_FOLDERS=pasta1,pasta2,minha_pasta_privada
```

### Adicionar/Remover Arquivos
Para excluir arquivos específicos, adicione na variável `EXCLUDE_FILES`:
```env
EXCLUDE_FILES=config.php,database.sql,arquivo_secreto.txt
```

### Adicionar/Remover Extensões
Para excluir por extensão, adicione na variável `EXCLUDE_EXTENSIONS` (sem o ponto):
```env
EXCLUDE_EXTENSIONS=log,tmp,backup,sql
```

## API Endpoint

Visualize as configurações atuais de exclusão:
```
GET /api/exclusions
```

Retorna:
```json
{
  "excludeFolders": ["pasta1", "pasta2"],
  "excludeFiles": ["arquivo1.txt", "arquivo2.log"],
  "excludeExtensions": ["tmp", "bak"],
  "totalExclusions": 5
}
```

## Exemplos de Uso

### Ocultar Pastas do Sistema
```env
EXCLUDE_FOLDERS=.git,.svn,node_modules,.vscode
```

### Ocultar Arquivos de Configuração
```env
EXCLUDE_FILES=.env,.htaccess,wp-config.php,database.php
```

### Ocultar Arquivos Temporários
```env
EXCLUDE_EXTENSIONS=tmp,log,cache,bak,swp,~
```

### Configuração Completa para WordPress
```env
EXCLUDE_FOLDERS=wp-admin,wp-includes,.well-known
EXCLUDE_FILES=wp-config.php,.htaccess,error_log
EXCLUDE_EXTENSIONS=log,tmp,bak
```

## Notas Importantes

1. **Case Sensitive**: Os nomes são sensíveis a maiúsculas/minúsculas
2. **Separação por Vírgula**: Use vírgulas sem espaços para separar itens
3. **Reinicialização**: É necessário reiniciar o servidor após alterar o .env
4. **Performance**: O filtro é aplicado no backend, melhorando a performance
5. **Flexibilidade**: Cada categoria (pastas, arquivos, extensões) funciona independentemente

## Status Atual

✅ **36 exclusões configuradas:**
- 📁 **19 pastas** (.well-known, .cpanel, .trash, etc.)
- 📄 **11 arquivos** (.bash_logout, .htaccess, etc.)  
- 📎 **6 extensões** (log, tmp, cache, bak, old, swp)