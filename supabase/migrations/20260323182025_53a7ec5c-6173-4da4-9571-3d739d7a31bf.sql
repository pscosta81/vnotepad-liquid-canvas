CREATE TABLE public.calendar_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date NOT NULL,
  content text DEFAULT '',
  color text DEFAULT 'green',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calendar entries" ON public.calendar_entries
  FOR ALL TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX calendar_entries_user_date ON public.calendar_entries (user_id, entry_date);