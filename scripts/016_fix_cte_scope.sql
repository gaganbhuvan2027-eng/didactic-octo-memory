-- Replace distribute_credits_to_batch to avoid referencing a CTE across statements
-- This uses direct SELECTs from batch_members for each insert so no CTE scoping issues occur.

CREATE OR REPLACE FUNCTION public.distribute_credits_to_batch(
  p_batch_id uuid,
  p_amount_per_member numeric,
  p_performed_by uuid
)
RETURNS jsonb AS $$
DECLARE
  v_institution_id uuid;
  v_member_count integer;
  v_total_amount numeric;
  v_inst_balance numeric;
BEGIN
  SELECT institution_id INTO v_institution_id FROM public.batches WHERE id = p_batch_id;
  IF v_institution_id IS NULL THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM public.batch_members WHERE batch_id = p_batch_id;
  IF v_member_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'No members in batch');
  END IF;

  v_total_amount := p_amount_per_member * v_member_count;

  SELECT balance INTO v_inst_balance FROM public.institution_credits WHERE institution_id = v_institution_id FOR UPDATE;
  IF v_inst_balance IS NULL OR v_inst_balance < v_total_amount THEN
    RAISE EXCEPTION 'Insufficient institution credits';
  END IF;

  UPDATE public.institution_credits
  SET balance = balance - v_total_amount, updated_at = now()
  WHERE institution_id = v_institution_id;

  INSERT INTO public.institution_credit_transactions (institution_id, delta, reason, metadata)
  VALUES (v_institution_id, -v_total_amount, 'distribute_to_batch', jsonb_build_object('batch_id', p_batch_id, 'per_member', p_amount_per_member, 'performed_by', p_performed_by));

  -- Upsert user credits using direct select
  INSERT INTO public.user_credits (user_id, balance, updated_at)
  SELECT user_id, p_amount_per_member, now() FROM public.batch_members WHERE batch_id = p_batch_id
  ON CONFLICT (user_id)
  DO UPDATE SET balance = public.user_credits.balance + EXCLUDED.balance, updated_at = now();

  -- Insert credit transactions using direct select
  INSERT INTO public.credit_transactions (user_id, delta, reason, metadata)
  SELECT user_id, p_amount_per_member, 'batch_distribution', jsonb_build_object('batch_id', p_batch_id, 'performed_by', p_performed_by)
  FROM public.batch_members WHERE batch_id = p_batch_id;

  RETURN jsonb_build_object('success', true, 'distributed_to', v_member_count, 'total_debited', v_total_amount);

EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.distribute_credits_to_batch(uuid, numeric, uuid) TO authenticated;
