import type {
  Category, Collection, ContactMessage, ContactPayload, DashboardStats, DeliveryStatus, DeliveryZone,
  NewsletterSubscriber, Order, OrderStatus, OrderWithItems, Page, PaymentStatus, PlaceOrderPayload,
  PlaceOrderResult, Product, ProductImage, ProductVariant, ProductWithRelations, Promotion, PublicOrder, StoreSettings,
} from '../lib/types';

export interface Catalog {
  categories: Category[];
  products: ProductWithRelations[];
  collections: Collection[];
  promotions: Promotion[];
  zones: DeliveryZone[];
  settings: StoreSettings;
}

export interface AdminUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus | 'open' | '';
  payment_status?: PaymentStatus | '';
  delivery_status?: DeliveryStatus | '';
  include_test?: boolean;
  limit?: number;
}

export interface OrderUpdate {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  delivery_status?: DeliveryStatus;
  note?: string;
  payment_reference?: string;
}

/** Données d'un produit envoyées par l'éditeur d'administration. */
export interface ProductInput {
  product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'published_at'> & { id?: string };
  variants: (Omit<ProductVariant, 'id' | 'product_id'> & { id?: string })[];
  images: (Omit<ProductImage, 'id' | 'product_id'> & { id?: string })[];
}

export interface UploadedImage {
  url: string;
  thumb_url: string | null;
  storage_path: string | null;
  width: number;
  height: number;
}

export interface ShopBackend {
  readonly mode: 'supabase' | 'demo';

  // --- public
  getCatalog(): Promise<Catalog>;
  getPage(slug: string): Promise<Page | null>;
  placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult>;
  getOrderStatus(reference: string, token: string): Promise<PublicOrder | null>;
  submitContact(payload: ContactPayload): Promise<void>;
  subscribeNewsletter(email: string, consent: boolean, website?: string): Promise<void>;

  // --- authentification
  getCurrentUser(): Promise<AdminUser | null>;
  signIn(email: string, password: string): Promise<AdminUser>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string, redirectTo: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  onAuthChange(cb: () => void): () => void;

  // --- administration (toutes ces opérations exigent un administrateur ; contrôlées côté base)
  admin: {
    listProducts(): Promise<ProductWithRelations[]>;
    saveProduct(input: ProductInput): Promise<ProductWithRelations>;
    deleteProduct(id: string): Promise<void>;
    setProductStatus(id: string, status: Product['status']): Promise<void>;
    updateVariantStock(variantId: string, stock: number): Promise<void>;
    uploadImage(file: Blob, thumb: Blob | null, meta: { width: number; height: number; ext: string }): Promise<UploadedImage>;
    deleteImageFile(storagePath: string): Promise<void>;

    listCategories(): Promise<Category[]>;
    saveCategory(c: Omit<Category, 'id'> & { id?: string }): Promise<Category>;
    deleteCategory(id: string): Promise<void>;

    listCollections(): Promise<Collection[]>;
    saveCollection(c: Omit<Collection, 'id'> & { id?: string }): Promise<Collection>;
    deleteCollection(id: string): Promise<void>;

    listPromotions(): Promise<Promotion[]>;
    savePromotion(p: Omit<Promotion, 'id'> & { id?: string }): Promise<Promotion>;
    deletePromotion(id: string): Promise<void>;

    listZones(): Promise<DeliveryZone[]>;
    saveZone(z: Omit<DeliveryZone, 'id'> & { id?: string }): Promise<DeliveryZone>;
    deleteZone(id: string): Promise<void>;

    getSettings(): Promise<StoreSettings>;
    saveSettings(s: StoreSettings): Promise<void>;

    listPages(): Promise<Page[]>;
    savePage(p: Pick<Page, 'slug' | 'title' | 'body' | 'is_published'>): Promise<void>;

    listOrders(filters: OrderFilters): Promise<Order[]>;
    getOrder(id: string): Promise<OrderWithItems | null>;
    updateOrder(id: string, update: OrderUpdate): Promise<void>;
    setOrderFlags(id: string, flags: { is_test?: boolean; admin_note?: string | null }): Promise<void>;

    dashboard(days: number): Promise<DashboardStats>;

    listMessages(): Promise<ContactMessage[]>;
    setMessageHandled(id: string, handled: boolean): Promise<void>;
    deleteMessage(id: string): Promise<void>;
    listSubscribers(): Promise<NewsletterSubscriber[]>;
    deleteSubscriber(id: string): Promise<void>;

    removeDemoContent(): Promise<{ products: number; collections: number }>;
  };
}
