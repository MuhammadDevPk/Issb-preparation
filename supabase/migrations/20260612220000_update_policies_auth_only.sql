-- Drop old public policies
drop policy if exists "Anyone can insert complaints" on public.complaints;
drop policy if exists "Anyone can select improvements" on public.improvements;
drop policy if exists "Anyone can insert improvements" on public.improvements;
drop policy if exists "Anyone can update upvotes and downvotes" on public.improvements;

-- Create authenticated-only policies
create policy "Authenticated users can insert complaints"
on public.complaints
for insert
with check (auth.uid() = user_id);

create policy "Authenticated users can select improvements"
on public.improvements
for select
using (auth.uid() is not null);

create policy "Authenticated users can insert improvements"
on public.improvements
for insert
with check (auth.uid() = user_id);

create policy "Authenticated users can update upvotes and downvotes"
on public.improvements
for update
using (auth.uid() is not null)
with check (auth.uid() is not null);
