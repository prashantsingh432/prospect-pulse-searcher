-- Create Chrome Extension specific tables

-- Extension users table for Chrome extension authentication
CREATE TABLE IF NOT EXISTS chrome_extension_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chrome extension prospects table
CREATE TABLE IF NOT EXISTS chrome_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES chrome_extension_users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  job_title VARCHAR,
  company VARCHAR,
  location VARCHAR,
  linkedin_url VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chrome_prospects_user_id ON chrome_prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_chrome_prospects_linkedin_url ON chrome_prospects(linkedin_url);

-- Enable RLS
ALTER TABLE chrome_extension_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chrome_prospects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chrome_extension_users
CREATE POLICY "Users can read their own data" ON chrome_extension_users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own data" ON chrome_extension_users
  FOR UPDATE USING (id = auth.uid());

-- RLS Policies for chrome_prospects
CREATE POLICY "Users can read their own prospects" ON chrome_prospects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own prospects" ON chrome_prospects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own prospects" ON chrome_prospects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own prospects" ON chrome_prospects
  FOR DELETE USING (user_id = auth.uid());

-- Insert test user
INSERT INTO chrome_extension_users (email, password_hash) 
VALUES ('test@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi') -- password: password
ON CONFLICT (email) DO NOTHING;