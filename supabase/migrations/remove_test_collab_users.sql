-- Remove all test users from collab_directory
-- This removes users with @example.com email addresses (test data)

DELETE FROM collab_directory 
WHERE email_for_collabs LIKE '%@example.com';

-- Verify deletion
SELECT COUNT(*) as remaining_test_users FROM collab_directory WHERE email_for_collabs LIKE '%@example.com';


