-- The outbid rule moves from 20% to 30% above the leader.
create or replace function public.confirm_bid(
  p_bid uuid,
  p_payment_intent text,
  p_increment integer,
  p_rate numeric default 0.3,
  p_round integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bid public.bids;
  v_leader public.bids;
  v_has_leader boolean;
  v_required integer;
begin
  select * into v_bid from public.bids where id = p_bid for update;
  if not found then
    return jsonb_build_object('outcome', 'missing');
  end if;
  if v_bid.status <> 'pending' then
    return jsonb_build_object('outcome', 'noop');
  end if;

  perform pg_advisory_xact_lock(hashtext('spot:' || v_bid.spot_id));

  select * into v_leader from public.bids
    where spot_id = v_bid.spot_id and status = 'active'
    for update;
  v_has_leader := found;

  if v_has_leader then
    v_required := (ceil(greatest(v_leader.amount + p_increment, v_leader.amount * (1 + p_rate)) / p_round) * p_round)::integer;
  end if;

  if v_has_leader and v_bid.amount < v_required then
    update public.bids
      set status = 'outbid', stripe_payment_intent = p_payment_intent, confirmed_at = now(), outbid_at = now()
      where id = v_bid.id;
    return jsonb_build_object('outcome', 'late');
  end if;

  if v_has_leader then
    update public.bids set status = 'outbid', outbid_at = now() where id = v_leader.id;
  end if;

  update public.bids
    set status = 'active', stripe_payment_intent = p_payment_intent, confirmed_at = now()
    where id = v_bid.id;

  return jsonb_build_object('outcome', 'leading', 'displaced', case when v_has_leader then v_leader.id end);
end;
$$;
