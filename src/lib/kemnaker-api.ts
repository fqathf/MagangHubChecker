import {
  ApplicationAnalysis,
  EnrichedApplication,
  InterviewSchedule,
  ParticipantProfile,
} from "./types";

export const KEMNAKER_API_BASE = "https://api.kemnaker.go.id";
export const MAGANGHUB_WEB_BASE = "https://maganghub.kemnaker.go.id";
export const NACO_AUTH_BASE = "https://account.kemnaker.go.id";

function pickString(
  obj: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string | null {
  if (!obj) return null;
  for (const k of keys) {
    const val = obj[k];
    if (typeof val === "string" && val.trim().length > 0) {
      return val;
    }
  }
  return null;
}

function pickNumber(
  obj: Record<string, unknown> | null | undefined,
  ...keys: string[]
): number | null {
  if (!obj) return null;
  for (const k of keys) {
    const val = obj[k];
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string" && val.trim() !== "") {
      const parsed = Number(val);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

export function enrichApplication(
  raw: Record<string, unknown>
): EnrichedApplication {
  const vacancy = (raw.vacancy as Record<string, unknown>) || {};
  const organizer = (vacancy.organizer as Record<string, unknown>) || {};
  const city =
    (vacancy.city as Record<string, unknown>) ||
    (organizer.city as Record<string, unknown>) ||
    {};
  const batch = (raw.batch as Record<string, unknown>) || {};
  const cohort = (batch.cohort as Record<string, unknown>) || {};
  const rawInterview = raw.interview as Record<string, unknown> | null;

  const status = (
    pickString(raw, "status", "raw_status") || "submitted"
  ).toLowerCase();

  const submittedAt = pickString(raw, "submitted_at", "submittedAt");
  const createdAt = pickString(raw, "created_at", "createdAt");
  const updatedAt = pickString(raw, "updated_at", "updatedAt");
  const selectedAt = pickString(raw, "selected_at", "selectedAt");
  const determinedAt = pickString(raw, "determined_at", "determinedAt");
  const determinationNote = pickString(
    raw,
    "determination_note",
    "determinationNote"
  );
  const rejectionReason = pickString(
    raw,
    "rejection_reason",
    "rejectionReason"
  );
  const canceledAt = pickString(raw, "canceled_at", "canceledAt");
  const cancellationReason = pickString(
    raw,
    "cancellation_reason",
    "cancellationReason"
  );

  const selectionStartDate = pickString(
    batch,
    "selection_start_date",
    "selectionStartDate",
    "participant_selection_start_date"
  ) || pickString(raw, "selection_start_date");

  const selectionEndDate = pickString(
    batch,
    "selection_end_date",
    "selectionEndDate",
    "participant_selection_end_date"
  ) || pickString(raw, "selection_end_date");

  const selectionAnnouncementDate = pickString(
    batch,
    "determination_date",
    "determinationDate",
    "selection_announcement_date"
  ) || pickString(raw, "selection_announcement_date");

  let interview: InterviewSchedule | null = null;
  if (rawInterview && typeof rawInterview === "object") {
    const sched = pickString(rawInterview, "scheduled_at", "scheduledAt");
    const method = pickString(rawInterview, "method");
    const location = pickString(
      rawInterview,
      "location",
      "meeting_url",
      "meetingUrl"
    );
    const note = pickString(rawInterview, "note");
    if (sched || method || location || note) {
      interview = {
        scheduled_at: sched,
        scheduledAt: sched,
        method,
        location,
        note,
      };
    }
  }

  const isCanceled =
    status === "canceled" || Boolean(canceledAt);
  const isDetermined =
    status === "determined" || Boolean(determinedAt);
  const isRejected =
    status === "rejected" ||
    status === "not_determined" ||
    Boolean(rejectionReason);

  const isEarlySignal =
    !isDetermined &&
    !isRejected &&
    !isCanceled &&
    (Boolean(selectedAt) || status === "accepted" || status === "selected");

  const nowMs = Date.now();
  const announcementMs = selectionAnnouncementDate
    ? new Date(selectionAnnouncementDate).getTime()
    : null;
  const isBatchDetermined =
    announcementMs !== null &&
    Number.isFinite(announcementMs) &&
    nowMs >= announcementMs;

  let daysUntilAnnouncement: number | null = null;
  if (announcementMs !== null && Number.isFinite(announcementMs)) {
    daysUntilAnnouncement = Math.ceil(
      (announcementMs - nowMs) / (1000 * 60 * 60 * 24)
    );
  }

  const interviewScheduledStr =
    interview?.scheduled_at || interview?.scheduledAt || null;
  const interviewMs = interviewScheduledStr
    ? new Date(interviewScheduledStr).getTime()
    : null;
  const updatedMs = updatedAt ? new Date(updatedAt).getTime() : null;

  const isBeforeAnnouncementUpdate =
    announcementMs === null ||
    !Number.isFinite(announcementMs) ||
    (updatedMs !== null && updatedMs < announcementMs);

  const hasPostInterviewActivity =
    !isDetermined &&
    !isRejected &&
    !isCanceled &&
    !isEarlySignal &&
    Boolean(interview) &&
    interviewMs !== null &&
    Number.isFinite(interviewMs) &&
    updatedMs !== null &&
    Number.isFinite(updatedMs) &&
    updatedMs >= interviewMs &&
    isBeforeAnnouncementUpdate;

  let statusLabel = "Menunggu Seleksi";
  let statusTone: ApplicationAnalysis["statusTone"] = "slate";
  let signalHeadline: string | null = null;
  let signalDescription: string | null = null;

  if (isDetermined) {
    statusLabel = "Ditetapkan Resmi (Determined)";
    statusTone = "emerald";
    signalHeadline = "SK Penetapan Peserta Magang Aktif";
    signalDescription =
      "Akun Anda telah resmi ditetapkan sebagai peserta pemagangan nasional oleh Kemnaker RI.";
  } else if (isEarlySignal) {
    statusLabel = "Lolos Seleksi Mitra (Sinyal Dini)";
    statusTone = "emerald";
    signalHeadline = "Field selected_at Terdeteksi pada API";
    signalDescription = selectedAt
      ? `Penyelenggara telah menandai kelolosan berkas Anda pada ${new Date(
          selectedAt
        ).toLocaleString("id-ID")} sebelum penetapan akhir dibuka.`
      : "Status internal lamaran tercatat accepted/selected oleh penyelenggara.";
  } else if (hasPostInterviewActivity) {
    statusLabel = "Aktivitas Pasca-Wawancara Terdeteksi";
    statusTone = "amber";
    signalHeadline = "Pembaruan Berkas Setelah Jadwal Wawancara";
    signalDescription = `Tercatat pembaruan data lamaran (updated_at) pada ${
      updatedAt ? new Date(updatedAt).toLocaleString("id-ID") : "-"
    } setelah waktu wawancara tanpa catatan penolakan. Ini mengindikasikan mitra telah memperbarui rekap penilaian wawancara Anda.`;
  } else if (isCanceled) {
    statusLabel = "Dibatalkan Peserta";
    statusTone = "slate";
  } else if (isRejected) {
    statusLabel =
      status === "not_determined" ? "Tidak Ditetapkan" : "Belum Terpilih";
    statusTone = "rose";
  } else if (interview) {
    statusLabel = "Wawancara Terjadwal";
    statusTone = "sky";
  } else if (status === "selection") {
    statusLabel = "Sedang Diseleksi Mitra";
    statusTone = "amber";
  } else if (status === "determination") {
    statusLabel = "Tahap Penentuan Kemnaker";
    statusTone = "amber";
  } else if (status === "completed") {
    statusLabel = "Program Selesai";
    statusTone = "emerald";
  }

  return {
    id: pickString(raw, "id") || crypto.randomUUID(),
    status,
    position_name:
      pickString(vacancy, "position_name", "positionName") ||
      pickString(raw, "position_name", "positionName") ||
      "Posisi Magang",
    company_name:
      pickString(organizer, "name") ||
      pickString(raw, "company_name", "company") ||
      "Penyelenggara Magang",
    company_logo_url:
      pickString(organizer, "logo_url", "logoUrl") ||
      pickString(raw, "logo_url", "company_logo_url"),
    organizer_type:
      pickString(organizer, "organizable_type", "organizableType") ||
      pickString(raw, "organizer_type"),
    location:
      pickString(city, "name") ||
      pickString(vacancy, "address") ||
      pickString(raw, "location"),
    vacancy_id:
      pickString(vacancy, "id") || pickString(raw, "vacancy_id", "vacancyId"),
    batch_number:
      pickNumber(batch, "number") || pickNumber(raw, "batch_number"),
    cohort_year:
      pickNumber(cohort, "year") || pickNumber(raw, "cohort_year") || 2026,
    submitted_at: submittedAt,
    created_at: createdAt,
    updated_at: updatedAt,
    selected_at: selectedAt,
    determined_at: determinedAt,
    determination_note: determinationNote,
    rejection_reason: rejectionReason,
    canceled_at: canceledAt,
    cancellation_reason: cancellationReason,
    consent_given: Boolean(raw.consent_given ?? raw.consentGiven),
    consent_given_at: pickString(raw, "consent_given_at", "consentGivenAt"),
    questionnaire_answers:
      ((raw.questionnaire_answers ??
        raw.questionnaireAnswers) as Record<string, boolean>) || null,
    interview,
    selection_start_date: selectionStartDate,
    selection_end_date: selectionEndDate,
    selection_announcement_date: selectionAnnouncementDate,
    analysis: {
      statusKey: status,
      statusLabel,
      statusTone,
      isEarlySignal,
      hasPostInterviewActivity,
      isBatchDetermined,
      daysUntilAnnouncement,
      signalHeadline,
      signalDescription,
    },
    raw,
  };
}

export function normalizeParticipant(
  rawParticipant: Record<string, unknown> | null,
  nacoUser?: Record<string, unknown> | null
): ParticipantProfile | null {
  if (!rawParticipant && !nacoUser) return null;
  const p = rawParticipant || {};
  const u = nacoUser || (p.user as Record<string, unknown>) || {};
  const pddikti =
    (p.pddikti_verification as Record<string, unknown>) ||
    (p.pddiktiVerification as Record<string, unknown>) ||
    null;

  return {
    id: pickString(p, "id") || pickString(u, "id") || "participant",
    name:
      pickString(u, "name") ||
      pickString(p, "name") ||
      (pddikti ? pickString(pddikti, "student_name", "studentName") : null) ||
      "Peserta MagangHub",
    email: pickString(u, "email") || pickString(p, "email"),
    nik:
      pickString(u, "identity_number", "nik") ||
      pickString(p, "identity_number", "nik"),
    phone: pickString(u, "phone") || pickString(p, "phone"),
    status: pickString(p, "status"),
    verification_step: pickString(p, "verification_step", "verificationStep"),
    is_eligible:
      typeof p.is_eligible === "boolean"
        ? p.is_eligible
        : typeof p.isEligible === "boolean"
          ? p.isEligible
          : null,
    has_joined_national_internship:
      typeof p.has_joined_national_internship === "boolean"
        ? p.has_joined_national_internship
        : typeof p.hasJoinedNationalInternship === "boolean"
          ? p.hasJoinedNationalInternship
          : null,
    eligibility_flags:
      ((p.eligibility_flags ?? p.eligibilityFlags) as Record<
        string,
        boolean
      >) || null,
    pddikti_verification: pddikti
      ? {
          status: pickString(pddikti, "status"),
          is_eligible:
            typeof pddikti.is_eligible === "boolean"
              ? pddikti.is_eligible
              : typeof pddikti.isEligible === "boolean"
                ? pddikti.isEligible
                : null,
          ineligible_reason: pickString(
            pddikti,
            "ineligible_reason",
            "ineligibleReason"
          ),
          student_name: pickString(pddikti, "student_name", "studentName"),
          education_level: pickString(
            pddikti,
            "education_level",
            "educationLevel"
          ),
          university_name: pickString(
            pddikti,
            "university_name",
            "universityName"
          ),
          study_program: pickString(pddikti, "study_program", "studyProgram"),
          graduation_date: pickString(
            pddikti,
            "graduation_date",
            "graduationDate"
          ),
          last_sync_at: pickString(pddikti, "last_sync_at", "lastSyncAt"),
        }
      : null,
    preference: (p.preference as ParticipantProfile["preference"]) || null,
    raw: { ...p, ...(nacoUser ? { _nacoUser: nacoUser } : {}) },
  };
}
