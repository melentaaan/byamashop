/** Types partagés — reflètent le schéma SQL (supabase/migrations). Montants en FCFA (entiers). */

export type ProductStatus = 'draft' | 'published' | 'archived';
export type PaymentMethod = 'wave' | 'orange_money' | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  thumb_url: string | null;
  alt: string;
  width: number | null;
  height: number | null;
  position: number;
  storage_path?: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  option1: string | null;
  option2: string | null;
  color_hex: string | null;
  price_override: number | null;
  stock: number;
  is_active: boolean;
  position: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category_id: string | null;
  short_description: string;
  description: string;
  details: string;
  price: number;
  compare_at_price: number | null;
  status: ProductStatus;
  is_featured: boolean;
  is_new: boolean;
  condition_note: string | null;
  tags: string[];
  option1_name: string;
  option2_name: string;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  is_demo: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Produit enrichi pour l'affichage (variantes + images). */
export interface ProductWithRelations extends Product {
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  is_demo: boolean;
  product_ids: string[];
}

export type PromotionScope = 'all' | 'category' | 'collection' | 'products';
export interface Promotion {
  id: string;
  name: string;
  percent_off: number;
  scope: PromotionScope;
  category_id: string | null;
  collection_id: string | null;
  product_ids: string[];
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  fee: number;
  free_from: number | null;
  estimate: string;
  is_pickup: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface PaymentMethodSettings {
  enabled: boolean;
  /** Numéro marchand / de réception affiché au client */
  account_number: string;
  account_name: string;
  instructions: string;
}

export interface HomeBanner {
  id: string;
  enabled: boolean;
  eyebrow: string;
  title: string;
  text: string;
  cta_label: string;
  cta_href: string;
  image_url: string;
}

export interface StoreSettings {
  business_name: string;
  tagline: string;
  announcement: string;
  whatsapp: string; // format international sans + : 221XXXXXXXXX
  phone: string;
  email: string;
  address: string;
  opening_hours: string;
  socials: { instagram: string; tiktok: string; facebook: string; snapchat: string };
  payments: Record<PaymentMethod, PaymentMethodSettings>;
  hero: { eyebrow: string; title: string; subtitle: string; cta_label: string; cta_href: string; image_url: string };
  banners: HomeBanner[];
  about: string;
  wholesale: { enabled: boolean; title: string; text: string };
  returns_summary: string;
  shipping_summary: string;
  newsletter_enabled: boolean;
  low_stock_threshold: number;
  legal: {
    raison_sociale: string;
    forme_juridique: string;
    ninea: string;
    rccm: string;
    responsable_publication: string;
  };
  site_url: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  image_url: string | null;
  unit_price: number;
  base_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_zone_id: string | null;
  delivery_zone_name: string;
  delivery_address: string;
  delivery_notes: string | null;
  customer_note: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  delivery_status: DeliveryStatus;
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  total: number;
  payment_reference: string | null;
  admin_note: string | null;
  is_test: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderEvent {
  id: number;
  order_id: string;
  kind: string;
  from_value: string | null;
  to_value: string | null;
  note: string | null;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  events?: OrderEvent[];
}

/** Vue publique d'une commande (via référence + jeton secret). */
export interface PublicOrder {
  reference: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  delivery_zone_name: string;
  delivery_address: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  delivery_status: DeliveryStatus;
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  total: number;
  items: { product_name: string; variant_label: string | null; image_url: string | null; unit_price: number; quantity: number; line_total: number }[];
}

export interface PlaceOrderPayload {
  idempotency_key: string;
  customer: { name: string; phone: string; email?: string };
  delivery: { zone_id: string; address: string; notes?: string };
  payment_method: PaymentMethod;
  note?: string;
  accept_terms: boolean;
  items: { variant_id: string; quantity: number }[];
  website?: string; // pot de miel
}

export interface PlaceOrderResult {
  reference: string;
  access_token: string;
  total: number;
  duplicate: boolean;
}

export interface ContactPayload {
  name: string;
  phone?: string;
  email?: string;
  subject: 'general' | 'commande' | 'gros' | 'produit' | 'autre';
  message: string;
  website?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  subject: string;
  message: string;
  is_handled: boolean;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
  unsubscribed_at: string | null;
}

export interface Page {
  slug: string;
  title: string;
  body: string;
  is_published: boolean;
  updated_at: string;
}

export interface DashboardStats {
  period_days: number;
  orders_received: number;
  orders_cancelled: number;
  confirmed_sales: number;
  revenue: number;
  pending_value: number;
  awaiting_action: number;
  total_real_orders: number;
  popular_products: { product_id: string | null; name: string; quantity: number; amount: number }[];
  low_stock: { variant_id: string; product_id: string; name: string; is_demo: boolean; variant: string | null; stock: number }[];
  daily: { day: string; orders: number; paid_revenue: number }[];
}

/** Erreur métier normalisée renvoyée par le backend. */
export class ShopError extends Error {
  code: string;
  field?: string;
  details?: unknown;
  constructor(code: string, message: string, opts?: { field?: string; details?: unknown }) {
    super(message);
    this.code = code;
    this.field = opts?.field;
    this.details = opts?.details;
  }
}
