-- Atualizar o trigger para suportar convites (company_id direto nos metadados)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_name TEXT;
  v_company_id UUID;
BEGIN
  -- Se o usuário foi convidado com um company_id direto (convite por e-mail)
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  -- Se não tem company_id direto, tenta pelo nome da empresa
  IF v_company_id IS NULL THEN
    v_company_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), '');

    IF v_company_name IS NOT NULL THEN
      SELECT id INTO v_company_id FROM public.companies WHERE LOWER(name) = LOWER(v_company_name);

      IF v_company_id IS NULL THEN
        INSERT INTO public.companies (name, trial_start, trial_end, subscription_status, plan_id)
        VALUES (v_company_name, now(), now() + interval '7 days', 'trialing', 'free')
        RETURNING id INTO v_company_id;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_company_id
  );

  RETURN NEW;
END;
$$;
