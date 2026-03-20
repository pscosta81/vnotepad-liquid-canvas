

## Plano de Alteracoes

### 1. Efeitos de relevo interativos na pagina de Login

**Botao "Entrar com Google":** Aplicar `box-shadow` saliente (relevo para fora) com sombra clara em cima e escura embaixo, simulando um botao 3D elevado.

**Campos Email e Senha:** Aplicar `box-shadow: inset` (relevo para dentro/profundidade). Quando o usuario digitar no campo email (valor nao vazio), o campo transiciona de `inset` para shadow saliente com animacao suave via `transition-all`. O campo senha mantem o inset.

**Botao "Entrar":** Relevo saliente similar ao botao Google.

Implementacao via classes CSS em `index.css` (`.input-inset`, `.input-raised`, `.btn-raised`) com transicoes.

### 2. Aumento do logo para 128x128 (w-32 h-32)

Atualizar de `w-20 h-20` para `w-32 h-32` em:
- `src/pages/Login.tsx` (linha 71)
- `src/components/Sidebar.tsx` (linha 33)

### 3. Transformacao em PWA

- Instalar `vite-plugin-pwa` via package.json
- Configurar `VitePWA` em `vite.config.ts` com manifest (nome, cores, icones em multiplos tamanhos), `navigateFallbackDenylist: [/^\/~oauth/]`
- Copiar o logo para `public/` em tamanhos 192x192 e 512x512 (usando o asset existente `src/assets/logo.png`)
- Adicionar meta tags PWA no `index.html` (theme-color, apple-touch-icon, viewport)
- Criar pagina `/install` com instrucoes de instalacao e botao para trigger do prompt `beforeinstallprompt`
- Garantir compatibilidade com Chrome (Android) e Safari (iOS) com instrucoes especificas

### Arquivos modificados
- `src/pages/Login.tsx` - relevo interativo + logo 128px
- `src/components/Sidebar.tsx` - logo 128px
- `src/index.css` - classes CSS de relevo
- `vite.config.ts` - plugin PWA
- `index.html` - meta tags PWA
- `package.json` - dependencia vite-plugin-pwa

### Arquivos novos
- `src/pages/Install.tsx` - pagina de instalacao PWA
- `public/icon-192x192.png`, `public/icon-512x512.png` - icones PWA (copiados do logo)

