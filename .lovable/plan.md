# PRD — VnotePad: Premium Note-Taking PWA

---

## 1. Visao Geral do Produto

**Nome:** VnotePad — Premium Note-Taking  
**Tipo:** Progressive Web App (PWA) multiplataforma  
**Stack:** React + TypeScript + Vite + Tailwind CSS + Lovable Cloud (Supabase)  
**Idioma da interface:** Portugues (pt-BR)  
**Publico-alvo:** Usuarios que desejam um bloco de notas moderno, visualmente sofisticado e acessivel em qualquer dispositivo.

---

## 2. Identidade Visual e Design System

### 2.1 Tema

- **Filosofia:** Dark mode exclusivo com estetica premium inspirada em fibra de carbono e vidro liquido (glassmorphism).
- **Background:** Textura de fibra de carbono via gradientes CSS repetitivos sobre fundo `hsl(0, 0%, 4%)`.

### 2.2 Paleta de Cores


| Token                | Valor HSL                   | Uso                      |
| -------------------- | --------------------------- | ------------------------ |
| `--primary`          | `187 94% 43%` (ciano neon)  | Destaques, glow, acentos |
| `--secondary`        | `160 60% 40%` (verde menta) | Mensagens de sucesso     |
| `--background`       | `0 0% 4%` (preto profundo)  | Fundo geral              |
| `--foreground`       | `210 40% 98%` (branco gelo) | Texto principal          |
| `--muted`            | `215 20% 16%`               | Fundos sutis             |
| `--muted-foreground` | `215 20% 65%`               | Texto secundario         |
| `--destructive`      | `0 84% 60%` (vermelho)      | Acoes destrutivas        |
| `--border`           | `0 0% 100% / 0.06`          | Bordas translucidas      |


### 2.3 Tipografia

- **Fonte principal:** Inter (300-700)
- **Fonte monoespacada:** JetBrains Mono (400-500)
- **Carregamento:** Google Fonts via CSS import

### 2.4 Efeitos Visuais e Animacoes


| Efeito             | Descricao                                                  | Classe CSS                     |
| ------------------ | ---------------------------------------------------------- | ------------------------------ |
| Glass Panel        | Fundo translucido com blur 20px e borda luminosa           | `.glass-panel`                 |
| Neon Breathe       | Box-shadow ciano que pulsa suavemente a cada 3s            | `.neon-glow`                   |
| Logo Float         | Logo flutua verticalmente 6px a cada 3s com glow neon      | `.animate-logo`                |
| Note Enter         | Fade-in + scale 0.95→1 + translateY 8px→0                  | `.animate-note-enter`          |
| Slide Category     | Tags deslizam da esquerda com delay escalonado (30ms cada) | `.animate-slide-category`      |
| Neomorphism Raised | Sombra saliente 3D (botoes e inputs ativos)                | `.btn-raised`, `.input-raised` |
| Neomorphism Inset  | Sombra interna (inputs inativos)                           | `.input-inset`                 |
| Calendar Pulse     | Dia do calendario pulsa com glow ciano no hover            | `.cal-day-hover`               |
| Calendar Expand    | Animacao estilo Macbook minimize ao selecionar dia         | `.cal-day-expanded`            |


### 2.5 Scrollbar Customizada

- Largura 6px, thumb translucido com border-radius 3px, track transparente.

---

## 3. Arquitetura do Aplicativo

### 3.1 Rotas


| Rota       | Componente     | Acesso                       |
| ---------- | -------------- | ---------------------------- |
| `/login`   | `Login.tsx`    | Publico                      |
| `/`        | `Index.tsx`    | Autenticado (ProtectedRoute) |
| `/install` | `Install.tsx`  | Publico                      |
| `*`        | `NotFound.tsx` | Publico                      |


### 3.2 Providers Globais

- `QueryClientProvider` (React Query)
- `AuthProvider` (sessao, usuario, displayName, signOut)
- `TooltipProvider`
- `Toaster` + `Sonner` (notificacoes)

### 3.3 Banco de Dados (3 tabelas)

**Tabela `profiles`:**


