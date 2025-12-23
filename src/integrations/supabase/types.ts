export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          action_taken: string | null
          alert_type: string
          created_at: string | null
          data: Json | null
          id: string
          is_acknowledged: boolean | null
          message: string
          recipient_id: string
          recipient_type: string
          related_entity_id: string | null
          related_entity_type: string | null
          requires_action: boolean | null
          severity: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_taken?: string | null
          alert_type: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_acknowledged?: boolean | null
          message: string
          recipient_id: string
          recipient_type: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          requires_action?: boolean | null
          severity: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_taken?: string | null
          alert_type?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_acknowledged?: boolean | null
          message?: string
          recipient_id?: string
          recipient_type?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          requires_action?: boolean | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      ai_audit_log: {
        Row: {
          action_type: string
          confidence: number | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          explanation: string | null
          factors_used: Json | null
          id: string
          input_data: Json | null
          model_version: string | null
          output_data: Json | null
          override_reason: string | null
          processing_time_ms: number | null
          user_id: string | null
          was_overridden: boolean | null
        }
        Insert: {
          action_type: string
          confidence?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          explanation?: string | null
          factors_used?: Json | null
          id?: string
          input_data?: Json | null
          model_version?: string | null
          output_data?: Json | null
          override_reason?: string | null
          processing_time_ms?: number | null
          user_id?: string | null
          was_overridden?: boolean | null
        }
        Update: {
          action_type?: string
          confidence?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          explanation?: string | null
          factors_used?: Json | null
          id?: string
          input_data?: Json | null
          model_version?: string | null
          output_data?: Json | null
          override_reason?: string | null
          processing_time_ms?: number | null
          user_id?: string | null
          was_overridden?: boolean | null
        }
        Relationships: []
      }
      ai_faculty_grading_profile: {
        Row: {
          academic_year: string | null
          avg_marks_given: number | null
          calculated_at: string | null
          course_id: string | null
          deviation_from_dept_avg: number | null
          faculty_id: string
          grading_consistency: number | null
          grading_std_deviation: number | null
          id: string
          median_marks_given: number | null
          sample_size: number | null
          strictness_index: number | null
        }
        Insert: {
          academic_year?: string | null
          avg_marks_given?: number | null
          calculated_at?: string | null
          course_id?: string | null
          deviation_from_dept_avg?: number | null
          faculty_id: string
          grading_consistency?: number | null
          grading_std_deviation?: number | null
          id?: string
          median_marks_given?: number | null
          sample_size?: number | null
          strictness_index?: number | null
        }
        Update: {
          academic_year?: string | null
          avg_marks_given?: number | null
          calculated_at?: string | null
          course_id?: string | null
          deviation_from_dept_avg?: number | null
          faculty_id?: string
          grading_consistency?: number | null
          grading_std_deviation?: number | null
          id?: string
          median_marks_given?: number | null
          sample_size?: number | null
          strictness_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_faculty_grading_profile_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_faculty_grading_profile_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feature_cache: {
        Row: {
          calculated_at: string | null
          entity_id: string
          entity_type: string
          expires_at: string | null
          feature_set: string
          features: Json
          id: string
          is_stale: boolean | null
        }
        Insert: {
          calculated_at?: string | null
          entity_id: string
          entity_type: string
          expires_at?: string | null
          feature_set: string
          features: Json
          id?: string
          is_stale?: boolean | null
        }
        Update: {
          calculated_at?: string | null
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          feature_set?: string
          features?: Json
          id?: string
          is_stale?: boolean | null
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          action_url: string | null
          category: string | null
          confidence: number | null
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          insight_type: string
          is_actionable: boolean | null
          is_read: boolean | null
          message: string
          priority: string | null
          title: string
          user_id: string
          user_type: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          insight_type: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          message: string
          priority?: string | null
          title: string
          user_id: string
          user_type: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          message?: string
          priority?: string | null
          title?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          action_items: Json | null
          completed_at: string | null
          confidence: number | null
          content: string
          created_at: string | null
          estimated_impact: string | null
          expires_at: string | null
          id: string
          is_completed: boolean | null
          priority: number | null
          recommendation_type: string
          student_id: string
          title: string
        }
        Insert: {
          action_items?: Json | null
          completed_at?: string | null
          confidence?: number | null
          content: string
          created_at?: string | null
          estimated_impact?: string | null
          expires_at?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: number | null
          recommendation_type: string
          student_id: string
          title: string
        }
        Update: {
          action_items?: Json | null
          completed_at?: string | null
          confidence?: number | null
          content?: string
          created_at?: string | null
          estimated_impact?: string | null
          expires_at?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: number | null
          recommendation_type?: string
          student_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_risk_scores: {
        Row: {
          academic_factor: number | null
          attendance_factor: number | null
          calculated_at: string | null
          confidence: number | null
          contributing_factors: Json | null
          engagement_factor: number | null
          explanation: string | null
          id: string
          model_version: string | null
          risk_category: string
          risk_score: number
          student_id: string
        }
        Insert: {
          academic_factor?: number | null
          attendance_factor?: number | null
          calculated_at?: string | null
          confidence?: number | null
          contributing_factors?: Json | null
          engagement_factor?: number | null
          explanation?: string | null
          id?: string
          model_version?: string | null
          risk_category: string
          risk_score: number
          student_id: string
        }
        Update: {
          academic_factor?: number | null
          attendance_factor?: number | null
          calculated_at?: string | null
          confidence?: number | null
          contributing_factors?: Json | null
          engagement_factor?: number | null
          explanation?: string | null
          id?: string
          model_version?: string | null
          risk_category?: string
          risk_score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_risk_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_subject_difficulty: {
        Row: {
          academic_year: string | null
          batch_id: string | null
          calculated_at: string | null
          class_average: number | null
          class_std_deviation: number | null
          course_id: string
          difficulty_score: number | null
          failure_rate: number | null
          id: string
          sample_size: number | null
          semester: number | null
          top_performer_ceiling: number | null
        }
        Insert: {
          academic_year?: string | null
          batch_id?: string | null
          calculated_at?: string | null
          class_average?: number | null
          class_std_deviation?: number | null
          course_id: string
          difficulty_score?: number | null
          failure_rate?: number | null
          id?: string
          sample_size?: number | null
          semester?: number | null
          top_performer_ceiling?: number | null
        }
        Update: {
          academic_year?: string | null
          batch_id?: string | null
          calculated_at?: string | null
          class_average?: number | null
          class_std_deviation?: number | null
          course_id?: string
          difficulty_score?: number | null
          failure_rate?: number | null
          id?: string
          sample_size?: number | null
          semester?: number | null
          top_performer_ceiling?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_subject_difficulty_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_subject_difficulty_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_submissions: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          is_late: boolean | null
          marks_obtained: number | null
          status: string | null
          student_id: string | null
          submission_content: string | null
          submitted_at: string | null
          submitted_files: Json | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          marks_obtained?: number | null
          status?: string | null
          student_id?: string | null
          submission_content?: string | null
          submitted_at?: string | null
          submitted_files?: Json | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_late?: boolean | null
          marks_obtained?: number | null
          status?: string | null
          student_id?: string | null
          submission_content?: string | null
          submitted_at?: string | null
          submitted_files?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_submissions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_type: string
          available_from: string | null
          batch_id: string | null
          course_id: string | null
          created_at: string | null
          description: string | null
          due_date: string
          faculty_id: string | null
          id: string
          late_submission_allowed: boolean | null
          status: string | null
          title: string
          total_marks: number
          updated_at: string | null
          weightage_percentage: number | null
        }
        Insert: {
          assessment_type: string
          available_from?: string | null
          batch_id?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          faculty_id?: string | null
          id?: string
          late_submission_allowed?: boolean | null
          status?: string | null
          title: string
          total_marks: number
          updated_at?: string | null
          weightage_percentage?: number | null
        }
        Update: {
          assessment_type?: string
          available_from?: string | null
          batch_id?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          faculty_id?: string | null
          id?: string
          late_submission_allowed?: boolean | null
          status?: string | null
          title?: string
          total_marks?: number
          updated_at?: string | null
          weightage_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_method: string | null
          check_in_time: string | null
          created_at: string | null
          device_id: string | null
          id: string
          marked_by: string | null
          remarks: string | null
          session_id: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_method?: string | null
          check_in_time?: string | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          marked_by?: string | null
          remarks?: string | null
          session_id?: string | null
          status: string
          student_id?: string | null
        }
        Update: {
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_method?: string | null
          check_in_time?: string | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          marked_by?: string | null
          remarks?: string | null
          session_id?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          auto_attendance_enabled: boolean | null
          course_id: string | null
          created_at: string | null
          end_time: string
          faculty_id: string | null
          id: string
          late_threshold_minutes: number | null
          session_date: string
          start_time: string
          status: string | null
          timetable_slot_id: string | null
          zone_id: string | null
        }
        Insert: {
          auto_attendance_enabled?: boolean | null
          course_id?: string | null
          created_at?: string | null
          end_time: string
          faculty_id?: string | null
          id?: string
          late_threshold_minutes?: number | null
          session_date: string
          start_time: string
          status?: string | null
          timetable_slot_id?: string | null
          zone_id?: string | null
        }
        Update: {
          auto_attendance_enabled?: boolean | null
          course_id?: string | null
          created_at?: string | null
          end_time?: string
          faculty_id?: string | null
          id?: string
          late_threshold_minutes?: number | null
          session_date?: string
          start_time?: string
          status?: string | null
          timetable_slot_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_timetable_slot_id_fkey"
            columns: ["timetable_slot_id"]
            isOneToOne: false
            referencedRelation: "timetable_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "geo_fence_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          created_at: string | null
          current_semester: number | null
          end_year: number
          id: string
          is_active: boolean | null
          name: string
          program_id: string | null
          start_year: number
        }
        Insert: {
          created_at?: string | null
          current_semester?: number | null
          end_year: number
          id?: string
          is_active?: boolean | null
          name: string
          program_id?: string | null
          start_year: number
        }
        Update: {
          created_at?: string | null
          current_semester?: number | null
          end_year?: number
          id?: string
          is_active?: boolean | null
          name?: string
          program_id?: string | null
          start_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "batches_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      course_assignments: {
        Row: {
          academic_year: string
          batch_id: string | null
          course_id: string | null
          created_at: string | null
          faculty_id: string | null
          id: string
          role: string | null
          semester: number
        }
        Insert: {
          academic_year: string
          batch_id?: string | null
          course_id?: string | null
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          role?: string | null
          semester: number
        }
        Update: {
          academic_year?: string
          batch_id?: string | null
          course_id?: string | null
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          role?: string | null
          semester?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string | null
          credits: number
          description: string | null
          id: string
          is_elective: boolean | null
          name: string
          program_id: string | null
          semester: number
        }
        Insert: {
          code: string
          created_at?: string | null
          credits: number
          description?: string | null
          id?: string
          is_elective?: boolean | null
          name: string
          program_id?: string | null
          semester: number
        }
        Update: {
          code?: string
          created_at?: string | null
          credits?: number
          description?: string | null
          id?: string
          is_elective?: boolean | null
          name?: string
          program_id?: string | null
          semester?: number
        }
        Relationships: [
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      faculty: {
        Row: {
          created_at: string | null
          department_id: string | null
          designation: string | null
          email: string
          employee_id: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          profile_image_url: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          designation?: string | null
          email: string
          employee_id: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          profile_image_url?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          designation?: string | null
          email?: string
          employee_id?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          profile_image_url?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_fence_zones: {
        Row: {
          building: string | null
          capacity: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          radius_meters: number
          room_number: string | null
          zone_type: string
        }
        Insert: {
          building?: string | null
          capacity?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
          room_number?: string | null
          zone_type: string
        }
        Update: {
          building?: string | null
          capacity?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
          room_number?: string | null
          zone_type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          priority: string | null
          read_at: string | null
          recipient_id: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
        }
        Relationships: []
      }
      periods: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_break: boolean
          name: string
          period_number: number
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_break?: boolean
          name: string
          period_number: number
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_break?: boolean
          name?: string
          period_number?: number
          start_time?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          code: string
          created_at: string | null
          degree_type: string
          department_id: string | null
          duration_years: number | null
          id: string
          name: string
          total_credits: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          degree_type: string
          department_id?: string | null
          duration_years?: number | null
          id?: string
          name: string
          total_credits?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          degree_type?: string
          department_id?: string | null
          duration_years?: number | null
          id?: string
          name?: string
          total_credits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          batch_id: string
          created_at: string
          display_name: string | null
          id: string
          section_name: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          display_name?: string | null
          id?: string
          section_name?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          display_name?: string | null
          id?: string
          section_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academic_year: string
          created_at: string
          enrollment_date: string
          id: string
          section_id: string
          semester: number
          status: string
          student_id: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          enrollment_date?: string
          id?: string
          section_id: string
          semester?: number
          status?: string
          student_id: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          enrollment_date?: string
          id?: string
          section_id?: string
          semester?: number
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          admission_date: string
          created_at: string | null
          date_of_birth: string | null
          email: string
          first_name: string
          gender: string | null
          id: string
          last_name: string
          phone: string | null
          profile_image_url: string | null
          roll_number: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admission_date?: string
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          phone?: string | null
          profile_image_url?: string | null
          roll_number: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admission_date?: string
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          profile_image_url?: string | null
          roll_number?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      timetable_slots: {
        Row: {
          course_assignment_id: string | null
          created_at: string | null
          day_of_week: number
          effective_from: string
          effective_until: string | null
          end_time: string
          id: string
          is_recurring: boolean | null
          period_id: string | null
          section_id: string | null
          slot_type: string | null
          start_time: string
          zone_id: string | null
        }
        Insert: {
          course_assignment_id?: string | null
          created_at?: string | null
          day_of_week: number
          effective_from: string
          effective_until?: string | null
          end_time: string
          id?: string
          is_recurring?: boolean | null
          period_id?: string | null
          section_id?: string | null
          slot_type?: string | null
          start_time: string
          zone_id?: string | null
        }
        Update: {
          course_assignment_id?: string | null
          created_at?: string | null
          day_of_week?: number
          effective_from?: string
          effective_until?: string | null
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          period_id?: string | null
          section_id?: string | null
          slot_type?: string | null
          start_time?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_course_assignment_id_fkey"
            columns: ["course_assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "geo_fence_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "hod"
        | "faculty"
        | "student"
        | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "hod", "faculty", "student", "parent"],
    },
  },
} as const
