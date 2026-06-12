-- Create function to atomically increment referral clicks
create or replace function public.increment_referral_clicks(ref_code text)
returns void as $$
begin
  update public.profiles
  set referral_clicks = referral_clicks + 1
  where referral_code = lower(ref_code);
end;
$$ language plpgsql security definer;

-- Grant execution rights to all roles
grant execute on function public.increment_referral_clicks(text) to anon, authenticated;
