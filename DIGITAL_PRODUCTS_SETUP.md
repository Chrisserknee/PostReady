# Digital Products Setup Guide

## Step 1: Create Supabase Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Digital Products Table
CREATE TABLE digital_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  badge_text TEXT,
  badge_color TEXT DEFAULT '#A855F7',
  image_url TEXT NOT NULL,
  file_url TEXT NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases Table
CREATE TABLE product_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES digital_products(id),
  stripe_session_id TEXT NOT NULL,
  stripe_payment_intent TEXT,
  amount_paid DECIMAL(10, 2) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_product_purchases_user_id ON product_purchases(user_id);
CREATE INDEX idx_product_purchases_product_id ON product_purchases(product_id);
CREATE INDEX idx_digital_products_active ON digital_products(is_active);

-- RLS Policies
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_purchases ENABLE ROW LEVEL SECURITY;

-- Anyone can view active products
CREATE POLICY "Anyone can view active products"
  ON digital_products FOR SELECT
  USING (is_active = true);

-- Only authenticated users can view their purchases
CREATE POLICY "Users can view their own purchases"
  ON product_purchases FOR SELECT
  USING (auth.uid() = user_id);
```

## Step 2: Create Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `digital-products`
3. Make it **private** (not public)
4. Add RLS policy for downloads (only purchasers can access)

## Step 3: Get Stripe API Keys

1. Go to [stripe.com/dashboard](https://dashboard.stripe.com)
2. Get your **Publishable Key** and **Secret Key**
3. Add to Vercel Environment Variables:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`

## Step 4: Install Stripe

```bash
npm install stripe @stripe/stripe-js
```

## Step 5: Admin Dashboard Password

The admin dashboard will be at `/admin/products` with password protection.
Default password: `Yobfesh1325519*` (same as page-analyses admin)

