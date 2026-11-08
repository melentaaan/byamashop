import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Category, Collection, ContactMessage, DashboardStats, DeliveryZone, NewsletterSubscriber, Order, OrderWithItems,
  Page, ProductImage, ProductVariant, ProductWithRelations, Promotion, PublicOrder, StoreSettings,
} from '../lib/types';
import { ShopError } from '../lib/types';
import { mergeSettings } from '../lib/settings';
import { toShopError } from './errors';
import type { AdminUser, Catalog, ShopBackend } from './types';

const BUCKET = 'product-images';
const PRODUCT_SELECT = '*, variants:product_variants(*), images:product_images(*)';

function check<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw toShopError(res.error);
  return res.data;
}

function sortRelations(p: ProductWithRelations): ProductWithRelations {
  return {
    ...p,
    tags: p.tags ?? [],
    variants: [...(p.variants ?? [])].sort((a, b) => a.position - b.position),
    images: [...(p.images ?? [])].sort((a, b) => a.position - b.position),
  };
}

interface CollectionRow extends Omit<Collection, 'product_ids'> {
  collection_products?: { product_id: string; position: number }[];
}
function mapCollection(row: CollectionRow): Collection {
  const { collection_products, ...rest } = row;
  return {
    ...rest,
    product_ids: [...(collection_products ?? [])].sort((a, b) => a.position - b.position).map((cp) => cp.product_id),
  };
}

