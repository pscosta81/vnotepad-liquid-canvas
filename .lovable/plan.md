

## Plano - Tags com cores, exclusao e Calendario interativo

### 1. Tags com seletor de cor e exclusao

**Adicionar tag (botao +):** Substituir o `prompt()` atual por um dialog/modal customizado que pede o nome da tag e oferece 10 opcoes de cores fortes (vermelho, laranja, amarelo, verde, ciano, azul, roxo, rosa, magenta, lima). A cor escolhida sera aplicada apenas ao icone `#` (Hash) da tag.

**Tags existentes (Geral, Trabalho, Pessoal):** Atribuir cores padrao distintas a cada uma.

**Exclusao de tag:** Adicionar um botao `X` visivel ao passar o mouse sobre cada tag na sidebar.

**Estrutura de dados:** Expandir a interface `Category` para incluir `color: string`. Armazenar como estado local (sem tabela nova no DB, pois as categorias ja sao locais).

**Arquivos:** `Index.tsx` (state e logica), `Sidebar.tsx` (exibir cor no Hash + botao excluir), novo componente `AddTagDialog.tsx`.

### 2. Calendario interativo na area do editor

Baseado na imagem enviada, o calendario ocupara a metade inferior direita do layout desktop (abaixo/dentro do painel do NoteEditor quando nenhuma nota esta selecionada, ou como um painel separado).

**Implementacao:**
- Novo componente `CalendarPanel.tsx` com calendario do mes atual renderizado manualmente (grid 7x5/6)
- **Hover:** Ao passar o mouse sobre um dia, o dia pulsa com brilho neon ciano (animacao CSS `scale` + `box-shadow`)
- **Click:** Ao clicar num dia, ele expande com animacao estilo "minimizar do Macbook" (scale de 1 para ~1.3 com ease-out, depois abre um mini-editor inline)
- **Mini-editor:** Campo de texto para escrever algo naquele dia + 3 botoes de cor (verde, amarelo, vermelho) para categorizar a anotacao
- **Armazenamento:** Nova tabela `calendar_entries` no banco (id, user_id, date, content, color, created_at) com RLS

**Layout desktop:** O calendario sera posicionado na parte inferior direita do layout, visivel sempre. Na pratica, o NoteEditor sera dividido: quando nao ha nota ativa, mostra o calendario centralizado; quando ha nota, o calendario aparece como painel abaixo do editor ou ao lado.

Pela imagem, a area vermelha ocupa ~metade inferior do painel direito. Vou posicionar o calendario como um painel fixo na metade inferior do NoteEditor.

**Arquivos novos:** `src/components/CalendarPanel.tsx`, `src/components/AddTagDialog.tsx`
**Arquivos editados:** `src/pages/Index.tsx`, `src/components/Sidebar.tsx`, `src/components/NoteEditor.tsx`, `src/index.css`
**Migracao:** Tabela `calendar_entries`

### 3. Animacoes CSS novas

```css
/* Calendario: hover pulse */
@keyframes cal-day-pulse {
  0%, 100% { transform: scale(1); box-shadow: none; }
  50% { transform: scale(1.1); box-shadow: 0 0 12px hsla(187,94%,43%,0.4); }
}

/* Calendario: click expand (Macbook minimize) */
@keyframes cal-day-expand {
  0% { transform: scale(1); opacity: 0.8; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
```

### Detalhes tecnicos

**Tabela `calendar_entries`:**
```sql
CREATE TABLE public.calendar_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  content text DEFAULT '',
  color text DEFAULT 'green' CHECK (color IN ('green','yellow','red')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own entries" ON public.calendar_entries
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**10 cores para tags:**
`#EF4444, #F97316, #EAB308, #22C55E, #06B6D4, #3B82F6, #8B5CF6, #EC4899, #F43F5E, #84CC16`