| Coluna       | Tipo                 | Descricao             |
| ------------ | -------------------- | --------------------- |
| id           | uuid (PK)            | ID do perfil          |
| user_id      | uuid (FK auth.users) | Referencia ao usuario |
| display_name | text                 | Nome de exibicao      |
| created_at   | timestamptz          | Data de criacao       |
| updated_at   | timestamptz          | Data de atualizacao   |


**Tabela `notes`:**


| Coluna     | Tipo                    | Descricao             |
| ---------- | ----------------------- | --------------------- |
| id         | uuid (PK)               | ID da nota            |
| user_id    | uuid (FK auth.users)    | Dono da nota          |
| title      | text                    | Titulo                |
| content    | text                    | Conteudo              |
| category   | text (default "geral")  | Tag/categoria         |
| favorite   | boolean (default false) | Marcada como favorita |
| deleted    | boolean (default false) | Soft-delete (lixeira) |
| created_at | timestamptz             | Data de criacao       |
| updated_at | timestamptz             | Data de atualizacao   |


**Tabela `calendar_entries`:**


| Coluna     | Tipo                    | Descricao         |
| ---------- | ----------------------- | ----------------- |
| id         | uuid (PK)               | ID da entrada     |
| user_id    | uuid (FK auth.users)    | Dono              |
| entry_date | date                    | Data da anotacao  |
| content    | text                    | Texto da anotacao |
| color      | text (green/yellow/red) | Categoria por cor |
| created_at | timestamptz             | Data de criacao   |


**RLS:** Todas as tabelas possuem Row Level Security ativo. Usuarios autenticados so acessam seus proprios registros (`auth.uid() = user_id`).

---

## 4. Funcionalidades Detalhadas

### 4.1 Autenticacao (`Login.tsx`)

**Metodos de login:**

- Email + Senha (formulario nativo)
- Google OAuth (via Lovable Auth SDK)

**Cadastro (Sign Up):**

- Campos: Nome, Email, Senha (minimo 6 caracteres)
- O campo "Nome" so aparece no modo cadastro
- O nome e enviado como `user_metadata.full_name` e populado automaticamente na tabela `profiles.display_name` via trigger `handle_new_user`
- Apos cadastro, exibe mensagem: "Verifique seu email para confirmar o cadastro"

**Validacoes:**

- Email ja cadastrado: detectado via `identities.length === 0` na resposta do signUp, exibe "Este email ja esta cadastrado. Tente fazer login."
- Erros genericos do Supabase Auth sao exibidos como mensagem de erro

**Design interativo (Neomorphism):**

- Botao "Entrar com Google": relevo saliente (`.btn-raised`)
- Campos Email e Senha: relevo para dentro (`.input-inset`) quando vazios
- Campo Email: transiciona para relevo saliente (`.input-raised`) quando preenchido
- Campo Senha: transiciona para relevo saliente quando preenchido
- Botao "Entrar/Criar Conta": relevo saliente (`.btn-raised`)
- Logo 128x128px com animacao de flutuacao e glow neon

### 4.2 Dashboard Principal (`Index.tsx`)

**Layout Desktop (>= 1024px):**

```text
+------------+----------+------------------+
|            |          |   Note Editor    |
|  Sidebar   |  Note    |                  |
|  (w-64)    |  List    |                  |
|            |  (w-72)  |                  |
|            |          +------------------+
|            |          |    Calendar      |
+------------+----------+------------------+
```

**Layout Tablet (< 1024px):**

- Sidebar acessivel via Sheet (hamburger menu)
- NoteList e NoteEditor lado a lado

**Layout Mobile (< 768px):**

- Navegacao por estados: "list" ou "editor"
- Sidebar via Sheet lateral
- Header fixo com botao de menu ou voltar
- Transicao entre lista e editor

### 4.3 Sidebar (`Sidebar.tsx`)

**Estrutura vertical (de cima para baixo):**

1. **Saudacao personalizada:** "Ola [Nome], Bem vindo a sua agenda pessoal" (visivel apenas se displayName existe)
2. **Logo + Nome:** Logo 128x128px centralizado com animacao, texto "VnotePad" abaixo
3. **Categorias padrao:**
  - Todas as Notas (icone Inbox)
  - Favoritos (icone Star)
  - Lixeira (icone Trash2)
