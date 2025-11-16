-- Step 1: Make user_id nullable to allow test data without real users
-- This allows test/demo profiles that aren't tied to authenticated accounts
ALTER TABLE collab_directory ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Update the INSERT policy to handle NULL user_ids (for test data)
DROP POLICY IF EXISTS "Users can create their own collab profile" ON collab_directory;

CREATE POLICY "Users can create their own collab profile"
  ON collab_directory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Step 3: Add 25 test users to collab_directory
-- Note: These are fake users for testing purposes only
-- Using NULL for user_id since these aren't real authenticated users

INSERT INTO collab_directory (
  user_id,
  tiktok_username,
  display_name,
  niche,
  follower_count,
  follower_range,
  content_focus,
  bio,
  looking_for_collab,
  instagram_username,
  youtube_username,
  email_for_collabs
) VALUES
-- Fitness creators
(NULL, 'fitnesswithsarah', 'Sarah Martinez', 'Fitness', 15000, '10K-25K', 'Home Workouts & Nutrition', 'Helping busy moms get fit at home 💪 DM for collabs!', true, 'fitnesswithsarah', 'sarahfitness', 'sarah@example.com'),
(NULL, 'gymrattommy', 'Tommy Chen', 'Fitness', 45000, '25K-50K', 'Gym Tutorials & Muscle Building', 'Your daily dose of gym motivation 🏋️', true, 'tommygym', 'tommychen', 'tommy@example.com'),
(NULL, 'yogaflow_emma', 'Emma Wilson', 'Fitness', 8500, '5K-10K', 'Yoga & Mindfulness', 'Flow with me 🧘‍♀️ Yoga for beginners', true, 'emmaflow', null, 'emma@example.com'),

-- Gaming creators
(NULL, 'progamer_alex', 'Alex Rivera', 'Gaming', 125000, '100K-250K', 'FPS & Battle Royale', 'Professional gamer | Streaming daily 🎮', true, 'alexgaming', 'alexrivera', 'alex@example.com'),
(NULL, 'casualgamer_mike', 'Mike Johnson', 'Gaming', 22000, '10K-25K', 'Indie Games & Reviews', 'Discovering hidden gem games 👾', true, 'mikegames', 'mikejgaming', 'mike@example.com'),
(NULL, 'retro_gaming_lisa', 'Lisa Park', 'Gaming', 35000, '25K-50K', 'Retro & Classic Games', '90s gaming nostalgia 🕹️', true, 'retrolisa', null, 'lisa@example.com'),

-- Beauty creators
(NULL, 'makeupbyjade', 'Jade Anderson', 'Beauty', 67000, '50K-100K', 'Makeup Tutorials', 'Makeup artist | Cruelty-free beauty 💄', true, 'jadebeauty', 'makeupwithjade', 'jade@example.com'),
(NULL, 'skincarequeen_nina', 'Nina Rodriguez', 'Beauty', 18000, '10K-25K', 'Skincare Routines', 'Glass skin secrets ✨ Open to brand deals', true, 'ninaskincare', null, 'nina@example.com'),
(NULL, 'beautyby_chris', 'Chris Taylor', 'Beauty', 42000, '25K-50K', 'Hair & Nails', 'Licensed cosmetologist | Collab friendly 💅', true, 'christaylor', 'beautybychris', 'chris@example.com'),

-- Food/Cooking creators
(NULL, 'quickmeals_rachel', 'Rachel Kim', 'Food', 95000, '50K-100K', '15-Minute Recipes', 'Quick meals for busy people 🍳', true, 'rachelcooks', 'rachelkitchen', 'rachel@example.com'),
(NULL, 'bakingwith_ben', 'Ben Thompson', 'Food', 31000, '25K-50K', 'Baking & Desserts', 'Home baker sharing my favorite recipes 🧁', true, 'bensbakes', 'bakingwithben', 'ben@example.com'),
(NULL, 'healthyeats_maya', 'Maya Patel', 'Food', 12000, '10K-25K', 'Healthy Meal Prep', 'Nutrition student | Meal prep Sundays 🥗', true, 'mayaeats', null, 'maya@example.com'),

