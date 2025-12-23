-- Create sections table (classes with branch, year, section)
CREATE TABLE public.sections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
    section_name VARCHAR(10) NOT NULL DEFAULT 'A',
    display_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(batch_id, section_name)
);

-- Create student_enrollments table to link students to sections
CREATE TABLE public.student_enrollments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester INTEGER NOT NULL DEFAULT 1,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(student_id, section_id, academic_year)
);

-- Create periods configuration table
CREATE TABLE public.periods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    period_number INTEGER NOT NULL,
    name VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_break BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(period_number)
);

-- Add section_id to timetable_slots for better organization
ALTER TABLE public.timetable_slots ADD COLUMN section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL;
ALTER TABLE public.timetable_slots ADD COLUMN period_id UUID REFERENCES public.periods(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sections
CREATE POLICY "Anyone can view sections" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage sections" ON public.sections FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for student_enrollments
CREATE POLICY "Students view own enrollments" ON public.student_enrollments FOR SELECT 
    USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "Faculty and admins view all enrollments" ON public.student_enrollments FOR SELECT 
    USING (has_role(auth.uid(), 'faculty'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage enrollments" ON public.student_enrollments FOR ALL 
    USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for periods
CREATE POLICY "Anyone can view periods" ON public.periods FOR SELECT USING (true);
CREATE POLICY "Admins can manage periods" ON public.periods FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default periods (8 periods typical school day)
INSERT INTO public.periods (period_number, name, start_time, end_time, is_break) VALUES
(1, 'Period 1', '09:00:00', '09:50:00', false),
(2, 'Period 2', '09:50:00', '10:40:00', false),
(3, 'Break', '10:40:00', '11:00:00', true),
(4, 'Period 3', '11:00:00', '11:50:00', false),
(5, 'Period 4', '11:50:00', '12:40:00', false),
(6, 'Lunch', '12:40:00', '13:30:00', true),
(7, 'Period 5', '13:30:00', '14:20:00', false),
(8, 'Period 6', '14:20:00', '15:10:00', false),
(9, 'Period 7', '15:10:00', '16:00:00', false);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.timetable_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;