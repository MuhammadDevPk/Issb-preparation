-- Create security definer function to check admin role
-- This function runs with creator privileges (bypassing RLS) and prevents infinite recursion.
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Drop existing policies that cause recursion
drop policy if exists "Admins can do everything on profiles" on public.profiles;
drop policy if exists "Users can select their own profile" on public.profiles;
drop policy if exists "Users can update their own profile fields" on public.profiles;
drop policy if exists "Allow admin full control on payment_screenshots" on storage.objects;

-- Re-create profiles policies using the is_admin helper
create policy "Admins can do everything on profiles"
on public.profiles
for all
using (
  public.is_admin(auth.uid())
);

create policy "Users can select their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update their own profile fields"
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and (
    public.is_admin(auth.uid())
    or (
      role = 'student'
      -- Compare the status from the newly uploaded check against existing status to prevent self-approval
      and status = (select status from public.profiles where id = auth.uid())
    )
  )
);

-- Re-create storage policies using the is_admin helper
create policy "Allow admin full control on payment_screenshots"
on storage.objects for all
using (
  bucket_id = 'payment_screenshots'
  and public.is_admin(auth.uid())
);
