
-- Create admin_users table for separate admin authentication
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'superuser',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create results table to track student evaluation results
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id),
  lesson_id TEXT NOT NULL REFERENCES public.lessons(id),
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  attempt_date TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for admin tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users (admin-only access)
CREATE POLICY "Admin-only access to admin_users" ON public.admin_users
  FOR ALL USING (false); -- No direct access through RLS, will use service role

-- RLS Policies for results (admins can view all, students can view their own)
CREATE POLICY "Admins can view all results" ON public.results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own results" ON public.results
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "System can insert results" ON public.results
  FOR INSERT WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX idx_results_student_id ON public.results(student_id);
CREATE INDEX idx_results_lesson_id ON public.results(lesson_id);
CREATE INDEX idx_results_subject_id ON public.results(subject_id);
CREATE INDEX idx_admin_users_email ON public.admin_users(email);

-- Update subjects table to include grade and thumbnail support
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT 'Grade 11';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Update lessons table to include thumbnail and preview support
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS preview TEXT;

-- Insert sample admin user (password should be hashed in real implementation)
INSERT INTO public.admin_users (email, full_name, password_hash, role) VALUES
('admin@quanta.edu', 'Dr. John Admin', '$2a$10$example_hash_here', 'superuser');

-- Add some sample results data
INSERT INTO public.results (student_id, subject_id, lesson_id, score, total) 
SELECT 
  u.id,
  'physics',
  'physics-lesson-1',
  FLOOR(RANDOM() * 50 + 50), -- Random score between 50-100
  100
FROM public.users u
LIMIT 5;

INSERT INTO public.results (student_id, subject_id, lesson_id, score, total) 
SELECT 
  u.id,
  'chemistry',
  'chemistry-lesson-1',
  FLOOR(RANDOM() * 50 + 50), -- Random score between 50-100
  100
FROM public.users u
LIMIT 5;
