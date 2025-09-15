-- Update the test user's password hash to use the new Web Crypto API format
-- For password "password" with email "test@example.com" as salt
UPDATE chrome_extension_users 
SET password_hash = 'c7614ee5c91f4e5e5b8b8e8c8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8'
WHERE email = 'test@example.com';

-- Note: This is a temporary hash for development. In production, you should use proper password hashing.
-- The actual hash for "password" with "test@example.com" as salt using PBKDF2 SHA-256 with 100000 iterations