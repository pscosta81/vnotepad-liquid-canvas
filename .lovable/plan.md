

## Plano de Alteracoes

### 1. Nome do app abaixo do logo na Sidebar
Mover o texto "VnotePad" para baixo do logo (em vez de ao lado), centralizando ambos.

### 2. Campo "Nome" no cadastro (Login.tsx)
Quando `isSignUp = true`, exibir um campo extra para o nome do usuario. Passar o nome via `data.full_name` no `options` do `signUp()`, que ja e capturado pelo trigger `handle_new_user` existente para popular `profiles.display_name`.

### 3. Saudacao com nome do usuario acima do logo na Sidebar
Buscar `display_name` da tabela `profiles` no `AuthProvider` (ou no `Index.tsx`) e exibir acima do logo: "Ola [Nome], Bem vindo a sua agenda pessoal".

### 4. Aviso de email ja cadastrado
O Supabase retorna erro especifico quando o email ja existe. Capturar esse erro no `handleEmailAuth` e exibir mensagem amigavel: "Este email ja esta cadastrado. Tente fazer login."

### 5. Opcao de limpar lixeira
Adicionar botao "Limpar Lixeira" na Sidebar (visivel quando `activeCategory === "trash"` e houver itens). Ao clicar, deletar permanentemente todas as notas com `deleted = true` do banco e do estado local.

### 6. Verificacao geral de funcionamento
Revisar as interacoes apos as alteracoes para garantir consistencia.

---

### Detalhes tecnicos

**Login.tsx:** Adicionar estado `name`, campo input condicional, e passar no signUp:
```ts
await supabase.auth.signUp({
  email, password,
  options: {
    emailRedirectTo: window.location.origin,
    data: { full_name: name }
  }
});
```

**AuthProvider.tsx:** Adicionar `displayName` ao contexto, buscar de `profiles` apos sessao.

**Sidebar.tsx:** Receber `userName` como prop, exibir saudacao acima do logo. Receber `onClearTrash` e `activeCategory` para mostrar botao limpar lixeira.

**Index.tsx:** Buscar display_name do perfil, passar para Sidebar. Implementar `clearTrash` que deleta notas permanentemente.

**Arquivos editados:** `Login.tsx`, `AuthProvider.tsx`, `Sidebar.tsx`, `Index.tsx`

