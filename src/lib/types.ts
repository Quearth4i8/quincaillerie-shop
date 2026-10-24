export type UserRole = "customer" | "manager" | "admin";
export type OrderStatus = "pending" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
export type OrderSource = "web" | "phone" | "whatsapp";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  governorate: string | null;
  city: string | null;
  address: string | null;
  created_at: string;
};

export type Settings = {
  shop_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string | null;
  address: string | null;
  hours: string | null;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
};

export type Spec = { label: string; value: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  reference: string | null;
  description: string | null;
  highlights: string[];
  specs: Spec[];
  category_id: string | null;
  price: number;
  old_price: number | null;
  stock: number;
  images: string[];
  badge: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  category?: Pick<Category, "name" | "slug"> | null;
};

export type DeliveryZone = {
  governorate: string;
  fee: number;
  delay: string | null;
  is_active: boolean;
};

export type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type Order = {
  id: string;
  order_number: number;
  user_id: string | null;
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  note: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  source: OrderSource;
  staff_note: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type ActionState = { ok: boolean; message?: string; errors?: Record<string, string> } | null;