4. **Botao "Limpar Lixeira":** Visivel apenas quando `activeCategory === "trash"` e ha itens na lixeira. Estilo destrutivo.
5. **Divisor horizontal**
6. **Secao Tags:** Header "TAGS" com botao "+" para adicionar
7. **Lista de tags customizaveis:** Com icone `#` colorido, contagem, botao `X` no hover para excluir
8. **Botao "Sair":** Icone LogOut, estilo destrutivo no hover

**Contadores:** Cada categoria e tag exibe a quantidade de notas associadas.

### 4.4 Gerenciamento de Tags (`AddTagDialog.tsx`)

**Criacao de tag:**

- Dialog modal com campo de nome e seletor de 10 cores
- Cores disponiveis: `#EF4444`, `#F97316`, `#EAB308`, `#22C55E`, `#06B6D4`, `#3B82F6`, `#8B5CF6`, `#EC4899`, `#F43F5E`, `#84CC16`
- A cor e aplicada apenas ao icone `#` na sidebar e no toolbar do editor
- Confirmacao via botao "Criar" ou tecla Enter

**Tags padrao (pre-configuradas):**


| Tag      | Cor               |
| -------- | ----------------- |
| Geral    | `#06B6D4` (ciano) |
| Trabalho | `#3B82F6` (azul)  |
| Pessoal  | `#8B5CF6` (roxo)  |


**Exclusao:** Botao `X` visivel no hover. Ao excluir a tag ativa, redireciona para "Todas as Notas".

**Persistencia:** Tags sao armazenadas em estado local (nao persistem no banco entre sessoes).

### 4.5 Lista de Notas (`NoteList.tsx`)

- **Busca:** Campo de pesquisa com icone de lupa, filtra por titulo e conteudo
- **Botao "Nova Nota":** Cria nota na categoria ativa (ou "geral" se em All/Favorites/Trash)
- **Cards de notas:** Titulo truncado, preview do conteudo truncado, data de atualizacao
- **Nota ativa:** Destacada com borda e fundo ciano
- **Estado vazio:** Mensagem "Nenhuma nota encontrada"
- **Animacao:** Cada card entra com delay escalonado (40ms)

### 4.6 Editor de Notas (`NoteEditor.tsx`)

**Toolbar:**

- Tag ativa com cor correspondente (icone + texto coloridos)
- Data de atualizacao
- Botao exportar (.txt)
- Botao favoritar (estrela, amarela quando ativo)
- Botao excluir (move para lixeira via soft-delete)

**Area de edicao:**

- Campo de titulo (sem borda, texto grande)
- Textarea com auto-resize dinamico
- Salvamento automatico no banco a cada alteracao

**Comportamento ao trocar de categoria:**

- O editor e limpo (`activeNoteId = null`) ao clicar em qualquer tag/categoria na sidebar

**Estado vazio (nenhuma nota selecionada):**

- Mensagem centralizada "Nenhuma nota selecionada"
- Calendario visivel abaixo

**Exportacao:** Gera arquivo `.txt` com titulo e conteudo para download.

### 4.7 Calendario Interativo (`CalendarPanel.tsx`)

**Posicao:** Abaixo do editor de notas (sempre visivel no desktop).

**Navegacao:** Botoes de seta para mes anterior/proximo. Exibe nome do mes + ano.

**Grid de dias:**

- 7 colunas (Dom-Sab), layout responsivo
- Dia atual destacado com fundo ciano
- Dias com anotacoes possuem borda colorida (verde/amarelo/vermelho) e indicador de ponto

**Interacoes:**

- **Hover:** Dia pulsa com glow ciano (animacao `cal-day-pulse`)
- **Click:** Dia expande com efeito Macbook minimize (`cal-day-expand`), abre editor inline
- **Click novamente:** Fecha o editor

**Editor inline do dia:**

- Textarea para anotacao
- 3 botoes de cor (verde, amarelo, vermelho) para categorizar
- Botoes "Cancelar" e "Salvar"
- Dados salvos via upsert no banco (`calendar_entries`)

### 4.8 Lixeira

- Notas excluidas recebem `deleted = true` (soft-delete)
- Visiveis apenas na categoria "Lixeira"
- **Limpar Lixeira:** Deleta permanentemente todas as notas com `deleted = true` do banco

