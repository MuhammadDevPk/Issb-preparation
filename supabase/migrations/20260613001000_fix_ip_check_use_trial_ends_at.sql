-- Update check_ip_trial_status to use trial_ends_at instead of created_at
create or replace function public.check_ip_trial_status(ip_addr text)
returns boolean as $$
begin
  -- Return true (blocked) if any profile with this IP has an expired trial and is not approved
  return exists (
    select 1 from public.profiles
    where ip_address = ip_addr
      and ip_address != ''
      and ip_address != 'unknown'
      and status != 'approved'
      and role = 'student'
      and trial_ends_at is not null
      and trial_ends_at < now()
  );
end;
$$ language plpgsql security definer;
