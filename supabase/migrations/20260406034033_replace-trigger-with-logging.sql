-- Create debug log table to see WHAT is failing during trigger
CREATE TABLE IF NOT EXISTS public.debug_logs (
  id serial primary key,
  err_msg text,
  err_detailed text,
  created_at timestamptz default now()
);

-- Completely replace the trigger function with an exception block
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      'user'
    ) ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Capture the error but DO NOT fail the transaction
    INSERT INTO public.debug_logs (err_msg, err_detailed)
    VALUES (SQLERRM, SQLSTATE);
  END;

  RETURN NEW;
END;
$$;