-- Lifestyle/Vlog creators
(NULL, 'dailyvlog_sam', 'Sam Williams', 'Lifestyle', 78000, '50K-100K', 'Daily Vlogs & Life Updates', 'Living my best life in NYC 🌆', true, 'samvlogs', 'samwilliams', 'sam@example.com'),
(NULL, 'minimalist_kelly', 'Kelly Zhang', 'Lifestyle', 54000, '50K-100K', 'Minimalism & Organization', 'Less stuff, more life 🌿', true, 'kellyminimal', 'kellyliving', 'kelly@example.com'),
(NULL, 'collegelife_jason', 'Jason Lee', 'Lifestyle', 16000, '10K-25K', 'College Student Life', 'Surviving college one day at a time 📚', true, 'jasonlee', null, 'jason@example.com'),

-- Tech/Education creators
(NULL, 'techexplained_david', 'David Brown', 'Tech', 110000, '100K-250K', 'Tech Reviews & Tutorials', 'Breaking down tech for everyone 💻', true, 'davidtech', 'techwithdavid', 'david@example.com'),
(NULL, 'codingwith_sophia', 'Sophia Garcia', 'Tech', 38000, '25K-50K', 'Programming Tutorials', 'Teaching code in bite-sized lessons 👩‍💻', true, 'sophiacodes', 'codingsophia', 'sophia@example.com'),
(NULL, 'gadget_guru_mark', 'Mark Davis', 'Tech', 72000, '50K-100K', 'Latest Gadget Reviews', 'First look at the newest tech 📱', true, 'markgadgets', 'marktech', 'mark@example.com'),

-- Fashion creators
(NULL, 'fashionista_amy', 'Amy White', 'Fashion', 88000, '50K-100K', 'Outfit Ideas & Styling', 'Affordable fashion for everyone 👗', true, 'amyfashion', 'stylewithamy', 'amy@example.com'),
(NULL, 'streetstyle_tyler', 'Tyler Moore', 'Fashion', 26000, '25K-50K', 'Streetwear & Urban Fashion', 'Sneakerhead | Street style daily 👟', true, 'tylerstyle', null, 'tyler@example.com'),

-- Music/Arts creators
(NULL, 'singer_olivia', 'Olivia Martinez', 'Music', 156000, '100K-250K', 'Original Songs & Covers', 'Independent artist | New music every week 🎤', true, 'oliviasings', 'oliviamusic', 'olivia@example.com'),
(NULL, 'artist_jordan', 'Jordan Hill', 'Arts', 29000, '25K-50K', 'Digital Art & Illustrations', 'Freelance illustrator | Commission open 🎨', true, 'jordandraws', 'jordanart', 'jordan@example.com'),

-- Comedy/Entertainment
(NULL, 'comedy_central_luke', 'Luke Anderson', 'Entertainment', 210000, '100K-250K', 'Sketch Comedy & Parodies', 'Making you laugh daily 😂', true, 'lukecomedy', 'lukeentertainment', 'luke@example.com'),
(NULL, 'funny_skits_mia', 'Mia Thomas', 'Entertainment', 63000, '50K-100K', 'Relatable Comedy Skits', 'Comedy creator | Open for collabs 🤣', true, 'miafunny', 'miacomedy', 'mia@example.com'),

-- Misc niches
(NULL, 'petlover_casey', 'Casey Rodriguez', 'Pets', 47000, '25K-50K', 'Dog Training & Pet Care', 'Dog mom to 3 rescues 🐕', true, 'caseypets', 'caseydogs', 'casey@example.com');

-- Verify insertion
SELECT COUNT(*) as total_test_users FROM collab_directory WHERE email_for_collabs LIKE '%@example.com';
