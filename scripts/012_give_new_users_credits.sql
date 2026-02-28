-- Update the handle_new_user function to give 5 free credits to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.users (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', SPLIT_PART(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  -- Give 10 free credits to new user
  INSERT INTO public.user_credits (user_id, balance, updated_at)
  VALUES (new.id, 10, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Log the credit transaction
  INSERT INTO public.credit_transactions (user_id, delta, reason, metadata)
  VALUES (
    new.id,
    10,
    'welcome_bonus',
    jsonb_build_object('source', 'new_user_signup')
  );

  RETURN new;
END;
$$;

