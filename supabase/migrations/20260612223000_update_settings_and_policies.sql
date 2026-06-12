-- Drop the existing policy
drop policy if exists "Users can select their own profile" on public.profiles;
drop policy if exists "Users can select their own profile and their referrals" on public.profiles;

-- Create updated policy that allows users to select their own profile and profiles they referred
create policy "Users can select their own profile and their referrals"
on public.profiles
for select
using (auth.uid() = id or auth.uid() = referred_by);

-- Alter table app_settings to add max_discount_amount
alter table public.app_settings add column if not exists max_discount_amount integer default 1400;

-- Update the existing settings row if it exists
update public.app_settings
set max_discount_amount = 1400
where id = 1 and max_discount_amount is null;
