import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  reputation: number;
  created_at: string;
  updated_at: string;
  author_id: string;
};

export type Question = {
  id: string;
  title: string;
  description: string;
  author_id: string;
  views: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type Answer = {
  id: string;
  question_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type Comment = {
  id: string;
  content: string;
  author_id: string;
  question_id?: string;
  answer_id?: string;
  created_at: string;
  profiles?: Profile;
};

export type Tag = {
  id: string;
  name: string;
  created_at: string;
};

export type Vote = {
  id: string;
  user_id: string;
  question_id?: string;
  answer_id?: string;
  vote_type: 'like' | 'dislike';
  created_at: string;
};