export function createSupabaseBackend(url: string, anonKey: string): ShopBackend {
  const sb: SupabaseClient = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  async function currentUser(): Promise<AdminUser | null> {
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const res = await sb.rpc('is_admin');
    return { id: user.id, email: user.email ?? '', isAdmin: res.data === true };
  }

  async function requireAdmin() {
    const u = await currentUser();
    if (!u?.isAdmin) throw new ShopError('FORBIDDEN', 'Accès refusé. Connectez-vous avec un compte administrateur.');
  }

  async function syncCollectionProducts(collectionId: string, productIds: string[]) {
    check(await sb.from('collection_products').delete().eq('collection_id', collectionId));
    if (productIds.length) {
      check(await sb.from('collection_products').insert(
        productIds.map((product_id, position) => ({ collection_id: collectionId, product_id, position })),
      ));
    }
  }

  const backend: ShopBackend = {
    mode: 'supabase',

    async getCatalog(): Promise<Catalog> {
      try {
        const [cats, prods, cols, promos, zones, settings] = await Promise.all([
          sb.from('categories').select('*').eq('is_published', true).order('sort_order'),
          sb.from('products').select(PRODUCT_SELECT).eq('status', 'published').order('sort_order').order('created_at', { ascending: false }),
          sb.from('collections').select('*, collection_products(product_id, position)').eq('is_published', true).order('sort_order'),
          sb.from('promotions').select('*'),
          sb.from('delivery_zones').select('*').eq('is_active', true).order('sort_order'),
          sb.from('store_settings').select('data').eq('id', 1).maybeSingle(),
        ]);
        return {
          categories: check(cats) as Category[],
          products: (check(prods) as ProductWithRelations[]).map(sortRelations),
          collections: (check(cols) as CollectionRow[]).map(mapCollection),
          promotions: check(promos) as Promotion[],
          zones: check(zones) as DeliveryZone[],
          settings: mergeSettings((check(settings) as { data: unknown } | null)?.data),
        };
      } catch (e) {
        throw toShopError(e);
      }
    },

    async getPage(slug) {
      const data = check(await sb.from('pages').select('*').eq('slug', slug).maybeSingle());
      return (data as Page | null) ?? null;
    },

    async placeOrder(payload) {
      const data = check(await sb.rpc('place_order', { payload }));
      return data as { reference: string; access_token: string; total: number; duplicate: boolean };
    },

    async getOrderStatus(reference, token) {
      if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
      const data = check(await sb.rpc('get_order_status', { p_reference: reference, p_token: token }));
      return (data as PublicOrder | null) ?? null;
    },

    async submitContact(payload) {
      check(await sb.rpc('submit_contact_message', { payload }));
    },

    async subscribeNewsletter(email, consent, website = '') {
      check(await sb.rpc('subscribe_newsletter', { p_email: email, p_consent: consent, p_website: website }));
    },

    getCurrentUser: currentUser,

    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        throw new ShopError('AUTH', /invalid/i.test(error.message)
          ? 'E-mail ou mot de passe incorrect.'
          : 'Connexion impossible pour le moment. Réessayez.');
      }
      const u = await currentUser();
      if (!u?.isAdmin) {
        await sb.auth.signOut();
        throw new ShopError('FORBIDDEN', 'Ce compte n’a pas accès à l’administration.');
      }
      return u;
    },

    async signOut() {
      await sb.auth.signOut();
    },

    async requestPasswordReset(email, redirectTo) {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw new ShopError('AUTH', 'Impossible d’envoyer l’e-mail de réinitialisation. Réessayez plus tard.');
    },

    async updatePassword(newPassword) {
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (error) throw new ShopError('AUTH', 'Impossible de modifier le mot de passe : ' + error.message);
    },

    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange(() => cb());
      return () => data.subscription.unsubscribe();
    },

    admin: {
      async listProducts() {
        const data = check(await sb.from('products').select(PRODUCT_SELECT).order('sort_order').order('created_at', { ascending: false }));
        return (data as ProductWithRelations[]).map(sortRelations);
      },

      async saveProduct({ product, variants, images }) {
        // Une seule transaction côté base (admin_save_product)
        const productId = check(await sb.rpc('admin_save_product', { payload: { product, variants, images } })) as string;
        const saved = check(await sb.from('products').select(PRODUCT_SELECT).eq('id', productId).single());
        return sortRelations(saved as ProductWithRelations);
      },

      async deleteProduct(id) {
        await requireAdmin();
        const imgs = check(await sb.from('product_images').select('storage_path').eq('product_id', id)) as Pick<ProductImage, 'storage_path'>[];
        check(await sb.from('products').delete().eq('id', id));
        const paths = imgs.map((i) => i.storage_path).filter((p): p is string => !!p);
        if (paths.length) await sb.storage.from(BUCKET).remove(paths.flatMap((p) => [p, p.replace(/\.(\w+)$/, '-thumb.$1')]));
      },

      async setProductStatus(id, status) {
        check(await sb.from('products').update({ status }).eq('id', id));
      },

      async updateVariantStock(variantId, stock) {
        check(await sb.from('product_variants').update({ stock: Math.max(0, Math.floor(stock)) } as Partial<ProductVariant>).eq('id', variantId));
      },

      async uploadImage(file, thumb, meta) {
        await requireAdmin();
        const base = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}`;
        const path = `${base}.${meta.ext}`;
        const contentType = file.type || 'image/webp';
        const up = await sb.storage.from(BUCKET).upload(path, file, { contentType, cacheControl: '31536000', upsert: false });
        if (up.error) throw new ShopError('UPLOAD', 'Envoi de la photo impossible : ' + up.error.message);
        let thumbUrl: string | null = null;
        if (thumb) {
          const tpath = `${base}-thumb.${meta.ext}`;
          const t = await sb.storage.from(BUCKET).upload(tpath, thumb, { contentType, cacheControl: '31536000', upsert: false });
          if (!t.error) thumbUrl = sb.storage.from(BUCKET).getPublicUrl(tpath).data.publicUrl;
        }
        return {
          url: sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
          thumb_url: thumbUrl,
          storage_path: path,
          width: meta.width,
          height: meta.height,
        };
      },

      async deleteImageFile(storagePath) {
        await sb.storage.from(BUCKET).remove([storagePath, storagePath.replace(/\.(\w+)$/, '-thumb.$1')]);
      },

      async listCategories() {
        return check(await sb.from('categories').select('*').order('sort_order')) as Category[];
      },
      async saveCategory(c) {
        const { id, ...f } = c;
        const res = id
          ? await sb.from('categories').update(f).eq('id', id).select('*').single()
          : await sb.from('categories').insert(f).select('*').single();
        return check(res) as Category;
      },
      async deleteCategory(id) {
        check(await sb.from('categories').delete().eq('id', id));
      },

      async listCollections() {
        const data = check(await sb.from('collections').select('*, collection_products(product_id, position)').order('sort_order'));
        return (data as CollectionRow[]).map(mapCollection);
      },
      async saveCollection(c) {
        const { id, product_ids, ...f } = c;
        const res = id
          ? await sb.from('collections').update(f).eq('id', id).select('*').single()
          : await sb.from('collections').insert(f).select('*').single();
        const row = check(res) as Collection;
        await syncCollectionProducts(row.id, product_ids);
        return { ...row, product_ids };
      },
      async deleteCollection(id) {
        check(await sb.from('collections').delete().eq('id', id));
      },

      async listPromotions() {
        return check(await sb.from('promotions').select('*').order('created_at', { ascending: false })) as Promotion[];
      },
      async savePromotion(p) {
        const { id, ...f } = p;
        const res = id
          ? await sb.from('promotions').update(f).eq('id', id).select('*').single()
          : await sb.from('promotions').insert(f).select('*').single();
        return check(res) as Promotion;
      },
      async deletePromotion(id) {
        check(await sb.from('promotions').delete().eq('id', id));
      },

      async listZones() {
        return check(await sb.from('delivery_zones').select('*').order('sort_order')) as DeliveryZone[];
      },
      async saveZone(z) {
        const { id, ...f } = z;
        const res = id
          ? await sb.from('delivery_zones').update(f).eq('id', id).select('*').single()
          : await sb.from('delivery_zones').insert(f).select('*').single();
        return check(res) as DeliveryZone;
      },
      async deleteZone(id) {
        check(await sb.from('delivery_zones').delete().eq('id', id));
      },

      async getSettings() {
        const row = check(await sb.from('store_settings').select('data').eq('id', 1).maybeSingle()) as { data: unknown } | null;
        return mergeSettings(row?.data);
      },
      async saveSettings(s: StoreSettings) {
        const res = await sb.from('store_settings').update({ data: s }).eq('id', 1).select('id');
        const rows = check(res) as unknown[];
        if (!rows.length) throw new ShopError('FORBIDDEN', 'Enregistrement refusé : droits administrateur requis.');
      },

      async listPages() {
        return check(await sb.from('pages').select('*').order('slug')) as Page[];
      },
      async savePage(p) {
        check(await sb.from('pages').upsert(p, { onConflict: 'slug' }));
      },

      async listOrders(f) {
        let q = sb.from('orders').select('*').order('created_at', { ascending: false }).limit(f.limit ?? 200);
        if (f.status === 'open') q = q.not('status', 'in', '(completed,cancelled)');
        else if (f.status) q = q.eq('status', f.status);
        if (f.payment_status) q = q.eq('payment_status', f.payment_status);
        if (f.delivery_status) q = q.eq('delivery_status', f.delivery_status);
        if (!f.include_test) q = q.eq('is_test', false);
        const s = f.search?.trim().replace(/[,()%*]/g, ' ').trim();
        if (s) {
          const digits = s.replace(/\D/g, '');
          const parts = [`reference.ilike.%${s}%`, `customer_name.ilike.%${s}%`];
          if (digits.length >= 4) parts.push(`customer_phone.ilike.%${digits}%`);
          q = q.or(parts.join(','));
        }
        return check(await q) as Order[];
      },
      async getOrder(id) {
        const data = check(await sb.from('orders').select('*, items:order_items(*), events:order_events(*)').eq('id', id).maybeSingle());
        if (!data) return null;
        const o = data as OrderWithItems;
        o.events = [...(o.events ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
        return o;
      },
      async updateOrder(id, u) {
        check(await sb.rpc('admin_update_order', {
          p_order_id: id,
          p_status: u.status ?? null,
          p_payment_status: u.payment_status ?? null,
          p_delivery_status: u.delivery_status ?? null,
          p_note: u.note ?? null,
          p_payment_reference: u.payment_reference ?? null,
        }));
      },
      async setOrderFlags(id, flags) {
        check(await sb.from('orders').update(flags).eq('id', id));
      },

      async dashboard(days) {
        return check(await sb.rpc('admin_dashboard', { p_days: days })) as DashboardStats;
      },

      async listMessages() {
        return check(await sb.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(300)) as ContactMessage[];
      },
      async setMessageHandled(id, handled) {
        check(await sb.from('contact_messages').update({ is_handled: handled }).eq('id', id));
      },
      async deleteMessage(id) {
        check(await sb.from('contact_messages').delete().eq('id', id));
      },
      async listSubscribers() {
        return check(await sb.from('newsletter_subscribers').select('*').order('created_at', { ascending: false })) as NewsletterSubscriber[];
      },
      async deleteSubscriber(id) {
        check(await sb.from('newsletter_subscribers').delete().eq('id', id));
      },

      async removeDemoContent() {
        return check(await sb.rpc('admin_remove_demo_content')) as { products: number; collections: number };
      },
    },
  };
  return backend;
}
