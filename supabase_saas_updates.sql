-- Adicionando campos financeiros e de assinaturas na tabela de Empresas
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mp_customer_id TEXT,
ADD COLUMN IF NOT EXISTS mp_subscription_id TEXT;

-- Atualizar o Trigger de Criação de Usuário para gerar automaticamente o período de Trial (7 dias corridos)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_name TEXT;
  v_company_id UUID;
  v_trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  v_company_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), '');
  v_trial_end := now() + interval '7 days'; -- Limite default de 7 dias
  
  IF v_company_name IS NOT NULL THEN
    -- Try to find existing company
    SELECT id INTO v_company_id FROM public.companies WHERE LOWER(name) = LOWER(v_company_name);
    
    -- Se a empresa NÃO existir, cria ela e configura seu Trial independentemente
    IF v_company_id IS NULL THEN
      INSERT INTO public.companies (name, trial_start, trial_end, subscription_status, plan_id) 
      VALUES (v_company_name, now(), v_trial_end, 'trialing', 'free') 
      RETURNING id INTO v_company_id;
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, company_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), v_company_id);
  
  RETURN NEW;
END;
$$;
