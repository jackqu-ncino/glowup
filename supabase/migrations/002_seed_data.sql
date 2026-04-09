-- ============================================
-- SEED: Categories
-- ============================================

INSERT INTO categories (name, slug, icon, display_order) VALUES
  ('Hair', 'hair', 'scissors', 1),
  ('Nails', 'nails', 'sparkles', 2),
  ('Brows', 'brows', 'eye', 3),
  ('Lashes', 'lashes', 'sparkle', 4),
  ('Makeup', 'makeup', 'palette', 5),
  ('Skincare', 'skincare', 'droplet', 6),
  ('Waxing', 'waxing', 'star', 7),
  ('Barbering', 'barbering', 'scissors', 8);

-- ============================================
-- SEED: Tags
-- ============================================

INSERT INTO tags (name, slug, display_order) VALUES
  ('LGBTQ+', 'lgbtq', 1),
  ('WOMAN-OWNED', 'woman-owned', 2),
  ('POC-OWNED', 'poc-owned', 3),
  ('BLACK-OWNED', 'black-owned', 4),
  ('ASIAN-OWNED', 'asian-owned', 5),
  ('LATINO/A-OWNED', 'latino-owned', 6),
  ('VETERAN-OWNED', 'veteran-owned', 7),
  ('DISABILITY-FRIENDLY', 'disability-friendly', 8),
  ('ECO-FRIENDLY', 'eco-friendly', 9);

-- ============================================
-- SEED: Payment Methods
-- ============================================

INSERT INTO payment_methods (name, slug, icon) VALUES
  ('Cash', 'cash', 'banknote'),
  ('Credit/Debit Card', 'card', 'credit-card'),
  ('Venmo', 'venmo', 'smartphone'),
  ('CashApp', 'cashapp', 'dollar-sign'),
  ('Zelle', 'zelle', 'send'),
  ('PayPal', 'paypal', 'wallet'),
  ('Apple Pay', 'apple-pay', 'smartphone');
