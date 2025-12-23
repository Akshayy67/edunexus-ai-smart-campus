-- Create role enum
CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'hod', 'faculty', 'student', 'parent');

-- User roles table (security best practice - separate from profiles)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programs
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    degree_type VARCHAR(50) NOT NULL,
    duration_years INTEGER DEFAULT 4,
    total_credits INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batches
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    current_semester INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active',
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department_id UUID REFERENCES departments(id),
    designation VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    is_elective BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage user_roles" ON user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON departments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view programs" ON programs FOR SELECT USING (true);
CREATE POLICY "Admins can manage programs" ON programs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view batches" ON batches FOR SELECT USING (true);
CREATE POLICY "Admins can manage batches" ON batches FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Faculty and admins can manage courses" ON courses FOR ALL 
    USING (public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view their own record" ON students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Faculty and admins can view all students" ON students FOR SELECT 
    USING (public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage students" ON students FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view faculty" ON faculty FOR SELECT USING (true);
CREATE POLICY "Faculty can update their own record" ON faculty FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage faculty" ON faculty FOR ALL USING (public.has_role(auth.uid(), 'admin'));