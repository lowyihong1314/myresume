export type Env = {
  ASSETS: Fetcher;
  my_db: D1Database;
  EASYPOS_REALTIME: DurableObjectNamespace;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_IMAGES_API_TOKEN?: string;
  CLOUDFLARE_IMAGES_DELIVERY_HASH?: string;
};

export type EasyPosRealtimeEvent = {
  type: string;
  merchantId: number;
  updatedAt: string;
  userId?: number;
  entityId?: string;
  referenceId?: string;
};

export type UserRow = {
  id: number;
  username: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_image_id: string | null;
  avatar_image_url: string | null;
  token_balance: number;
  token_refreshed_at: string | null;
  default_max_token: number;
  max_product: number;
  session_token: string | null;
  session_expires_at: string | null;
  created_at: string;
};

export type AdminUserRow = Pick<
  UserRow,
  | "id"
  | "username"
  | "display_name"
  | "email"
  | "phone"
  | "token_balance"
  | "token_refreshed_at"
  | "default_max_token"
  | "max_product"
  | "created_at"
>;

export type EasyPosStateRow = {
  user_id: number;
  merchant_id: number | null;
  products_json: string;
  sales_json: string;
  inventory_events_json: string;
  merchant_json: string;
  settings_json: string;
  updated_at: string;
  created_at: string;
};

export type EasyPosProductRow = {
  user_id: number;
  merchant_id: number | null;
  creator_id: number | null;
  product_id: string;
  name: string;
  price: number;
  stock: number;
  unit_cost: number;
  image_id: string | null;
  image_url: string | null;
};

export type EasyPosSaleRow = {
  user_id: number;
  merchant_id: number | null;
  sale_id: string;
  public_token: string | null;
  created_at: string;
  total: number;
  item_count: number;
};

export type EasyPosSaleItemRow = {
  user_id: number;
  merchant_id: number | null;
  sale_id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  line_total: number;
  image_url: string | null;
};

export type EasyPosInventoryEventRow = {
  user_id: number;
  merchant_id: number | null;
  event_id: string;
  type: string;
  created_at: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number | null;
  unit_cost: number | null;
  total_value: number | null;
  total_cost: number | null;
  reference_id: string | null;
};

export type EasyPosMerchantRow = {
  id?: number;
  merchant_owner_id?: number;
  name: string;
  registration_number: string;
  phone: string;
  email: string;
  address: string;
  footer_note: string;
};

export type EasyPosSettingsRow = {
  merchant_id?: number;
  dark_mode: number;
};

export type UserMerchantRow = {
  user_id: number;
  merchant_id: number;
  role: string;
  name: string;
  registration_number: string;
  phone: string;
  email: string;
  address: string;
  footer_note: string;
  merchant_owner_id: number;
  created_at: string;
  updated_at: string;
};

export type MerchantMemberRow = {
  user_id: number;
  username: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  created_at: string;
};
