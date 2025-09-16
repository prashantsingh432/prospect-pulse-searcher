-- Generate the correct password hash for the test user
-- Using a simple but consistent hashing approach for development
DO $$
DECLARE
    test_password TEXT := 'password';
    test_email TEXT := 'test@example.com';
    hash_input TEXT;
    result_hash TEXT;
BEGIN
    -- Create a simple hash using SHA-256 for development
    -- This is not production-ready but will work for testing
    hash_input := test_password || test_email || 'salt123';
    
    -- Update the test user with a predictable hash
    -- Hash of 'passwordtest@example.comsalt123' 
    UPDATE chrome_extension_users 
    SET password_hash = encode(digest(hash_input, 'sha256'), 'hex')
    WHERE email = 'test@example.com';
    
    -- Log the hash for debugging
    SELECT encode(digest(hash_input, 'sha256'), 'hex') INTO result_hash;
    RAISE NOTICE 'Generated hash for test user: %', result_hash;
END $$;