
-- Create admin role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles, admins can read all
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- DB-backed internships table (public read, admin write)
CREATE TABLE public.internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  role text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT 'Remote',
  domain text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Remote',
  description text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  duration text NOT NULL DEFAULT '',
  stipend text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

-- Everyone can read internships (public, no auth needed)
CREATE POLICY "Anyone can view internships" ON public.internships
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage internships" ON public.internships
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Applications table
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  internship_id uuid REFERENCES public.internships(id) ON DELETE CASCADE,
  internship_title text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  cover_letter text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications" ON public.applications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage applications" ON public.applications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can read all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update/delete profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can read all notifications
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert notifications for any user
CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can read all bookmarks
CREATE POLICY "Admins can view all bookmarks" ON public.bookmarks
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed static internships into DB
INSERT INTO public.internships (title, company, role, location, domain, type, description, skills, duration, stipend) VALUES
('Frontend Developer Intern', 'TechNova', 'Frontend Development', 'San Francisco, CA', 'Web Development', 'Remote', 'Build modern web interfaces using React and TypeScript.', ARRAY['React', 'TypeScript', 'CSS', 'HTML'], '3 months', '$2,000/month'),
('Full Stack Developer Intern', 'WebForge Labs', 'Full Stack Development', 'Austin, TX', 'Web Development', 'Hybrid', 'Develop end-to-end web applications with modern frameworks.', ARRAY['React', 'Node.js', 'MongoDB', 'GraphQL'], '6 months', '$2,800/month'),
('Machine Learning Intern', 'DataMinds AI', 'ML Engineering', 'New York, NY', 'Artificial Intelligence', 'Hybrid', 'Work on NLP models and deploy ML pipelines.', ARRAY['Python', 'TensorFlow', 'NLP', 'Data Science'], '6 months', '$3,000/month'),
('Backend Developer Intern', 'CloudStack Inc.', 'Backend Development', 'Austin, TX', 'Cloud Computing', 'On-site', 'Design and build scalable APIs and microservices.', ARRAY['Node.js', 'PostgreSQL', 'Docker', 'REST APIs'], '4 months', '$2,500/month'),
('UI/UX Design Intern', 'PixelPerfect Studio', 'Design', 'Remote', 'Design', 'Remote', 'Create user-centered designs for web and mobile apps.', ARRAY['Figma', 'Adobe XD', 'Prototyping', 'User Research'], '3 months', '$1,800/month'),
('Data Analyst Intern', 'InsightFlow', 'Data Analysis', 'Chicago, IL', 'Data Science', 'Hybrid', 'Analyze large datasets and build dashboards.', ARRAY['Python', 'SQL', 'Tableau', 'Statistics'], '4 months', '$2,200/month'),
('Cybersecurity Intern', 'SecureNet Labs', 'Security Analysis', 'Washington, DC', 'Cybersecurity', 'On-site', 'Perform vulnerability assessments and security audits.', ARRAY['Network Security', 'Penetration Testing', 'Linux', 'SIEM'], '6 months', '$2,800/month'),
('Mobile Developer Intern', 'AppWorks', 'Mobile Development', 'Seattle, WA', 'Mobile Development', 'Remote', 'Build cross-platform mobile applications.', ARRAY['React Native', 'Flutter', 'iOS', 'Android'], '4 months', '$2,400/month'),
('DevOps Intern', 'InfraCore', 'DevOps Engineering', 'Denver, CO', 'Cloud Computing', 'Remote', 'Automate CI/CD pipelines and manage cloud infrastructure.', ARRAY['AWS', 'Terraform', 'Docker', 'Kubernetes'], '3 months', '$2,600/month'),
('Blockchain Intern', 'ChainForge', 'Blockchain Development', 'Miami, FL', 'Blockchain', 'Remote', 'Develop smart contracts and decentralized applications.', ARRAY['Solidity', 'Ethereum', 'Web3.js', 'Smart Contracts'], '4 months', '$3,000/month'),
('Digital Marketing Intern', 'GrowthPulse', 'Marketing', 'New York, NY', 'Marketing', 'Hybrid', 'Run digital campaigns and analyze marketing performance.', ARRAY['SEO', 'Google Ads', 'Social Media', 'Analytics'], '3 months', '$1,500/month'),
('Product Management Intern', 'LaunchPad', 'Product Management', 'San Francisco, CA', 'Product Management', 'On-site', 'Assist in product roadmap planning and feature prioritization.', ARRAY['Agile', 'Jira', 'Analytics', 'User Stories'], '6 months', '$2,800/month'),
('Game Developer Intern', 'PixelQuest Studios', 'Game Development', 'Los Angeles, CA', 'Game Development', 'Hybrid', 'Design and develop game mechanics and interactive experiences.', ARRAY['Unity', 'C#', 'Game Design', '3D Modeling'], '4 months', '$2,200/month'),
('IoT Engineer Intern', 'SmartEdge', 'Embedded Systems', 'Austin, TX', 'IoT & Embedded', 'On-site', 'Work on IoT prototyping and sensor integration.', ARRAY['Arduino', 'Raspberry Pi', 'C++', 'MQTT'], '3 months', '$2,000/month'),
('Fintech Intern', 'PayFlow', 'Financial Technology', 'New York, NY', 'Finance & Fintech', 'Remote', 'Build payment processing and financial analytics tools.', ARRAY['Python', 'APIs', 'SQL', 'Financial Modeling'], '6 months', '$3,200/month');
