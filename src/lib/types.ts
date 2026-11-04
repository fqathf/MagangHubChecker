export interface City {
  id: string;
  code?: string;
  name: string;
  province_id?: string;
  province_name?: string | null;
}

export interface StudyProgram {
  id: string;
  name: string;
}

export interface Organizer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city_id?: string | null;
  city?: City | null;
  organizable_type?: "company" | "government" | string;
  description?: string | null;
  logo_url?: string | null;
}

export interface CurriculumMaterial {
  id?: string;
  month?: number;
  subject?: string;
  description?: string;
  type?: "theory" | "practice" | string;
  min_duration_days?: number;
  max_duration_days?: number;
}

export interface Curriculum {
  id?: string;
  name?: string;
  description?: string;
  materials?: CurriculumMaterial[];
}

export interface BatchTimeline {
  id?: string;
  title?: string;
  start_at?: string;
  finish_at?: string;
}

export interface BatchInfo {
  id: string;
  number?: number;
  cohort?: {
    year?: number;
  };
  participant_registration_start_date?: string | null;
  participant_registration_end_date?: string | null;
  selection_start_date?: string | null;
  selection_end_date?: string | null;
  determination_date?: string | null;
}

export interface Vacancy {
  id: string;
  position_name: string;
  quantity_needed: number;
  approved_quantity?: number;
  total_applications: number;
  competitive_score?: number | null;
  opportunity_score?: number | null;
  task_description?: string | null;
  education_levels?: string[];
  study_program_id?: string | null;
  study_program?: StudyProgram | null;
  study_programs?: StudyProgram[];
  organizer?: Organizer | null;
  batch?: BatchInfo | null;
  working_days_per_week?: number | null;
  days_off?: string[];
  interview_types?: string[];
  is_disability_friendly?: boolean;
  city_id?: string | null;
  city?: City | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  address?: string | null;
  published_at?: string | null;
  curriculums?: Curriculum[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface InterviewSchedule {
  scheduled_at?: string | null;
  scheduledAt?: string | null;
  method?: "online" | "onsite" | string | null;
  location?: string | null;
  note?: string | null;
}

export interface ApplicationAnalysis {
  statusKey: string;
  statusLabel: string;
  statusTone: "emerald" | "amber" | "sky" | "rose" | "slate";
  isEarlySignal: boolean;
  hasPostInterviewActivity: boolean;
  isBatchDetermined: boolean;
  daysUntilAnnouncement: number | null;
  signalHeadline: string | null;
  signalDescription: string | null;
}

export interface EnrichedApplication {
  id: string;
  status: string;
  position_name: string;
  company_name: string;
  company_logo_url: string | null;
  organizer_type: string | null;
  location: string | null;
  vacancy_id: string | null;
  batch_number: number | null;
  cohort_year: number | null;
  submitted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  selected_at: string | null;
  determined_at: string | null;
  determination_note: string | null;
  rejection_reason: string | null;
  canceled_at: string | null;
  cancellation_reason: string | null;
  consent_given: boolean;
  consent_given_at: string | null;
  questionnaire_answers: Record<string, boolean> | null;
  interview: InterviewSchedule | null;
  selection_start_date: string | null;
  selection_end_date: string | null;
  selection_announcement_date: string | null;
  analysis: ApplicationAnalysis;
  raw: Record<string, unknown>;
}

export interface PddiktiVerification {
  status?: string | null;
  is_eligible?: boolean | null;
  ineligible_reason?: string | null;
  student_name?: string | null;
  education_level?: string | null;
  university_name?: string | null;
  study_program?: string | null;
  graduation_date?: string | null;
  last_sync_at?: string | null;
}

export interface ParticipantProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  nik?: string | null;
  phone?: string | null;
  status?: string | null;
  verification_step?: string | null;
  is_eligible?: boolean | null;
  has_joined_national_internship?: boolean | null;
  eligibility_flags?: Record<string, boolean> | null;
  pddikti_verification?: PddiktiVerification | null;
  preference?: {
    preferred_positions?: string[];
    cities?: Array<{ id?: string; city_id?: string; city?: City }>;
  } | null;
  raw: Record<string, unknown>;
}

export interface SavedAccount {
  id: string;
  label: string;
  emailOrNik: string;
  token: string;
  lastSyncedAt: string;
  participant: ParticipantProfile | null;
  applications: EnrichedApplication[];
}