### 4.9 Perfil e Saudacao

- O `AuthProvider` busca `display_name` da tabela `profiles` apos autenticacao
- O nome e exibido na sidebar como saudacao personalizada
- O trigger `handle_new_user` popula automaticamente o perfil no cadastro

---

## 5. PWA (Progressive Web App)

### 5.1 Configuracao

- **Plugin:** `vite-plugin-pwa` com `registerType: "autoUpdate"`
- **Service Worker:** Workbox com cache de JS, CSS, HTML, imagens, fontes
- **Manifest:** Nome, descricao, icones (192x192, 512x512, maskable), cores do tema, orientacao portrait

### 5.2 Meta Tags (index.html)

- `theme-color: #0a0a0a`
- `apple-mobile-web-app-capable: yes`
- `apple-mobile-web-app-status-bar-style: black-translucent`
- `apple-touch-icon`
- Open Graph e Twitter Card

### 5.3 Pagina de Instalacao (`/install`)

- Detecta `beforeinstallprompt` para Chrome/Android e oferece botao "Instalar Agora"
- Instrucoes passo-a-passo para iOS/Safari
- Detecta se ja esta instalado (`display-mode: standalone`)
- Design consistente com glass panels e animacoes

### 5.4 Responsividade

- Mobile-first com breakpoints via `useIsMobile()` hook
- Sidebar colapsavel via Sheet em telas < 1024px
- Navegacao por estados (list/editor) em mobile
- `max-scale=1.0, user-scalable=no` para comportamento nativo

---

## 6. Seguranca

- **RLS em todas as tabelas:** Cada usuario so acessa seus proprios dados
- **Autenticacao obrigatoria:** Rota principal protegida via `ProtectedRoute`
- **Confirmacao de email:** Usuarios devem verificar email antes de acessar (sem auto-confirm)
- **Nenhum dado sensivel no client-side:** Roles e permissoes validados server-side

---

## 7. Mapa de Arquivos do Projeto

```text
src/
├── App.tsx                    # Rotas e providers
├── main.tsx                   # Entry point
├── index.css                  # Tema, animacoes, efeitos
├── pages/
│   ├── Index.tsx              # Dashboard principal
│   ├── Login.tsx              # Autenticacao
│   ├── Install.tsx            # Instalacao PWA
│   └── NotFound.tsx           # 404
├── components/
│   ├── AuthProvider.tsx       # Contexto de autenticacao
│   ├── Sidebar.tsx            # Barra lateral
│   ├── NoteList.tsx           # Lista de notas
│   ├── NoteEditor.tsx         # Editor de notas
│   ├── CalendarPanel.tsx      # Calendario interativo
│   ├── AddTagDialog.tsx       # Dialog de nova tag
│   └── ui/                    # Componentes shadcn/ui
├── hooks/
│   ├── use-mobile.tsx         # Deteccao de mobile
│   └── use-toast.ts           # Hook de notificacoes
├── integrations/
│   ├── supabase/client.ts     # Cliente Supabase (auto-gerado)
│   ├── supabase/types.ts      # Tipos do banco (auto-gerado)
│   └── lovable/index.ts       # SDK Lovable
├── assets/
│   └── logo.png               # Logo do app
└── lib/
    └── utils.ts               # Utilitarios (cn)

public/
├── icon-192x192.png           # Icone PWA 192px
├── icon-512x512.png           # Icone PWA 512px
└── apple-touch-icon.png       # Icone Apple

supabase/
├── config.toml                # Configuracao do projeto
└── migrations/                # Migracoes SQL
```

---

## 8. Limitacoes Conhecidas

1. **Tags nao persistem no banco:** As tags customizadas sao armazenadas em estado local React e sao perdidas ao recarregar a pagina. Apenas as 3 tags padrao (Geral, Trabalho, Pessoal) sao restauradas.
2. **Sem edicao de perfil:** O usuario nao pode alterar seu nome de exibicao apos o cadastro.
3. **Sem notificacoes push:** O calendario nao envia lembretes.
4. **Sem colaboracao:** Notas sao individuais, sem compartilhamento.
5. **Sem formatacao rica:** O editor e texto puro, sem markdown ou rich text.