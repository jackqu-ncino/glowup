export type UserType = "customer" | "provider";
export type LocationType = "home_studio" | "separate_studio" | "mobile";

export interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType;
  avatar_url: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  bio: string | null;
  zip_code: string;
  city: string | null;
  state: string | null;
  location_type: LocationType;
  service_radius_miles: number;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  average_rating: number;
  review_count: number;
  is_published: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  profile_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  duration_minutes: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  profile_id: string;
  image_url: string;
  storage_path: string;
  caption: string | null;
  category_id: string | null;
  display_order: number;
  created_at: string;
}

export interface Review {
  id: string;
  provider_profile_id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: Pick<User, "full_name" | "avatar_url">;
}

export interface Conversation {
  id: string;
  customer_id: string;
  provider_id: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// Composite types for views
export interface ProviderSearchResult {
  profile_id: string;
  user_id: string;
  business_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  full_name: string;
  zip_code: string;
  city: string | null;
  state: string | null;
  location_type: LocationType;
  average_rating: number;
  review_count: number;
  distance_miles: number;
  latitude: number;
  longitude: number;
  categories?: Category[];
  tags?: Tag[];
  payment_methods?: PaymentMethod[];
  services?: Service[];
}

export interface ProviderProfileFull extends ProviderProfile {
  user: Pick<User, "full_name" | "avatar_url" | "email">;
  categories: Category[];
  tags: Tag[];
  payment_methods: PaymentMethod[];
  services: Service[];
  gallery_images: GalleryImage[];
}

export interface ConversationFull extends Conversation {
  other_user: Pick<User, "id" | "full_name" | "avatar_url">;
  last_message?: Pick<Message, "content" | "created_at" | "sender_id">;
  unread_count: number;
}
