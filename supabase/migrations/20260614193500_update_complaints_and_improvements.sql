-- Add admin_reply to complaints if it doesn't exist
alter table public.complaints add column if not exists admin_reply text;

-- Add status and admin_reply to improvements if they don't exist
alter table public.improvements add column if not exists status text not null default 'pending'; -- 'pending', 'completed', 'rejected'
alter table public.improvements add column if not exists admin_reply text;

-- Update RLS policies for complaints
drop policy if exists "Admins can update complaints" on public.complaints;
drop policy if exists "Admins and owners can update complaints" on public.complaints;
drop policy if exists "Admins and owners can delete complaints" on public.complaints;

-- Create update policy for complaints (Admins & Owners)
create policy "Admins and owners can update complaints"
on public.complaints
for update
using (
  auth.uid() = user_id or public.is_admin(auth.uid())
)
with check (
  auth.uid() = user_id or public.is_admin(auth.uid())
);

-- Create delete policy for complaints (Admins & Owners)
create policy "Admins and owners can delete complaints"
on public.complaints
for delete
using (
  auth.uid() = user_id or public.is_admin(auth.uid())
);


-- Update RLS policies for improvements
drop policy if exists "Authenticated users can update upvotes and downvotes" on public.improvements;
drop policy if exists "Users can update upvotes and downvotes or owners/admins can update full improvement" on public.improvements;
drop policy if exists "Admins and owners can delete improvements" on public.improvements;

-- Create update policy for improvements (voting + editing)
create policy "Users can update upvotes and downvotes or owners/admins can update full improvement"
on public.improvements
for update
using (
  auth.uid() is not null
)
with check (
  auth.uid() is not null
);

-- Create delete policy for improvements (Admins & Owners)
create policy "Admins and owners can delete improvements"
on public.improvements
for delete
using (
  auth.uid() = user_id or public.is_admin(auth.uid())
);
