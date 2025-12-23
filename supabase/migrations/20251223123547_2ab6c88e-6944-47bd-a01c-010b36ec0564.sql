-- Allow students to insert their own attendance records (for QR scanning)
CREATE POLICY "Students can mark own attendance"
ON public.attendance_records
FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);