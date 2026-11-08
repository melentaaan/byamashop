-- =====================================================================
-- Byamashop — stockage des photos produits (Supabase Storage)
-- Lecture publique, écriture réservée aux administrateurs.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "product_images_public_read" on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
