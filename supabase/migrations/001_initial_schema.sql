-- ============================================
-- GLOWUP DATABASE SCHEMA
-- ============================================

-- Enable PostGIS extension for geolocation queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_type AS ENUM ('customer', 'provider');
CREATE TYPE location_type AS ENUM ('home_studio', 'separate_studio', 'mobile');

-- ============================================
-- REFERENCE / LOOKUP TABLES
-- ============================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER TABLE (extends Supabase auth.users)
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  user_type user_type NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROVIDER PROFILES
-- ============================================

CREATE TABLE provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  business_name TEXT,
  bio TEXT,

  -- Location (PostGIS)
  zip_code TEXT NOT NULL,
  city TEXT,
  state TEXT,
  location GEOGRAPHY(POINT, 4326),
  service_radius_miles INTEGER DEFAULT 10,
  location_type location_type DEFAULT 'home_studio',

  -- Social links
  instagram_url TEXT,
  tiktok_url TEXT,
  facebook_url TEXT,

  -- Cached aggregates
  average_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  -- Visibility
  is_published BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_provider_profiles_location ON provider_profiles USING GIST (location);
CREATE INDEX idx_provider_profiles_published ON provider_profiles(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_provider_profiles_zip ON provider_profiles(zip_code);

-- ============================================
-- JUNCTION TABLES
-- ============================================

CREATE TABLE provider_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(profile_id, category_id)
);

CREATE TABLE provider_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(profile_id, tag_id)
);

CREATE TABLE provider_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  UNIQUE(profile_id, payment_method_id)
);

-- ============================================
-- SERVICES
-- ============================================

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_min NUMERIC(10,2),
  price_max NUMERIC(10,2),
  duration_minutes INTEGER,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_profile ON services(profile_id);
CREATE INDEX idx_services_category ON services(category_id);

-- ============================================
-- GALLERY IMAGES
-- ============================================

CREATE TABLE gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  category_id UUID REFERENCES categories(id),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gallery_images_profile ON gallery_images(profile_id);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_profile_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_profile_id, reviewer_id)
);

CREATE INDEX idx_reviews_provider ON reviews(provider_profile_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- ============================================
-- MESSAGING
-- ============================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, provider_id)
);

CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_provider ON conversations(provider_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER provider_profiles_updated_at BEFORE UPDATE ON provider_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update average_rating on provider_profiles when reviews change
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_profile_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_profile_id := OLD.provider_profile_id;
  ELSE
    target_profile_id := NEW.provider_profile_id;
  END IF;

  UPDATE provider_profiles SET
    average_rating = COALESCE(
      (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews WHERE provider_profile_id = target_profile_id),
      0
    ),
    review_count = (SELECT COUNT(*) FROM reviews WHERE provider_profile_id = target_profile_id)
  WHERE id = target_profile_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER reviews_rating_update
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- Auto-update last_message_at on conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER messages_last_message_at
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Auto-create user record on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Admin helper
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM users WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profile ownership helper
CREATE OR REPLACE FUNCTION owns_profile(profile_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM provider_profiles
    WHERE id = profile_uuid AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- REFERENCE TABLES (public read, admin write)
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages categories" ON categories FOR ALL USING (is_admin());
CREATE POLICY "Anyone can read tags" ON tags FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages tags" ON tags FOR ALL USING (is_admin());
CREATE POLICY "Anyone can read payment_methods" ON payment_methods FOR SELECT USING (TRUE);
CREATE POLICY "Admin manages payment_methods" ON payment_methods FOR ALL USING (is_admin());

-- USERS
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own record" ON users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Admin full access users" ON users FOR ALL USING (is_admin());

-- PROVIDER PROFILES
CREATE POLICY "Anyone can read published profiles" ON provider_profiles
  FOR SELECT USING (is_published = TRUE OR user_id = auth.uid() OR is_admin());
CREATE POLICY "Providers can insert own profile" ON provider_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Providers can update own profile" ON provider_profiles
  FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Providers can delete own profile" ON provider_profiles
  FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- JUNCTION TABLES
CREATE POLICY "Read provider categories" ON provider_categories FOR SELECT USING (TRUE);
CREATE POLICY "Manage own provider categories" ON provider_categories
  FOR ALL USING (owns_profile(profile_id) OR is_admin());

CREATE POLICY "Read provider tags" ON provider_tags FOR SELECT USING (TRUE);
CREATE POLICY "Manage own provider tags" ON provider_tags
  FOR ALL USING (owns_profile(profile_id) OR is_admin());

CREATE POLICY "Read provider payment methods" ON provider_payment_methods FOR SELECT USING (TRUE);
CREATE POLICY "Manage own provider payment methods" ON provider_payment_methods
  FOR ALL USING (owns_profile(profile_id) OR is_admin());

-- SERVICES
CREATE POLICY "Anyone can read active services" ON services
  FOR SELECT USING (is_active = TRUE OR owns_profile(profile_id) OR is_admin());
CREATE POLICY "Providers manage own services" ON services
  FOR ALL USING (owns_profile(profile_id) OR is_admin());

-- GALLERY IMAGES
CREATE POLICY "Anyone can read gallery images" ON gallery_images FOR SELECT USING (TRUE);
CREATE POLICY "Providers manage own gallery" ON gallery_images
  FOR ALL USING (owns_profile(profile_id) OR is_admin());

-- REVIEWS
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can create review" ON reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Reviewers can update own review" ON reviews
  FOR UPDATE USING (reviewer_id = auth.uid());
CREATE POLICY "Reviewers or admin can delete review" ON reviews
  FOR DELETE USING (reviewer_id = auth.uid() OR is_admin());

-- CONVERSATIONS
CREATE POLICY "Users see own conversations" ON conversations
  FOR SELECT USING (customer_id = auth.uid() OR provider_id = auth.uid() OR is_admin());
CREATE POLICY "Authenticated users can start conversation" ON conversations
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- MESSAGES
CREATE POLICY "Users see messages in own conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE customer_id = auth.uid() OR provider_id = auth.uid()
    )
    OR is_admin()
  );
