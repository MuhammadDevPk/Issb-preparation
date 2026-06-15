-- Fix RLS: Allow students to resubmit payment (update status back to pending & screenshot url)
-- Root cause: Previous policy prevented students from changing their own status column at all,
-- which blocked rejected students from resubmitting their payment screenshot.

-- Drop the old restrictive update policy
drop policy if exists "Users can update their own profile fields" on public.profiles;

-- Create a more permissive update policy:
-- Students can update their own row but ONLY if:
--   (a) they are not changing their role, AND
--   (b) the new status value is either keeping the same status OR resetting to 'pending' (for resubmit)
--   (c) admins can always update anything
create policy "Users can update their own profile fields"
on public.profiles
for update
using (auth.uid() = id and deleted_at is null)
with check (
  auth.uid() = id
  and (
    -- Admins can change anything
    public.is_admin(auth.uid())
    -- Students can update but must stay as 'student' role, and can only set status to 'pending' or keep it the same
    or (
      role = 'student'
      and status in ('pending', (select status from public.profiles where id = auth.uid()))
    )
  )
);
