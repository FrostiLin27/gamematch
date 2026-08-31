-- Allow an authenticated owner to add recommendation items to their own session.
-- This is separate so it can be applied after the initial schema already exists.
drop policy if exists "users can create recommendation items" on public.recommendation_items;
create policy "users can create recommendation items"
  on public.recommendation_items for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.recommendation_sessions session
      where session.id = recommendation_items.session_id
        and session.user_id = auth.uid()
    )
  );