CREATE POLICY "Users can send messages in own conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE customer_id = auth.uid() OR provider_id = auth.uid()
    )
  );
CREATE POLICY "Recipients can mark messages as read" ON messages
  FOR UPDATE USING (
    sender_id != auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE customer_id = auth.uid() OR provider_id = auth.uid()
    )
  );

-- ============================================
-- SUPABASE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ============================================
-- SEARCH FUNCTION (PostGIS proximity query)
-- ============================================

CREATE OR REPLACE FUNCTION search_providers_by_location(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  radius_miles INTEGER DEFAULT 25,
  category_filter UUID DEFAULT NULL,
  tag_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  profile_id UUID,
  user_id UUID,
  business_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  full_name TEXT,
  zip_code TEXT,
  city TEXT,
  state TEXT,
  location_type location_type,
  average_rating NUMERIC,
  review_count INTEGER,
  distance_miles DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  instagram_url TEXT,
  tiktok_url TEXT,
  facebook_url TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    pp.id AS profile_id,
    pp.user_id,
    pp.business_name,
    pp.bio,
    u.avatar_url,
    u.full_name,
    pp.zip_code,
    pp.city,
    pp.state,
    pp.location_type,
    pp.average_rating,
    pp.review_count,
    ST_Distance(
      pp.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::GEOGRAPHY
    ) / 1609.344 AS distance_miles,
    ST_Y(pp.location::GEOMETRY) AS latitude,
    ST_X(pp.location::GEOMETRY) AS longitude,
    pp.instagram_url,
    pp.tiktok_url,
    pp.facebook_url
  FROM provider_profiles pp
  JOIN users u ON u.id = pp.user_id
  WHERE pp.is_published = TRUE
    AND pp.location IS NOT NULL
    AND ST_DWithin(
      pp.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::GEOGRAPHY,
      radius_miles * 1609.344
    )
    AND (category_filter IS NULL OR EXISTS (
      SELECT 1 FROM provider_categories pc
      WHERE pc.profile_id = pp.id AND pc.category_id = category_filter
    ))
    AND (tag_filter IS NULL OR EXISTS (
      SELECT 1 FROM provider_tags pt
      WHERE pt.profile_id = pp.id AND pt.tag_id = tag_filter
    ))
  ORDER BY distance_miles ASC;
$$;
