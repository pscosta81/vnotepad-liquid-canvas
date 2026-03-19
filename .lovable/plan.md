

## Plano de Alteracoes - VnotePad

### 1. Brilho neon animado nos paineis glass

Adicionar uma animacao CSS de `box-shadow` neon ciano (cor do logo) nos tres paineis `.glass-panel`, com efeito de fade in/fade out continuo usando keyframes `glow-pulse`. O brilho sera aplicado como uma classe `neon-glow` nos componentes Sidebar, NoteList e NoteEditor.

### 2. Pagina de Login com autenticacao

- Criar pagina `src/pages/Login.tsx` com duas opcoes: Google Auth e Email/Senha
- Ativar Lovable Cloud (Supabase) para autenticacao
- Criar tabela `profiles` vinculada a `auth.users`
- Vincular notas ao `user_id` com tabela `notes` no banco
- Proteger rota `/` para usuarios autenticados, redirecionar para `/login`
- Criar componente `AuthProvider` com contexto de sessao

**Arquivos novos:** `Login.tsx`, `AuthProvider.tsx`, migrations para `profiles` e `notes`
**Arquivos editados:** `App.tsx` (rotas), `Index.tsx` (carregar notas do DB)

### 3. Exportar nota como .txt

Adicionar botao "Exportar" na toolbar do `NoteEditor.tsx` que gera e baixa um arquivo `.txt` com titulo e conteudo da nota usando `Blob` + `URL.createObjectURL`.

### 4. Icone/Logo 80x80 com animacao

- Aumentar o logo para `w-20 h-20` na Sidebar e na pagina de Login
- Adicionar animacao CSS de movimento suave (flutuacao vertical com `translateY`) combinada com brilho neon pulsante ao redor do icone

### 5. Layout responsivo (celular, tablet, PC)

- **Mobile (<768px):** Layout em coluna unica. Sidebar vira menu hamburguer (sheet/drawer). NoteList ocupa tela cheia. NoteEditor abre como tela separada.
- **Tablet (768-1024px):** Sidebar colapsavel. NoteList + NoteEditor lado a lado.
- **Desktop (>1024px):** Layout atual com 3 colunas.

Usar estado de navegacao para alternar entre lista e editor no mobile. Usar o componente `Sheet` existente para a sidebar mobile.

---

### Detalhes tecnicos

**CSS (index.css):**
```css
@keyframes neon-breathe {
  0%, 100% { box-shadow: 0 0 8px hsla(187,94%,43%,0.15), 0 0 20px hsla(187,94%,43%,0.08); }
  50% { box-shadow: 0 0 16px hsla(187,94%,43%,0.35), 0 0 40px hsla(187,94%,43%,0.15); }
}

@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
```

**Supabase tables:**
- `profiles(id uuid PK, user_id uuid FK auth.users, display_name text, created_at timestamptz)`
- `notes(id uuid PK, user_id uuid FK auth.users, title text, content text, category text, favorite boolean, deleted boolean, created_at timestamptz, updated_at timestamptz)` com RLS por `user_id = auth.uid()`

**Export .txt:**
```ts
const blob = new Blob([`${note.title}\n\n${note.content}`], { type: 'text/plain' });
const url = URL.createObjectURL(blob);
// trigger download via anchor element
```

**Responsivo:** Breakpoints `md:` (768px) e `lg:` (1024px) do Tailwind. Estado `mobileView: 'list' | 'editor'` no Index.tsx para navegacao mobile.

