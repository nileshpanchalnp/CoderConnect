/*
  # StackOverflow Clone Database Schema

  ## Overview
  Complete database schema for a StackOverflow clone with questions, answers, comments, voting, and reputation system.

  ## New Tables
  
  ### 1. `profiles`
  - `id` (uuid, references auth.users)
  - `username` (text, unique)
  - `display_name` (text)
  - `avatar_url` (text, optional)
  - `reputation` (integer, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `questions`
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text, rich text content)
  - `author_id` (uuid, references profiles)
  - `views` (integer, default 0)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `answers`
  - `id` (uuid, primary key)
  - `question_id` (uuid, references questions)
  - `author_id` (uuid, references profiles)
  - `content` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `comments`
  - `id` (uuid, primary key)
  - `content` (text)
  - `author_id` (uuid, references profiles)
  - `question_id` (uuid, optional, references questions)
  - `answer_id` (uuid, optional, references answers)
  - `created_at` (timestamptz)

  ### 5. `tags`
  - `id` (uuid, primary key)
  - `name` (text, unique)
  - `created_at` (timestamptz)

  ### 6. `question_tags`
  - `question_id` (uuid, references questions)
  - `tag_id` (uuid, references tags)
  - Primary key: (question_id, tag_id)

  ### 7. `votes`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `question_id` (uuid, optional, references questions)
  - `answer_id` (uuid, optional, references answers)
  - `vote_type` (text, 'like' or 'dislike')
  - `created_at` (timestamptz)
  - Unique constraint: user can only vote once per item

  ## Security
  - Enable RLS on all tables
  - Public read access for questions, answers, comments, tags
  - Authenticated users can create/update/delete their own content
  - Voting and commenting require authentication

  ## Notes
  - Reputation points are calculated and updated via triggers
  - Vote counts are calculated via aggregation queries
  - One user can only vote once per question/answer
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  reputation integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES answers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (question_id IS NOT NULL AND answer_id IS NULL) OR
    (question_id IS NULL AND answer_id IS NOT NULL)
  )
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create question_tags junction table
CREATE TABLE IF NOT EXISTS question_tags (
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (question_id, tag_id)
);

ALTER TABLE question_tags ENABLE ROW LEVEL SECURITY;

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES answers(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  CHECK (
    (question_id IS NOT NULL AND answer_id IS NULL) OR
    (question_id IS NULL AND answer_id IS NOT NULL)
  ),
  UNIQUE (user_id, question_id),
  UNIQUE (user_id, answer_id)
);

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for questions
CREATE POLICY "Questions are viewable by everyone"
  ON questions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own questions"
  ON questions FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS Policies for answers
CREATE POLICY "Answers are viewable by everyone"
  ON answers FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create answers"
  ON answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own answers"
  ON answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own answers"
  ON answers FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS Policies for tags
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for question_tags
CREATE POLICY "Question tags are viewable by everyone"
  ON question_tags FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create question tags"
  ON question_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete question tags for their own questions"
  ON question_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions
      WHERE questions.id = question_tags.question_id
      AND questions.author_id = auth.uid()
    )
  );

-- RLS Policies for votes
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create votes"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update reputation when answer is created
CREATE OR REPLACE FUNCTION update_reputation_on_answer()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET reputation = reputation + 5
  WHERE id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update reputation when comment is created
CREATE OR REPLACE FUNCTION update_reputation_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET reputation = reputation + 2
  WHERE id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for reputation
DROP TRIGGER IF EXISTS trigger_reputation_answer ON answers;
CREATE TRIGGER trigger_reputation_answer
  AFTER INSERT ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_on_answer();

DROP TRIGGER IF EXISTS trigger_reputation_comment ON comments;
CREATE TRIGGER trigger_reputation_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_reputation_on_comment();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_author ON questions(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_author ON answers(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_question ON comments(question_id);
CREATE INDEX IF NOT EXISTS idx_comments_answer ON comments(answer_id);
CREATE INDEX IF NOT EXISTS idx_votes_question ON votes(question_id);
CREATE INDEX IF NOT EXISTS idx_votes_answer ON votes(answer_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);